from contextvars import ContextVar
from functools import lru_cache
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DEFAULT_TENANT_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:@localhost/manpro",
)

MASTER_DATABASE_URL = os.getenv(
    "MASTER_DATABASE_URL",
    "mysql+pymysql://root:@localhost/master_erp",
)

_tenant_database_url = ContextVar("tenant_database_url", default=DEFAULT_TENANT_DATABASE_URL)


@lru_cache(maxsize=64)
def _session_factory(database_url):
    engine = create_engine(database_url, pool_pre_ping=True)
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def set_tenant_database_url(database_url):
    return _tenant_database_url.set(database_url or DEFAULT_TENANT_DATABASE_URL)


def reset_tenant_database_url(token):
    _tenant_database_url.reset(token)


def SessionLocal():
    return _session_factory(_tenant_database_url.get())()


master_engine = create_engine(MASTER_DATABASE_URL, pool_pre_ping=True)

MasterSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=master_engine,
)


def build_mysql_url(database_name, user=None, password=None, host=None, port=None):
    db_user = user if user is not None else os.getenv("TENANT_DB_USER", "root")
    db_password = "" if password is None else password
    db_host = host or os.getenv("TENANT_DB_HOST", "localhost")
    db_port = port or os.getenv("TENANT_DB_PORT", "3306")

    encoded_user = quote_plus(db_user)
    encoded_password = quote_plus(db_password)

    return f"mysql+pymysql://{encoded_user}:{encoded_password}@{db_host}:{db_port}/{database_name}"
