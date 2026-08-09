from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import date

class ChatMessage(BaseModel):
    role: str
    content: Any

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_context: Optional[Dict[str, Any]] = None

class HoldingCreate(BaseModel):
    ticker: str
    exchange: str = "NSE"
    quantity: float
    avg_buy_price: float
    buy_date: str
    is_paper: bool = False

class HoldingResponse(HoldingCreate):
    id: str
    current_price: float = 0.0
    pnl: float = 0.0
    pnl_percentage: float = 0.0

class DebateRequest(BaseModel):
    ticker: str

class RegretRequest(BaseModel):
    ticker: str
    buy_date: str
    amount: float

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    ticker: str
    side: str
    quantity: float
    price: float
    stt: float
    gst: float
    stamp_duty: float
    exchange_fees: float
    brokerage: float
    total_value: float
    created_at: Any

    class Config:
        from_attributes = True

class TaxPosition(BaseModel):
    ticker: str
    quantity: float
    avg_buy_price: float
    current_price: float
    buy_date: str
    holding_period_days: int
    category: str  # STCG or LTCG
    pnl: float
    estimated_tax: float

class PortfolioTaxSummary(BaseModel):
    realized_stcg: float
    realized_ltcg: float
    unrealized_stcg: float
    unrealized_ltcg: float
    estimated_tax_payable: float
    tax_saving_harvest_opportunity: float
    positions: List[TaxPosition]
