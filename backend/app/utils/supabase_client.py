import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client = create_client(url, key)

def get_chat_history(session_id: str):
    try:
        response = supabase.table("chats").select("*").eq("session_id", session_id).order("created_at").execute()
        return response.data
    except Exception as e:
        print(f"Supabase Error (get_chat_history): {e}")
        return []

def save_message(session_id: str, role: str, content: str, user_email: str = None):
    try:
        data = {
            "session_id": session_id,
            "role": role,
            "content": content,
            "user_email": user_email
        }
        supabase.table("chats").insert(data).execute()
    except Exception as e:
        print(f"Supabase Error (save_message): {e}")

def get_latest_session(user_email: str):
    try:
        # Get the most recent message for this user to find the last session_id
        response = supabase.table("chats").select("session_id").eq("user_email", user_email).order("created_at", desc=True).limit(1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]["session_id"]
        return None
    except Exception as e:
        print(f"Supabase Error (get_latest_session): {e}")
        return None

def delete_chat_history(session_id: str):
    try:
        supabase.table("chats").delete().eq("session_id", session_id).execute()
        return True
    except Exception as e:
        print(f"Supabase Error (delete_chat_history): {e}")
        return False
