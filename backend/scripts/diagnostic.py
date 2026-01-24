#!/usr/bin/env python3
"""
CreditSetu AI - Backend Diagnostic Script
==========================================
Verifies Python backend health, Supabase connections, and RAG pipeline.

Run: python scripts/diagnostic.py
"""

import os
import sys
from pathlib import Path

# Add parent dir for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

# ANSI colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

def print_section(title: str):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{title}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

def check_pass(msg: str):
    print(f"  {GREEN}✓{RESET} {msg}")

def check_fail(msg: str):
    print(f"  {RED}✗{RESET} {msg}")

def check_warn(msg: str):
    print(f"  {YELLOW}⚠{RESET} {msg}")

results = {"passed": 0, "failed": 0, "warnings": 0}

# ============================================================
# 1. Environment Variables Check
# ============================================================
print_section("1. Environment Variables")

required_vars = [
    "LLAMA_CLOUD_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
]

optional_vars = [
    "OPENAI_API_KEY",
]

for var in required_vars:
    value = os.getenv(var)
    if value:
        masked = value[:10] + "..." if len(value) > 15 else value
        check_pass(f"{var} = {masked}")
        results["passed"] += 1
    else:
        check_fail(f"{var} is MISSING!")
        results["failed"] += 1

for var in optional_vars:
    value = os.getenv(var)
    if value:
        masked = value[:10] + "..." if len(value) > 15 else value
        check_pass(f"{var} = {masked}")
        results["passed"] += 1
    else:
        check_warn(f"{var} not set (optional)")
        results["warnings"] += 1

# ============================================================
# 2. Supabase Connection Check
# ============================================================
print_section("2. Supabase Connection")

try:
    from supabase import create_client, Client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase: Client = create_client(supabase_url, supabase_key)
    check_pass("Supabase client initialized")
    results["passed"] += 1
    
    # Test documents table
    try:
        docs_result = supabase.table("documents").select("id").limit(1).execute()
        check_pass(f"'documents' table accessible")
        results["passed"] += 1
    except Exception as e:
        check_fail(f"'documents' table error: {e}")
        results["failed"] += 1
    
    # Test document_embeddings table
    try:
        emb_result = supabase.table("document_embeddings").select("id").limit(1).execute()
        check_pass(f"'document_embeddings' table accessible")
        results["passed"] += 1
    except Exception as e:
        check_fail(f"'document_embeddings' table error: {e}")
        results["failed"] += 1
        
    # Test loans table
    try:
        loans_result = supabase.table("loans").select("id").limit(1).execute()
        check_pass(f"'loans' table accessible")
        results["passed"] += 1
    except Exception as e:
        check_fail(f"'loans' table error: {e}")
        results["failed"] += 1

    # Test Storage bucket
    try:
        # List files in credit-setu bucket
        files = supabase.storage.from_("credit-setu").list()
        check_pass(f"'credit-setu' storage bucket accessible ({len(files)} items)")
        results["passed"] += 1
    except Exception as e:
        check_fail(f"Storage bucket error: {e}")
        results["failed"] += 1

except ImportError:
    check_fail("supabase package not installed! Run: pip install supabase")
    results["failed"] += 1
except Exception as e:
    check_fail(f"Supabase connection failed: {e}")
    results["failed"] += 1

# ============================================================
# 3. LlamaParse Check
# ============================================================
print_section("3. LlamaParse Configuration")

try:
    from llama_parse import LlamaParse
    check_pass("LlamaParse imported successfully")
    results["passed"] += 1
    
    llama_key = os.getenv("LLAMA_CLOUD_API_KEY")
    if llama_key and llama_key.startswith("llx-"):
        check_pass("LLAMA_CLOUD_API_KEY format looks valid")
        results["passed"] += 1
    else:
        check_warn("LLAMA_CLOUD_API_KEY may be invalid (should start with 'llx-')")
        results["warnings"] += 1
        
except ImportError:
    check_fail("llama-parse package not installed! Run: pip install llama-parse")
    results["failed"] += 1

# ============================================================
# 4. OpenAI Embeddings Check
# ============================================================
print_section("4. OpenAI Embeddings Configuration")

try:
    import openai
    check_pass("OpenAI package imported successfully")
    results["passed"] += 1
    
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        if openai_key.startswith("sk-"):
            check_pass("OPENAI_API_KEY format looks valid")
            results["passed"] += 1
        else:
            check_warn("OPENAI_API_KEY may be invalid (should start with 'sk-')")
            results["warnings"] += 1
    else:
        check_warn("OPENAI_API_KEY not set - embeddings will fail")
        results["warnings"] += 1
        
except ImportError:
    check_fail("openai package not installed! Run: pip install openai")
    results["failed"] += 1

# ============================================================
# 5. Audit-Loan Endpoint Logic Check
# ============================================================
print_section("5. Audit-Loan Endpoint Requirements")

checks = [
    ("Download file from Supabase Storage", "supabase.storage.from_('bucket').download()"),
    ("Split text into chunks", "Use SentenceSplitter or TokenTextSplitter from llama-index"),
    ("Generate 1536-dim embeddings", "Use OpenAI text-embedding-3-small model"),
    ("Insert embeddings to Postgres", "supabase.table('document_embeddings').insert()"),
    ("Update document status", "supabase.table('documents').update({'status': 'completed'})"),
]

print("  Recommended implementation checklist:")
for check, hint in checks:
    print(f"  {YELLOW}☐{RESET} {check}")
    print(f"      Hint: {hint}")

# ============================================================
# Summary
# ============================================================
print_section("DIAGNOSTIC SUMMARY")

total = results["passed"] + results["failed"] + results["warnings"]
print(f"  Passed:   {GREEN}{results['passed']}{RESET}")
print(f"  Failed:   {RED}{results['failed']}{RESET}")
print(f"  Warnings: {YELLOW}{results['warnings']}{RESET}")

if results["failed"] == 0:
    print(f"\n  {GREEN}{'='*50}{RESET}")
    print(f"  {GREEN}✓ READY FOR PRODUCTION (with {results['warnings']} warnings){RESET}")
    print(f"  {GREEN}{'='*50}{RESET}")
else:
    print(f"\n  {RED}{'='*50}{RESET}")
    print(f"  {RED}✗ NOT READY - Fix {results['failed']} failed checks{RESET}")
    print(f"  {RED}{'='*50}{RESET}")
