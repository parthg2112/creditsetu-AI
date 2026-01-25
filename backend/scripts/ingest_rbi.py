
import os
import sys
from pathlib import Path

# Add backend directory to path so we can import app modules if needed
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from llama_index.core import SimpleDirectoryReader, StorageContext, VectorStoreIndex, Settings
from llama_index.embeddings.google import GeminiEmbedding

from llama_index.core.node_parser import SentenceSplitter
import google.generativeai as genai
from supabase import create_client

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
PDF_PATH = Path(__file__).parent.parent.parent / "Reserve Bank of India.pdf"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.")
    sys.exit(1)

if not GOOGLE_API_KEY:
    print("Error: GOOGLE_API_KEY or GEMINI_API_KEY not set.")
    sys.exit(1)

if not PDF_PATH.exists():
    print(f"Error: PDF not found at {PDF_PATH}")
    sys.exit(1)

def ingest_documents():
    print("🚀 Starting ingestion process...")

    # 1. Setup Gemini Embedding
    print("Configuring Gemini Embeddings...")
    genai.configure(api_key=GOOGLE_API_KEY)
    embed_model = GeminiEmbedding(model_name="models/embedding-001", api_key=GOOGLE_API_KEY)
    Settings.embed_model = embed_model
    Settings.llm = None # We only need embeddings for ingestion

    # 2. Load Documents
    print(f"Loading PDF from {PDF_PATH}...")
    documents = SimpleDirectoryReader(input_files=[str(PDF_PATH)]).load_data()
    print(f"Loaded {len(documents)} document pages.")

    # 3. Setup Supabase Vector Store
    print("Connecting to Supabase...")
    # Ensure the table exists. 
    # Note: You must enable the pgvector extension and create the table in Supabase SQL Editor first.
    # CREATE EXTENSION IF NOT EXISTS vector;
    # CREATE TABLE IF NOT EXISTS vectors (
    #   id uuid primary key,
    #   content text,
    #   metadata jsonb,
    #   embedding vector(768) -- Dimension for Gemini embedding-001 is 768
    # );
    # CREATE FUNCTION match_documents (
    #   query_embedding vector(768),
    #   match_threshold float,
    #   match_count int
    # )
    # RETURNS TABLE (
    #   id uuid,
    #   content text,
    #   metadata jsonb,
    #   similarity float
    # )
    # LANGUAGE plpgsql
    # AS $$
    # BEGIN
    #   RETURN QUERY
    #   SELECT
    #     vectors.id,
    #     vectors.content,
    #     vectors.metadata,
    #     1 - (vectors.embedding <=> query_embedding) as similarity
    #   FROM vectors
    #   WHERE 1 - (vectors.embedding <=> query_embedding) > match_threshold
    #   ORDER BY vectors.embedding <=> query_embedding
    #   LIMIT match_count;
    # END;
    # $$;


    
    # RE-PLAN: Manually generate embeddings and insert using Supabase Client (API).
    # This avoids needing the Postgres password.
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Split text
    splitter = SentenceSplitter(chunk_size=1024, chunk_overlap=20)
    nodes = splitter.get_nodes_from_documents(documents)
    print(f"Split into {len(nodes)} chunks.")
    
    # Generate embeddings and insert
    print("Generating embeddings and inserting into Supabase...")
    
    for i, node in enumerate(nodes):
        content = node.get_content()
        embedding = embed_model.get_text_embedding(content)
        
        data = {
            "content": content,
            "metadata": node.metadata,
            "embedding": embedding
        }
        
        # Insert into 'vectors' table
        try:
            supabase.table("vectors").insert(data).execute()
            if i % 10 == 0:
                print(f"Inserted {i+1}/{len(nodes)} chunks...")
        except Exception as e:
            print(f"Error inserting chunk {i}: {e}")
            # If table doesn't exist, we will fail here.
            
    print("✅ Ingestion complete!")

if __name__ == "__main__":
    ingest_documents()
