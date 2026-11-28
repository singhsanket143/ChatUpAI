from chatup.config import Settings
from langgraph.store.postgres import PostgresStore 


def build_store(settings: Settings) -> PostgresStore:
    store = PostgresStore.from_conn_string(settings.database_url)
    store.setup()
    return store
