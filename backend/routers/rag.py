import logging
import io
import pdfplumber
from fastapi import APIRouter, HTTPException, Query, Body, UploadFile, File, Form
from typing import Dict, Any
from backend.services.rag_service import rag_service

router = APIRouter(prefix="/rag", tags=["SEBI Circulars RAG"])

logger = logging.getLogger("rag_router")

@router.post("/ingest")
async def ingest_document(
    content: str = Body(..., embed=True), 
    ticker: str = Body("", embed=True),
    source: str = Body("Manual Ingest", embed=True)
):
    """Ingest a SEBI document or news article chunk into pgvector."""
    try:
        metadata = {"ticker": ticker.upper(), "source": source}
        await rag_service.ingest_document(content, metadata)
        return {"status": "success", "message": "Document ingested successfully"}
    except Exception as e:
        logger.error(f"Ingest failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    ticker: str = Form(""),
    source: str = Form("")
):
    """Parse an uploaded PDF file, extract text, and ingest it into the RAG vector store."""
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")
            
        contents = await file.read()
        text_content = ""
        
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content += text + "\n"
                    
        if not text_content.strip():
            raise HTTPException(status_code=400, detail="The uploaded PDF file contains no extractable text.")
            
        final_source = source if source else file.filename
        metadata = {
            "ticker": ticker.upper(),
            "source": final_source,
            "page_count": page_count,
            "char_count": len(text_content)
        }
        
        await rag_service.ingest_document(text_content, metadata)
        
        return {
            "status": "success",
            "message": "PDF uploaded and ingested successfully",
            "metadata": metadata
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to process PDF upload: {e}")
        raise HTTPException(status_code=500, detail=f"PDF Ingestion failed: {str(e)}")

from backend.services.gemma_service import run_research_agent

@router.get("/query")
async def query_rag(
    q: str = Query(..., description="Query terms"), 
    ticker: str = Query("", description="Filter context by stock ticker")
):
    """Retrieve relevant paragraphs using vector search similarity matches and Gemma 4 Research Agent synthesis."""
    try:
        results = await rag_service.query(q, ticker=ticker, top_k=3)
        # Synthesize via Gemma 4 Research Agent
        synthesis = await run_research_agent(q, results)
        return {"query": q, "results": results, "gemma_research_synthesis": synthesis}
    except Exception as e:
        logger.error(f"RAG query endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
