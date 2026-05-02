from __future__ import annotations
import chromadb
from pathlib import Path

CHROMA_DIR = Path(__file__).resolve().parent.parent.parent / "chroma_data"

_client: chromadb.ClientAPI | None = None
_collection: chromadb.Collection | None = None


def get_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        CHROMA_DIR.mkdir(exist_ok=True)
        _client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    return _client


def get_collection() -> chromadb.Collection:
    global _collection
    if _collection is None:
        _collection = get_client().get_or_create_collection(
            name="references",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_reference(ref_id: str, embedding: list[float], document: str, metadata: dict):
    get_collection().add(
        ids=[ref_id],
        embeddings=[embedding],
        documents=[document],
        metadatas=[metadata],
    )


def query_references(embedding: list[float], n_results: int = 5) -> dict:
    collection = get_collection()
    if collection.count() == 0:
        return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}
    actual_n = min(n_results, collection.count())
    return collection.query(
        query_embeddings=[embedding],
        n_results=actual_n,
        include=["documents", "metadatas", "distances"],
    )


def delete_reference(ref_id: str):
    get_collection().delete(ids=[ref_id])


def reference_count() -> int:
    return get_collection().count()
