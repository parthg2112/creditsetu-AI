import os
import asyncio
from typing import List
from dotenv import load_dotenv
from supabase import create_client, Client
from llama_index.core import SimpleDirectoryReader
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

# List of PDFs to ingest
PDF_FILES = [
    "ALERTLIST-FRAUDCOMPANIES.PDF",
    "RBI-FRAUD-RISK-MANAGEMENT-15-07-24.pdf",
    "BANKI15122014.PDF",
    "rbi_fraud_user_notice.PDF"
]

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
    print(f"🚀 Starting ingestion for {len(PDF_FILES)} fraud documents...")
    
    total_chunks = 0
    
    for pdf_file in PDF_FILES:
        print(f"\n📄 Processing: {pdf_file}")
        
        # Resolve path
        project_root_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", pdf_file)
        
        if os.path.exists(project_root_path):
             reader = SimpleDirectoryReader(input_files=[project_root_path])
        elif os.path.exists(f"../{pdf_file}"):
             reader = SimpleDirectoryReader(input_files=[f"../{pdf_file}"])
        else:
            print(f"   ❌ File not found: {pdf_file} (Skipping)")
            continue
            
        try:
            documents = reader.load_data()
            print(f"   ✅ Loaded {len(documents)} pages.")

            # Chunking
            splitter = SentenceSplitter(chunk_size=1024, chunk_overlap=20)
            nodes = splitter.get_nodes_from_documents(documents)
            print(f"   🧩 Split into {len(nodes)} chunks.")

            # Generate Embeddings & Insert
            print("   ⏳ Inserting into Supabase...")
            
            file_count = 0
            for node in nodes:
                content = node.get_content()
                embedding = get_embedding(content)
                
                if not embedding:
                    continue
                    
                # Metadata
                metadata = {
                    "source": pdf_file,
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
                    file_count += 1
                except Exception as e:
                    print(f"      ❌ Error inserting chunk: {e}")

            print(f"   🎉 Inserted {file_count} chunks for {pdf_file}.")
            total_chunks += file_count
            
        except Exception as e:
            print(f"   ❌ Error processing {pdf_file}: {e}")

    print(f"\n✨ Total Ingestion Complete! {total_chunks} chunks inserted across all files.")

if __name__ == "__main__":
    asyncio.run(ingest_documents())
