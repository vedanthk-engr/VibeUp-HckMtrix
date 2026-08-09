import os
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import AsyncOpenAI

load_dotenv()

logger = logging.getLogger("rag_service")

# Initialize OpenAI and Supabase clients
openai_key = os.getenv("OPENAI_API_KEY")
supabase_url = os.getenv("SUPABASE_URL")
if supabase_url:
    supabase_url = supabase_url.replace("/rest/v1/", "").replace("/rest/v1", "").strip()
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

openai_client = AsyncOpenAI(api_key=openai_key, max_retries=0) if openai_key else None
supabase_client: Client = create_client(supabase_url, supabase_key) if (supabase_url and supabase_key) else None

# In-memory fallback RAG storage
_in_memory_docs = []

class RAGService:
    def __init__(self):
        if not openai_client or not supabase_client:
            logger.warning("RAG Service operating in MOCK/IN-MEMORY mode due to missing OpenAI/Supabase keys.")
            self._seed_mock_docs()

    def _seed_mock_docs(self):
        # Seed some real SEBI circular descriptions and NSE updates for mock RAG retrieval
        global _in_memory_docs
        _in_memory_docs = [
            {
                "ticker": "ZOMATO",
                "content": "SEBI circular on institutional investments: Zomato Limited is approved for inclusion in the derivative segment (F&O) starting next month. Market lot size is 4500 shares.",
                "metadata": {"source": "SEBI Circular"}
            },
            {
                "ticker": "ZOMATO",
                "content": "NSE Corporate Filing: Zomato Limited reports Q4 net profit growth of 300% YoY, reaching ₹175 crore. EBITDA margins expanded to 6.4% driven by growth in Blinkit quick commerce.",
                "metadata": {"source": "NSE Announcement"}
            },
            {
                "ticker": "TITAN",
                "content": "SEBI advisory on gold import duties: Gold duties slashed by 5% in the union budget. Titan Company Limited to benefit from lower input costs and increased margins for jewellery.",
                "metadata": {"source": "SEBI Update"}
            },
            {
                "ticker": "TITAN",
                "content": "Titan Q4 results: Jewellery sales up 18% YoY, watch division shows 12% revenue growth. Capital expenditure of ₹400 crore planned for store expansions in tier-2 cities.",
                "metadata": {"source": "NSE announcement"}
            },
            {
                "ticker": "ADANIPORTS",
                "content": "Adani Ports corporate filing: Acquisition of Gopalpur Port completed for ₹3,080 crore. Capacity addition of 20 MMT per annum to boost overall volume growth by 8% next fiscal.",
                "metadata": {"source": "NSE Circular"}
            },
            {
                "ticker": "PAYTM",
                "content": "SEBI warning on Paytm payments bank: Restrictions on deposits and wallet top-ups. Paytm redirects UPI handles to partner banks (Axis, HDFC, SBI) to ensure operational continuity.",
                "metadata": {"source": "SEBI Advisory"}
            }
        ]

    async def embed(self, text: str) -> List[float]:
        """Generate text embeddings using OpenAI."""
        if not openai_client:
            # Mock embedding (1536 float elements)
            return [0.0] * 1536
            
        try:
            response = await openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"OpenAI embedding generation failed: {e}")
            return [0.0] * 1536

    async def ingest_document(self, text: str, metadata: Dict[str, Any]):
        """Chunk, embed and store a document in Supabase pgvector or in-memory fallback."""
        if not supabase_client or not openai_client:
            # Fallback to in-memory store
            ticker = metadata.get("ticker", "").upper()
            _in_memory_docs.append({
                "ticker": ticker,
                "content": text,
                "metadata": metadata
            })
            logger.info("Ingested document to in-memory fallback.")
            return

        try:
            # Simple chunking
            chunks = self._chunk_text(text, chunk_size=512, overlap=50)
            for chunk in chunks:
                embedding = await self.embed(chunk)
                if all(x == 0.0 for x in embedding):
                    raise ValueError("Failed to generate valid embedding from OpenAI (quota exceeded or API error)")
                supabase_client.table("rag_documents").insert({
                    "content": chunk,
                    "embedding": embedding,
                    "metadata": metadata
                }).execute()
            logger.info("Ingested document to Supabase pgvector.")
        except Exception as e:
            logger.error(f"Error ingesting document into RAG: {e}")

    def _query_in_memory(self, query_text: str, ticker: str = "", top_k: int = 3) -> List[str]:
        results = []
        q_words = query_text.lower().split()
        
        for doc in _in_memory_docs:
            if ticker and doc.get("ticker", "").upper() != ticker.upper():
                continue
                
            score = 0
            content_lower = doc["content"].lower()
            for word in q_words:
                if word in content_lower:
                    score += 1
            if score > 0 or not ticker:
                results.append((score, doc["content"]))
                
        results.sort(key=lambda x: x[0], reverse=True)
        return [text for _, text in results[:top_k]]

    async def query(self, query_text: str, ticker: str = "", top_k: int = 3) -> List[str]:
        """Query RAG documents. Matches pgvector in Supabase, falls back to keyword match."""
        if not supabase_client or not openai_client:
            return self._query_in_memory(query_text, ticker, top_k)

        try:
            query_embedding = await self.embed(query_text)
            if all(x == 0.0 for x in query_embedding):
                logger.warning("Query embedding is all zeros (OpenAI failed). Falling back to in-memory search.")
                return self._query_in_memory(query_text, ticker, top_k)
                
            # Call pgvector RPC function
            result = supabase_client.rpc("match_documents", {
                "query_embedding": query_embedding,
                "match_count": top_k
            }).execute()
            
            return [row["content"] for row in result.data]
        except Exception as e:
            logger.error(f"RAG query failed: {e}. Falling back to in-memory.")
            return self._query_in_memory(query_text, ticker, top_k)

    def _chunk_text(self, text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
            if i + chunk_size >= len(words):
                break
        return chunks

rag_service = RAGService()
