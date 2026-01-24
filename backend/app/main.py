import os
import tempfile
from typing import Optional
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

app = FastAPI(title="CreditSetu AI Backend", version="1.0.0")

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
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
        "embedding_model": "Gemini text-embedding-004"
    }


def generate_embedding(text: str) -> list[float]:
    """Generate embedding using Gemini text-embedding-004 (768 dimensions)"""
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="RETRIEVAL_DOCUMENT"
    )
    return result['embedding']


async def process_document(loan_id: int, document_id: int, storage_path: str):
    """
    Background task to process document:
    1. Download from Supabase Storage
    2. Parse with LlamaParse
    3. Chunk text
    4. Generate embeddings with Gemini
    5. Store in document_embeddings table
    6. Update document status to 'completed'
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
        
        # 7. Run basic audit analysis
        # TODO: Implement more sophisticated analysis with Gemini
        audit_result = {
            "health_score": "64",  # Mock for now
            "remediation_plan": {
                "gaps": ["High DTI ratio", "Inconsistent cash flow"],
                "action_items": ["Reduce monthly expenses", "Document cash deposits"]
            }
        }
        
        supabase.table("loans").update(audit_result).eq("id", loan_id).execute()
        
        print(f"🎉 Document processing complete for doc_id: {document_id}")
        
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
        "status": "success",
        "text": test_text,
        "embedding_dimensions": len(embedding),
        "embedding_preview": embedding[:5]
    }
