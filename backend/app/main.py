import os
import json
import tempfile
import warnings
from typing import Optional

# Suppress noisy warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message=".*NotOpenSSLWarning.*")
warnings.filterwarnings("ignore", message=".*google.generativeai.*")

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
import google.generativeai as genai

load_dotenv()

# Initialize clients
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Initialize Gemini model for analysis
# Using gemini-2.0-flash (stable) instead of exp version for better rate limits
gemini_model = genai.GenerativeModel('gemini-2.0-flash')

app = FastAPI(title="CreditSetu AI Backend", version="1.0.0")

# CORS Setup: Allows your frontend (React/Next.js) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace "*" with your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic schemas
class AuditRequest(BaseModel):
    loan_id: int
    document_id: int
    storage_path: str


class AuditResponse(BaseModel):
    score: int
    readiness: str
    gaps: list[str]
    action_items: list[str]


@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CreditSetu AI Backend",
        "version": "1.0.0",
        "embedding_model": "Gemini text-embedding-004",
        "llm_model": "Gemini 1.5 Flash"
    }


def generate_embedding(text: str) -> list[float]:
    """Generate embedding using Gemini text-embedding-004 (768 dimensions)"""
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="RETRIEVAL_DOCUMENT"
    )
    return result['embedding']


async def generate_loan_summary(loan_id: int, document_id: int) -> dict:
    """
    The Financial Auditor - Analyzes document chunks to generate a structured loan summary.
    
    1. Pulls important chunks using keyword search
    2. Sends to Gemini with a Banker Prompt
    3. Returns structured JSON with health_score, red_flags, and strengths
    """
    print(f"🏦 Starting Financial Audit for loan_id: {loan_id}")
    
    # Keywords that indicate important financial information
    financial_keywords = [
        "balance", "emi", "salary", "income", "revenue", "profit", "loss",
        "debt", "loan", "credit", "gst", "tax", "payment", "outstanding",
        "turnover", "expense", "liability", "asset", "cash flow", "bank"
    ]
    
    # Fetch document chunks from the database
    result = supabase.table("document_embeddings") \
        .select("content, metadata") \
        .eq("document_id", document_id) \
        .execute()
    
    if not result.data:
        print("⚠️ No document chunks found")
        return {
            "health_score": 0,
            "red_flags": ["No document data available for analysis"],
            "strengths": [],
            "summary": "Unable to analyze - no document content found."
        }
    
    # Filter and prioritize chunks containing financial keywords
    all_chunks = result.data
    relevant_chunks = []
    
    for chunk in all_chunks:
        content_lower = chunk["content"].lower()
        relevance_score = sum(1 for kw in financial_keywords if kw in content_lower)
        if relevance_score > 0:
            relevant_chunks.append({
                "content": chunk["content"],
                "relevance": relevance_score
            })
    
    # Sort by relevance and take top chunks
    relevant_chunks.sort(key=lambda x: x["relevance"], reverse=True)
    top_chunks = relevant_chunks[:10] if relevant_chunks else all_chunks[:5]
    
    # Combine chunks for analysis
    context = "\n\n---\n\n".join([
        c["content"] if isinstance(c, dict) and "content" in c else c.get("content", str(c))
        for c in top_chunks
    ])
    
    print(f"📊 Analyzing {len(top_chunks)} relevant chunks...")
    
    # The Banker Prompt
    banker_prompt = f"""You are a Senior Credit Underwriter with 20 years of experience in MSME (Micro, Small and Medium Enterprise) lending at a major Indian bank.

Your task is to analyze the following financial document excerpts and provide a structured loan readiness assessment.

DOCUMENT EXCERPTS:
{context}

INSTRUCTIONS:
1. Analyze the financial health based on available data
2. Identify any red flags that would concern a loan officer
3. Identify strengths that support loan approval
4. Calculate a health score from 0-100 based on:
   - 80-100: Strong candidate, likely approval
   - 60-79: Moderate risk, may need conditions
   - 40-59: High risk, significant concerns
   - 0-39: Very high risk, likely rejection

RESPOND ONLY WITH A VALID JSON OBJECT in this exact format (no markdown, no explanation):
{{
    "health_score": <number 0-100>,
    "red_flags": ["<flag1>", "<flag2>"],
    "strengths": ["<strength1>", "<strength2>"],
    "summary": "<2-3 sentence overall assessment>",
    "recommended_actions": ["<action1>", "<action2>"]
}}

If the document doesn't contain financial data, still provide a reasonable assessment based on what is available, noting the lack of financial specifics as a red flag."""

    try:
        # Call Gemini for analysis
        response = gemini_model.generate_content(banker_prompt)
        response_text = response.text.strip()
        
        # Clean up response (remove markdown code blocks if present)
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        # Parse JSON
        audit_result = json.loads(response_text)
        
        print(f"✅ Audit complete - Health Score: {audit_result.get('health_score', 'N/A')}")
        print(f"   Red Flags: {audit_result.get('red_flags', [])}")
        print(f"   Strengths: {audit_result.get('strengths', [])}")
        
        return audit_result
        
    except json.JSONDecodeError as e:
        print(f"⚠️ Failed to parse Gemini response as JSON: {e}")
        print(f"   Raw response: {response_text[:500]}")
        return {
            "health_score": 50,
            "red_flags": ["Analysis incomplete - parsing error"],
            "strengths": ["Document successfully processed"],
            "summary": "Partial analysis completed. Please review manually.",
            "recommended_actions": ["Request manual review"]
        }
    except Exception as e:
        print(f"❌ Error in financial audit: {e}")
        return {
            "health_score": 0,
            "red_flags": [f"Analysis failed: {str(e)}"],
            "strengths": [],
            "summary": "Unable to complete analysis due to an error.",
            "recommended_actions": ["Retry document upload"]
        }


