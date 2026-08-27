import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://querymind:querymind123@localhost:5432/querymind_db"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)
