from dataclasses import dataclass

from langmem import ReflectionExecutor, create_memory_manager
from chatup.agents.schemas import Episode, ProceduralBehavior, SemanticFact, UserProfile
from chatup.config import Settings
from langgraph.store.postgres import PostgresStore 


def build_store(settings: Settings) -> PostgresStore:
    store = PostgresStore.from_conn_string(settings.database_url)
    store.setup()
    return store

@dataclass
class MemoryRuntime:
    settings: Settings
    semantic: ReflectionExecutor
    profile: ReflectionExecutor
    episodic: ReflectionExecutor
    procedural: ReflectionExecutor

def build_memory_runtime(
    settings: Settings,
    store: PostgresStore,
) -> MemoryRuntime:
    semantic_manager = create_memory_manager(
        settings.memory_model,
        namespace=("users", "{langgraph_user_id}", "semantic"),
        schemas=[SemanticFact],
        instructions="Extract durable facts and preferences from the conversation. Focus on what is important to remember for the assistant to use in the future.",
        store=store
    )
    profile_manager = create_memory_manager(
        settings.memory_model,
        namespace=("users", "{langgraph_user_id}", "profile"),
        schemas=[UserProfile],
        instructions="Extract user profile information from the conversation. Focus on what is important to remember for the assistant to use in the future.",
        store=store
    )
    episodic_manager = create_memory_manager(
        settings.memory_model,
        namespace=("users", "{langgraph_user_id}", "episodic"),
        schemas=[Episode],
        instructions="Capture and reflect on key episodes or situations that shaped the user's needs or interactions. Focus on what is important to remember for the assistant to use in the future.",
        store=store
    )
    procedural_manager = create_memory_manager(
        settings.memory_model,
        namespace=("users", "{langgraph_user_id}", "procedural"),
        schemas=[ProceduralBehavior],
        instructions="Capture and reflect on key procedural behaviors or patterns that the user has exhibited. Focus on what is important to remember for the assistant to use in the future.",
        store=store
    )
    return MemoryRuntime(
        settings=settings,
        semantic=ReflectionExecutor(semantic_manager, store=store),
        profile=ReflectionExecutor(profile_manager, store=store),
        episodic=ReflectionExecutor(episodic_manager, store=store),
        procedural=ReflectionExecutor(procedural_manager, store=store)
    )

