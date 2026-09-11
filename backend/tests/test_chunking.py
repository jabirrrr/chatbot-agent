import pytest
from app.services.chunking_service import ChunkingService


def test_clean_text_formatting():
    """Validates that text normalization strips excessive whitespace and carriage returns."""
    dirty_text = "Hello   world!  \r\n\r\n\n\nThis is a test.    "
    cleaned = ChunkingService.clean_text(dirty_text)

    assert "\r" not in cleaned
    assert "\n\n\n" not in cleaned
    assert cleaned.startswith("Hello world!")
    assert cleaned.endswith("This is a test.")


def test_short_text_single_chunk():
    """Short text below chunk threshold should return exactly one chunk."""
    text = "Helio is an autonomous AI chatbot platform designed for SMB businesses."
    chunks = ChunkingService.split_text(text, chunk_size=500, chunk_overlap=50)

    assert len(chunks) == 1
    assert chunks[0]["chunk_index"] == 0
    assert chunks[0]["content"] == text
    assert chunks[0]["token_count"] > 0


def test_long_text_recursive_splitting_with_overlap():
    """Long text should be split into multiple chunks respecting natural boundaries and overlap."""
    paragraph1 = "First section discusses business opening hours and appointment scheduling options for customers."
    paragraph2 = "Second section explains return policies, refund timelines, and shipping rates for physical orders."
    paragraph3 = "Third section details customer service escalation, human agent handoff, and ticket priority systems."

    full_text = f"{paragraph1}\n\n{paragraph2}\n\n{paragraph3}"

    chunks = ChunkingService.split_text(full_text, chunk_size=120, chunk_overlap=30)

    assert len(chunks) >= 2
    for i, chunk in enumerate(chunks):
        assert chunk["chunk_index"] == i
        assert len(chunk["content"]) > 0
        assert chunk["token_count"] > 0

    # Ensure all original content is preserved across chunks
    combined = " ".join([c["content"] for c in chunks])
    assert "opening hours" in combined
    assert "return policies" in combined
    assert "customer service" in combined


def test_empty_and_whitespace_chunking():
    """Empty or purely whitespace input should gracefully return empty chunk list."""
    assert ChunkingService.split_text("") == []
    assert ChunkingService.split_text("    \n\n\t  ") == []
