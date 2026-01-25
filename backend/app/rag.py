
import os
from typing import List, Dict, Any
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GOOGLE_API_KEY:
    print("Warning: RAG environment variables missing.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')
embed_model_name = "models/embedding-001"

async def query_rbi_docs(query: str) -> str:
    """
    Queries the RBI documents using RAG.
    1. Generates embedding for the query.
    2. Searches Supabase for relevant chunks.
    3. Generates answer using Gemini.
    """
    try:
        # 1. Generate Embedding
        embedding_result = genai.embed_content(
            model=embed_model_name,
            content=query,
            task_type="retrieval_query"
        )
        query_embedding = embedding_result['embedding']

        # 2. Search Supabase (RPC call)
        # Assumes 'match_documents' function exists in Supabase
        response = supabase.rpc(
            "match_documents",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.5, # Adjust as needed
                "match_count": 5
            }
        ).execute()
        
        matches = response.data
        
        if not matches:
            return "I couldn't find any specific information in the RBI documents regarding your query."

        # 3. Construct Context
        context_str = "\n\n".join([f"Chunk {i+1}: {match['content']}" for i, match in enumerate(matches)])
        
        # 4. Generate Answer
        prompt = f"""
        You are an expert banking assistant. Answer the user's question based ONLY on the following context from RBI regulations.
        If the answer is not in the context, say you don't know based on the available documents.
        
        Context:
        {context_str}
        
        User Question: {query}
        
        Answer:
        """
        
        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        print(f"RAG Error: {e}")
        return "Sorry, I encountered an error while searching the banking regulations."

async def retrieve_context(query: str) -> tuple[str, list[str]]:
    """
    Retrieves relevant chunks from all documents (RBI + Literacy Guide).
    Returns (context_string, list_of_sources).
    """
    try:
        # 1. Generate Embedding
        embedding_result = genai.embed_content(
            model=embed_model_name,
            content=query,
            task_type="retrieval_query"
        )
        query_embedding = embedding_result['embedding']

        # 2. Search Supabase
        response = supabase.rpc(
            "match_documents",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.5,
                "match_count": 5
            }
        ).execute()
        
        matches = response.data or []
        
        # 3. Keyword Search (Fallback/Augmentation)
        # Split query into words, filter stop words
        stop_words = {"is", "are", "the", "a", "an", "in", "on", "at", "to", "for", "of", "with", "and", "or", "what", "where", "how", "when", "who", "why", "company", "good", "bad", "right", "wrong", "safe", "legit", "scam", "fraud", "list", "check", "verify"}
        keywords = [w for w in query.split() if w.lower() not in stop_words and len(w) > 3]
        
        keyword_matches = []
        if keywords:
            print(f"DEBUG: Running keyword search for: {keywords}")
            for keyword in keywords:
                try:
                    # Search for the keyword in content
                    kw_response = supabase.table("vectors").select("content, metadata").ilike("content", f"%{keyword}%").limit(3).execute()
                    if kw_response.data:
                        keyword_matches.extend(kw_response.data)
                except Exception as e:
                    print(f"Keyword search error for {keyword}: {e}")

        # 4. Combine and Deduplicate
        all_matches = matches + keyword_matches
        seen_content = set()
        unique_matches = []
        
        for match in all_matches:
            content = match['content']
            if content not in seen_content:
                seen_content.add(content)
                unique_matches.append(match)

        if not unique_matches:
            return "", []

        # 5. Construct Context with Source
        context_parts = []
        sources = []
        for match in unique_matches:
            # print(f"DEBUG METADATA: {match.get('metadata')}")
            source = match.get('metadata', {}).get('source', match.get('metadata', {}).get('file_name', 'Unknown Source'))
            content = match['content']
            # print(f"DEBUG CONTENT SAMPLE: {content[:200]}...")
            context_parts.append(f"Source: {source}\nContent: {content}")
            sources.append(source)
            
        return "\n\n".join(context_parts), list(set(sources))

    except Exception as e:
        print(f"RAG Retrieval Error: {e}")
        return "", []
