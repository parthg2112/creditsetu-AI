import os
import asyncio
from typing import List
from dotenv import load_dotenv
from supabase import create_client, Client
from llama_index.core import SimpleDirectoryReader, Document
from llama_index.core.node_parser import SentenceSplitter
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GOOGLE_API_KEY:
    raise ValueError("Missing environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GOOGLE_API_KEY")

# Initialize Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GOOGLE_API_KEY)

# Constants
PDF_PATH = "loan literacy guide for borrowers.pdf"  # Path relative to project root or absolute
EMBEDDING_MODEL = "models/embedding-001"

def get_embedding(text: str) -> List[float]:
    """Generates embedding using Gemini API"""
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []

async def ingest_documents():
    print(f"🚀 Starting ingestion for: {PDF_PATH}")
    
    # 1. Load Document
    if not os.path.exists(PDF_PATH):
        # Try looking in the parent directory if running from backend/scripts
        # Assuming script is run from backend/ root, so ../ points to project root
        project_root_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", PDF_PATH)
        if os.path.exists(project_root_path):
             reader = SimpleDirectoryReader(input_files=[project_root_path])
        elif os.path.exists(f"../{PDF_PATH}"):
             reader = SimpleDirectoryReader(input_files=[f"../{PDF_PATH}"])
        else:
            raise FileNotFoundError(f"File not found: {PDF_PATH} or ../{PDF_PATH}")
    else:
        reader = SimpleDirectoryReader(input_files=[PDF_PATH])
        
    documents = reader.load_data()
    print(f"✅ Loaded {len(documents)} pages.")

    # 2. Chunking
    splitter = SentenceSplitter(chunk_size=1024, chunk_overlap=20)
    nodes = splitter.get_nodes_from_documents(documents)
    print(f"🧩 Split into {len(nodes)} chunks.")

    # 3. Generate Embeddings & Insert into Supabase
    print("⏳ Generating embeddings and inserting into Supabase...")
    
    count = 0
    for node in nodes:
        content = node.get_content()
        embedding = get_embedding(content)
        
        if not embedding:
            continue
            
        # Metadata
        metadata = {
            "source": "loan_literacy_guide.pdf",
            "page_label": node.metadata.get("page_label", "N/A")
        }

        # Insert into Supabase 'vectors' table
        data = {
            "content": content,
            "metadata": metadata,
            "embedding": embedding
        }
        
        try:
            supabase.table("vectors").insert(data).execute()
            count += 1
            print(f"   Inserted chunk {count}/{len(nodes)}")
        except Exception as e:
            print(f"   ❌ Error inserting chunk {count}: {e}")

    print(f"🎉 Ingestion Complete! {count} chunks inserted.")

if __name__ == "__main__":
    asyncio.run(ingest_documents())
