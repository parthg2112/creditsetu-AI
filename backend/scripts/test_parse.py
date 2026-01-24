import asyncio
import os
from dotenv import load_dotenv
from llama_parse import LlamaParse

load_dotenv()

async def main():
    # Helper to check if API key exists
    if not os.getenv("LLAMA_CLOUD_API_KEY"):
        print("Error: LLAMA_CLOUD_API_KEY not found in environment.")
        return

    parser = LlamaParse(result_type="markdown")
    # Using a dummy file path or creating a dummy PDF for testing would be ideal, 
    # but for now we'll just check if we can initialize.
    # To really test, we need a file. 
    print("LlamaParse initialized successfully.")
    
    # Example usage (commented out until we have a file):
    # documents = await parser.aload_data("./sample.pdf")
    # print(documents[0].text[:500])

if __name__ == "__main__":
    asyncio.run(main())
