import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Searching for 'Alpari' in vectors table...")
response = supabase.table("vectors").select("content, metadata").ilike("content", "%Alpari%").execute()

if response.data:
    print(f"Found {len(response.data)} matches!")
    for match in response.data:
        print(f"Source: {match['metadata'].get('source')}")
        print(f"Content Snippet: {match['content'][:100]}...")
else:
    print("No matches found for 'Alpari'.")
