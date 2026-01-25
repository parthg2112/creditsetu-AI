from llama_index.core import SimpleDirectoryReader
import os

PDF_PATH = "../ALERTLIST-FRAUDCOMPANIES.PDF"

if not os.path.exists(PDF_PATH):
    print(f"File not found: {PDF_PATH}")
else:
    print(f"Loading {PDF_PATH}...")
    documents = SimpleDirectoryReader(input_files=[PDF_PATH]).load_data()
    for doc in documents:
        print("--- PAGE START ---")
        print(doc.text)
        print("--- PAGE END ---")