async def process_document(loan_id: int, document_id: int, storage_path: str):
    """
    Background task to process document:
    1. Download from Supabase Storage
    2. Parse with LlamaParse
    3. Chunk text
    4. Generate embeddings with Gemini
    5. Store in document_embeddings table
    6. Update document status to 'completed'
    7. Run Financial Auditor for gap analysis
    """
    try:
        print(f"🔄 Starting document processing for doc_id: {document_id}")
        
        # 1. Download file from Supabase Storage
        print(f"📥 Downloading file: {storage_path}")
        file_bytes = supabase.storage.from_("credit-setu").download(storage_path)
        
        # Save to temp file for LlamaParse
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        
        print(f"💾 Saved to temp file: {tmp_path}")
        
        # 2. Parse PDF to Markdown using LlamaParse
        print("📄 Parsing PDF with LlamaParse...")
        from llama_parse import LlamaParse
        
        parser = LlamaParse(
            api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
            result_type="markdown",
            verbose=True
        )
        documents = await parser.aload_data(tmp_path)
        
        if not documents:
            raise Exception("LlamaParse returned no documents")
        
        full_text = "\n\n".join([doc.text for doc in documents])
        print(f"✅ Parsed {len(documents)} pages, {len(full_text)} chars")
        
        # 3. Chunk the text
        print("✂️ Chunking text...")
        from llama_index.core.node_parser import SentenceSplitter
        
        splitter = SentenceSplitter(chunk_size=512, chunk_overlap=50)
        chunks = splitter.split_text(full_text)
        print(f"✅ Created {len(chunks)} chunks")
        
        # 4. Generate embeddings with Gemini
        print("🧠 Generating embeddings with Gemini...")
        
        embeddings_data = []
        for i, chunk in enumerate(chunks):
            embedding = generate_embedding(chunk)
            embeddings_data.append({
                "document_id": document_id,
                "content": chunk,
                "embedding": embedding,
                "metadata": {"chunk_index": i, "loan_id": loan_id}
            })
            
            if (i + 1) % 10 == 0:
                print(f"   Processed {i + 1}/{len(chunks)} chunks")
        
        print(f"✅ Generated {len(embeddings_data)} embeddings (768 dimensions)")
        
        # 5. Store in document_embeddings table
        print("💾 Storing embeddings in Supabase...")
        for emb in embeddings_data:
            supabase.table("document_embeddings").insert(emb).execute()
        
        print(f"✅ Stored {len(embeddings_data)} embeddings")
        
        # 6. Update document status to 'completed'
        print("✅ Updating document status to 'completed'...")
        supabase.table("documents").update({"status": "completed"}).eq("id", document_id).execute()
        
        # 7. Run Financial Auditor
        print("🏦 Running Financial Auditor...")
        audit_result = await generate_loan_summary(loan_id, document_id)
        
        # Save audit result to loans table
        loan_update = {
            "health_score": str(audit_result.get("health_score", 0)),
            "status": "ready",
            "remediation_plan": {
                "red_flags": audit_result.get("red_flags", []),
                "strengths": audit_result.get("strengths", []),
                "summary": audit_result.get("summary", ""),
                "recommended_actions": audit_result.get("recommended_actions", [])
            }
        }
        
        supabase.table("loans").update(loan_update).eq("id", loan_id).execute()
        
        print(f"🎉 Document processing complete for doc_id: {document_id}")
        print(f"   Health Score: {audit_result.get('health_score', 'N/A')}")
        
        # Cleanup temp file
        os.unlink(tmp_path)
        
    except Exception as e:
        print(f"❌ Error processing document: {e}")
        # Update status to failed
        try:
            supabase.table("documents").update({"status": "failed"}).eq("id", document_id).execute()
        except:
            pass
        raise


