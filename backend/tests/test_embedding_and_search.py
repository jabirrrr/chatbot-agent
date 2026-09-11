import pytest
from app.services.embedding_service import EmbeddingService, EMBEDDING_DIMENSION


@pytest.mark.asyncio
async def test_embedding_vector_dimensions():
    """Ensures generated embedding vectors match 1536 float dimensions."""
    text = "What are your business operating hours on weekends?"
    vector = await EmbeddingService.generate_embedding(text)

    assert isinstance(vector, list)
    assert len(vector) == EMBEDDING_DIMENSION
    assert all(isinstance(v, float) for v in vector)


@pytest.mark.asyncio
async def test_cosine_similarity_identical_and_different():
    """Validates cosine similarity calculation properties."""
    text1 = "How can I schedule an appointment with a doctor?"
    text2 = "How can I schedule an appointment with a doctor?"
    text3 = "Planets in our solar system orbit around the Sun."

    vec1 = await EmbeddingService.generate_embedding(text1)
    vec2 = await EmbeddingService.generate_embedding(text2)
    vec3 = await EmbeddingService.generate_embedding(text3)

    sim_identical = EmbeddingService.cosine_similarity(vec1, vec2)
    sim_unrelated = EmbeddingService.cosine_similarity(vec1, vec3)

    # Identical strings must yield 1.0 (or ~0.9999 due to float rounding)
    assert abs(sim_identical - 1.0) < 1e-4

    # Unrelated strings must have significantly lower similarity than identical
    assert sim_unrelated < sim_identical


@pytest.mark.asyncio
async def test_semantic_ranking():
    """Validates that a query ranks the semantically relevant document highest."""
    target_doc = "We are open Monday through Friday from 9am to 6pm, and Saturdays from 10am to 4pm."
    unrelated_doc = "Quantum computing uses quantum bits or qubits to perform complex state calculations."

    query = "What time do you open on Monday?"

    query_vec = await EmbeddingService.generate_embedding(query)
    target_vec = await EmbeddingService.generate_embedding(target_doc)
    unrelated_vec = await EmbeddingService.generate_embedding(unrelated_doc)

    sim_target = EmbeddingService.cosine_similarity(query_vec, target_vec)
    sim_unrelated = EmbeddingService.cosine_similarity(query_vec, unrelated_vec)

    assert sim_target > sim_unrelated
