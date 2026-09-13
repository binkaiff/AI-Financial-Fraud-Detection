from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


def get_database_url() -> str:
    if settings.DATABASE_URL:
        database_url = settings.DATABASE_URL

        # Neon commonly gives postgresql://
        # SQLAlchemy + psycopg expects postgresql+psycopg://
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )

        return database_url

    return (
        f"mysql+pymysql://"
        f"{settings.DB_USER}:"
        f"{settings.DB_PASSWORD}@"
        f"{settings.DB_HOST}:"
        f"{settings.DB_PORT}/"
        f"{settings.DB_NAME}"
    )


DATABASE_URL = get_database_url()


engine_kwargs = {
    "pool_pre_ping": True,
}

if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {
        "check_same_thread": False
    }


engine = create_engine(
    DATABASE_URL,
    **engine_kwargs,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()