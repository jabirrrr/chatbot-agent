import uuid
from datetime import datetime, timezone
import pytest
from app.models.knowledge import KnowledgeSource, DocumentChunk, BusinessInfo
from app.schemas.knowledge import KnowledgeSourceRead, BusinessInfoRead
from app.services.knowledge_service import KnowledgeService


def test_business_info_faq_creation():
    """Validates structured business info and FAQ model initialization."""
    org_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    faq = BusinessInfo(
        id=uuid.uuid4(),
        organization_id=org_id,
        category="faq",
        question="Do you offer free customer consultations?",
        answer="Yes, all initial 15-minute consultations are completely free of charge.",
        is_active=True,
        created_at=now,
        updated_at=now
    )

    assert faq.organization_id == org_id
    assert faq.category == "faq"
    assert "free" in faq.answer
    assert faq.is_active is True

    schema = BusinessInfoRead.model_validate(faq)
    assert schema.question == faq.question
    assert schema.answer == faq.answer
    assert schema.id == faq.id


def test_text_extraction_from_plain_text():
    """Validates text parsing from TXT and MD files."""
    text_content = b"Welcome to Acme Dental. We provide comprehensive teeth cleaning and whitening."
    parsed = KnowledgeService.extract_text_from_file(text_content, "about_us.txt")

    assert "Acme Dental" in parsed
    assert "cleaning" in parsed


def test_knowledge_source_read_schema():
    """Validates KnowledgeSourceRead serialization."""
    org_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    source = KnowledgeSource(
        id=uuid.uuid4(),
        organization_id=org_id,
        title="Employee Handbook.pdf",
        source_type="file",
        status="ready",
        char_count=5200,
        chunk_count=7,
        created_at=now,
        updated_at=now
    )

    read_schema = KnowledgeSourceRead.model_validate(source)
    assert read_schema.title == "Employee Handbook.pdf"
    assert read_schema.status == "ready"
    assert read_schema.chunk_count == 7
    assert read_schema.char_count == 5200
    assert read_schema.id == source.id
