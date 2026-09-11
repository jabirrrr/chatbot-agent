import re
from typing import List, Dict, Any


class ChunkingService:
    """
    Implements recursive character chunking with sliding overlap
    to preserve contextual integrity for semantic RAG vector retrieval.
    """
    DEFAULT_CHUNK_SIZE = 800  # ~200 tokens
    DEFAULT_CHUNK_OVERLAP = 150  # ~40 tokens

    @staticmethod
    def clean_text(text: str) -> str:
        """Normalizes whitespace and removes control characters."""
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def count_tokens_approx(text: str) -> int:
        """Approximates token count based on 4 characters per token."""
        return max(1, len(text) // 4)

    @classmethod
    def split_text(
        cls,
        text: str,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP
    ) -> List[Dict[str, Any]]:
        """
        Recursively splits text into chunks of roughly `chunk_size` characters
        with `chunk_overlap` character boundary overlap.
        """
        cleaned = cls.clean_text(text)
        if not cleaned:
            return []

        if len(cleaned) <= chunk_size:
            return [{
                "content": cleaned,
                "chunk_index": 0,
                "token_count": cls.count_tokens_approx(cleaned)
            }]

        chunks: List[str] = []
        start = 0
        text_len = len(cleaned)

        while start < text_len:
            end = min(start + chunk_size, text_len)

            if end < text_len:
                # Attempt to break at natural boundaries: paragraph, newline, sentence, or space
                slice_text = cleaned[start:end]
                split_point = -1

                for separator in ["\n\n", "\n", ". ", "? ", "! ", " "]:
                    pos = slice_text.rfind(separator)
                    if pos > chunk_size // 2:  # Don't make chunks too small
                        split_point = pos + len(separator)
                        break

                if split_point != -1:
                    end = start + split_point

            chunk_content = cleaned[start:end].strip()
            if chunk_content:
                chunks.append(chunk_content)

            if end >= text_len:
                break

            # Advance with overlap ensuring strict forward progress
            next_start = end - chunk_overlap
            if next_start <= start:
                next_start = start + 1
            start = next_start

        # Deduplicate and format output
        result: List[Dict[str, Any]] = []
        for idx, content in enumerate(chunks):
            result.append({
                "content": content,
                "chunk_index": idx,
                "token_count": cls.count_tokens_approx(content)
            })

        return result
