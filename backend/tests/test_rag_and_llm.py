import uuid
import pytest
from app.models.chatbot import Chatbot
from app.models.conversation import Conversation
from app.models.knowledge import BusinessInfo
from app.adapters.llm.provider import MockLLMProvider, LLMMessage
from app.services.rag_service import RAGService


@pytest.mark.asyncio
async def test_mock_llm_provider_streaming_deltas():
    """Validates that MockLLMProvider yields streaming content chunks and done event."""
    provider = MockLLMProvider()
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ]

    chunks = []
    async for chunk in provider.stream_chat(messages):
        chunks.append(chunk)

    assert len(chunks) > 1
    content_chunks = [c for c in chunks if c.get("type") == "content"]
    done_chunks = [c for c in chunks if c.get("type") == "done"]

    assert len(content_chunks) > 0
    assert len(done_chunks) == 1
    assert done_chunks[0]["total_tokens"] > 0


@pytest.mark.asyncio
async def test_mock_llm_lead_capture_tool_call():
    """Validates that provider generates create_lead tool call when user provides contact details."""
    provider = MockLLMProvider()
    messages = [
        {"role": "system", "content": "You are a sales assistant."},
        {"role": "user", "content": "My name is John Doe and my email is john@example.com"}
    ]

    tool_calls = []
    async for chunk in provider.stream_chat(messages):
        if chunk.get("type") == "tool_call":
            tool_calls.append(chunk)

    assert len(tool_calls) == 1
    tc = tool_calls[0]
    assert tc["tool_name"] == "create_lead"
    assert "John" in tc["arguments"]["name"]
    assert tc["arguments"]["email"] == "john@example.com"


@pytest.mark.asyncio
async def test_mock_llm_honest_fallback():
    """Validates honest fallback behavior when context is absent (REQ-AI-06)."""
    provider = MockLLMProvider()
    messages = [
        {"role": "system", "content": "RELEVANT KNOWLEDGE CONTEXT:\nNo relevant documents found"},
        {"role": "user", "content": "What is the secret recipe for dark chocolate?"}
    ]

    response_text = ""
    async for chunk in provider.stream_chat(messages):
        if chunk.get("type") == "content":
            response_text += chunk.get("delta", "")

    # Must politely state lack of information and offer contact without hallucination
    assert "I don't have that specific information" in response_text
    assert "knowledge base" in response_text


@pytest.mark.asyncio
async def test_rag_system_prompt_builder():
    """Validates dynamic assembly of system prompt with anti-hallucination guardrails."""
    org_id = uuid.uuid4()
    bot = Chatbot(
        id=uuid.uuid4(),
        organization_id=org_id,
        name="Support Concierge",
        system_prompt="You are a dental receptionist.",
        fallback_message="We are currently checking that for you.",
        is_active=True
    )

    class MockDb:
        async def execute(self, stmt):
            stmt_str = str(stmt).lower()
            class MockResult:
                def scalars(self):
                    class MockScalars:
                        def all(self):
                            if "business_info" in stmt_str:
                                return [
                                    BusinessInfo(
                                        organization_id=org_id,
                                        category="faq",
                                        question="What are your hours?",
                                        answer="Monday to Friday 9am to 5pm",
                                        is_active=True
                                    )
                                ]
                            return []
                    return MockScalars()
            return MockResult()

    prompt = await RAGService.build_system_prompt(MockDb(), bot, "What time are you open?")

    assert "ROLE & PERSONA:" in prompt
    assert "You are a dental receptionist" in prompt
    assert "ANTI-HALLUCINATION POLICY:" in prompt
    assert "We are currently checking that for you" in prompt
    assert "What are your hours?" in prompt
    assert "Monday to Friday 9am to 5pm" in prompt
