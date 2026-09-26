import os
from dotenv import load_dotenv

load_dotenv()

raw_db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/arena")
if raw_db_url.startswith("postgresql://"):
    raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg://", 1)

cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
cors_origins_list = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

raw_groq_key = os.getenv("GROQ_API_KEY", "").strip().strip('"').strip("'")
raw_gemini_key = os.getenv("GOOGLE_GEMINI_API_KEY", "").strip().strip('"').strip("'")
raw_openai_key = os.getenv("OPENAI_API_KEY", "").strip().strip('"').strip("'")
raw_anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip().strip('"').strip("'")
raw_llm_model = os.getenv("LLM_MODEL", "openai/gpt-oss-20b").strip().strip('"').strip("'")

class Settings:
    DATABASE_URL: str = raw_db_url
    GROQ_API_KEY: str = raw_groq_key
    GOOGLE_GEMINI_API_KEY: str = raw_gemini_key
    OPENAI_API_KEY: str = raw_openai_key
    ANTHROPIC_API_KEY: str = raw_anthropic_key
    LLM_MODEL: str = raw_llm_model or "openai/gpt-oss-20b"
    CORS_ORIGINS: list[str] = cors_origins_list

settings = Settings()