@app.post("/api/python/audit-loan")
async def audit_loan(request: AuditRequest, background_tasks: BackgroundTasks):
    """
    Triggered by Next.js frontend after document upload.
    Starts background processing of the document.
    """
    try:
        print(f"📥 Received audit request:")
        print(f"   - loan_id: {request.loan_id}")
        print(f"   - document_id: {request.document_id}")
        print(f"   - storage_path: {request.storage_path}")
        
        # Add to background tasks so we don't block the frontend
        background_tasks.add_task(
            process_document,
            request.loan_id,
            request.document_id,
            request.storage_path
        )
        
        return {
            "status": "success",
            "message": "Document processing started",
            "loan_id": request.loan_id,
            "document_id": request.document_id
        }
        
    except Exception as e:
        print(f"❌ Error processing audit request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/python/loan-summary/{loan_id}")
async def get_loan_summary(loan_id: int):
    """
    Fetch the loan summary/audit result for a specific loan.
    """
    try:
        result = supabase.table("loans") \
            .select("id, health_score, status, remediation_plan, created_at") \
            .eq("id", loan_id) \
            .single() \
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        return {
            "status": "success",
            "data": result.data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/python/rerun-audit/{loan_id}")
async def rerun_audit(loan_id: int):
    """
    Re-run the financial auditor on an existing loan.
    Useful for re-analyzing after document updates.
    """
    try:
        # Get the latest document for this loan
        doc_result = supabase.table("documents") \
            .select("id") \
            .eq("loan_id", loan_id) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        
        if not doc_result.data:
            raise HTTPException(status_code=404, detail="No documents found for this loan")
        
        document_id = doc_result.data[0]["id"]
        
        # Run the audit
        audit_result = await generate_loan_summary(loan_id, document_id)
        
        # Update the loan
        loan_update = {
            "health_score": str(audit_result.get("health_score", 0)),
            "status": "ready",
            "remediation_plan": {
                "red_flags": audit_result.get("red_flags", []),
                "strengths": audit_result.get("strengths", []),
                "summary": audit_result.get("summary", ""),
                "recommended_actions": audit_result.get("recommended_actions", [])
            }
        }
        
        supabase.table("loans").update(loan_update).eq("id", loan_id).execute()
        
        return {
            "status": "success",
            "audit_result": audit_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/test-parse")
async def test_parse(file: UploadFile = File(...)):
    """
    Test endpoint: Upload a PDF and see the parsed Markdown output.
    """
    from llama_parse import LlamaParse
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        parser = LlamaParse(
            api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
            result_type="markdown",
            verbose=True
        )
        documents = await parser.aload_data(tmp_path)
        
        result = {
            "status": "success",
            "filename": file.filename,
            "pages": len(documents),
            "markdown_preview": documents[0].text[:2000] if documents else ""
        }
        
        return result
        
    finally:
        os.unlink(tmp_path)


@app.get("/test-embedding")
async def test_embedding():
    """Test Gemini embedding generation"""
    test_text = "This is a test sentence to verify embedding generation."
    embedding = generate_embedding(test_text)
    return {
        "status": "Active", 
        "mode": "Manual Entry Mode", 
        "system": "Creditsetu AI Orchestrator"
    }