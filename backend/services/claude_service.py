import os
import asyncio
import json
import logging
from typing import AsyncGenerator, Dict, Any, List
import anthropic
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("claude_service")

# Setup anthropic client if key is available and has correct format
api_key = os.getenv("ANTHROPIC_API_KEY")
if api_key and api_key.startswith("sk-ant-"):
    client = anthropic.AsyncAnthropic(api_key=api_key)
else:
    logger.warning("ANTHROPIC_API_KEY not found or invalid format in environment. Claude Service will operate in MOCK mode.")
    client = None

class ClaudeService:
    @staticmethod
    def get_mock_signal_reasoning(ticker: str) -> str:
        reasons = [
            f"No cap, {ticker} is literally showing a massive breakout pattern on the daily chart. Vol is spiking and institutional buyers (FIIs) are loading up. Buy the dip before it runs.",
            f"{ticker} has been trading sideways but RSI is in deep oversold territory. Our SEBI filings scan shows insider buying. Watch this space, it's about to make a move.",
            f"Honestly, the news cycle on {ticker} is just noise. The fundamentals are mid and the MACD is signaling bearish momentum. We are sitting this one out. Avoid for now."
        ]
        import random
        return random.choice(reasons)

    @staticmethod
    def get_mock_debate(ticker: str, side: str) -> str:
        if side.lower() == "bull":
            return f"🐂 BullBot: {ticker} is an absolute vibe right now! Check the numbers: their capex is up 25% YoY, and they're leading the market share in their segment. FIIs are pumping capital. Tech indicators show a clear cup-and-handle pattern. This isn't just a stock; it's a compounding machine. If you aren't buying, you are literally missing the train. Target price has at least 30% upside. Let's go! 🚀"
        else:
            return f"🐻 BearBot: Slow down the hype train. {ticker} is trading at a ridiculous P/E ratio that makes zero sense compared to their actual margins. The latest regulatory filings indicate potential audit delays, and their cash flows are tight. Retail is FOMO-buying, which usually means the top is in. Sitting on this is a recipe for tears. Avoid the crash, save your capital. 📉"

    @staticmethod
    def get_mock_chat_response(messages: List[Dict[str, Any]], user_context: Dict[str, Any]) -> str:
        last_message = messages[-1]["content"] if messages else ""
        if isinstance(last_message, list):
            text_parts = [part.get("text", "") for part in last_message if isinstance(part, dict) and part.get("type") == "text"]
            last_message = " ".join(text_parts)
        last_message_lower = last_message.lower()
        
        # Determine risk archetype and holdings info
        risk = user_context.get("risk_archetype", "FOMO Trader")
        holdings = user_context.get("portfolio_summary", "no holdings")
        
        if "nifty" in last_message_lower or "market" in last_message_lower:
            return "Nifty 50 is looking slightly volatile today, my friend. We saw some selling in IT stocks, but heavy capex sectors are holding the line. Keep an eye on inflation data next week. For a risk profile like yours ({}), I'd recommend playing it cool and not chasing intraday pumps. DYOR!".format(risk)
        elif "portfolio" in last_message_lower or "holdings" in last_message_lower:
            return "Let's review. You are currently tagged as a {}. Your holdings are: {}. Honestly, it's not bad, but you could diversify. Maybe add some stable index mutual funds or defensive large caps to balance out the smallcap volatility. Don't let FOMO dictate your allocations! DYOR!".format(risk, holdings)
        elif "buy" in last_message_lower or "recommend" in last_message_lower:
            return "Right now, ZOMATO and TATASTEEL are flashing strong indicators on our signal feed. Zomato has solid momentum, while Tatasteel is benefiting from the manufacturing push. Since you selected vibe: '{}', these fit nicely. Target upside is around 15-20%. Put them on your watchlist first! DYOR!".format(user_context.get("vibe_selections", "growth"))
        else:
            return "Yo! That's a great question. Honestly, financial markets are a bit of a circus right now, but that's where the opportunities are. With a risk vibe of '{}' and your profile as a {}, my best advice is to keep SIPs going, stack cash for corrections, and avoid F&O unless you like eating instant noodles. What other stock do you want to break down? DYOR!".format(user_context.get("vibe_selections", "general"), risk)

    def _mock_completion(self, prompt: str) -> str:
        import random
        # Extract ticker if possible
        ticker = "STOCK"
        for word in prompt.replace(":", " ").replace(".", " ").replace("(", " ").replace(")", " ").replace("{", " ").replace("}", " ").split():
            if len(word) >= 3 and word.isupper() and word not in ["NSE", "FII", "RSI", "PE", "NSEI", "GST", "STT", "CAGR", "RBI", "FD", "ROE", "ROCE", "JSON", "EMA", "LTCG", "STCG", "CAGR"]:
                ticker = word
                break
                
        if "signal_type" in prompt:
            sig_type = random.choice(["ACT", "WATCH", "NOISE"])
            conf = random.randint(45, 88)
            return json.dumps({
                "signal_type": sig_type,
                "confidence": conf,
                "reasoning": self.get_mock_signal_reasoning(ticker),
                "sources": [random.choice(["Moneycontrol", "Economic Times", "NSE Filings"]), "FII Data"]
            })
        elif "BullBot" in prompt or "BearBot" in prompt or "aggressive bull" in prompt:
            side = "bull" if "bull" in prompt.lower() else "bear"
            return self.get_mock_debate(ticker, side)
        elif "score" in prompt and "summary" in prompt:
            score = random.randint(55, 88)
            summaries = [
                f"Strong institutional buying and stellar growth projections make {ticker} a high-conviction buy, despite some short-term overbought technicals.",
                f"Consensus remains moderately positive on {ticker} as industry tailwinds offset pressure on operating margins. Hold/accumulate on dips.",
                f"Analysts advise caution on {ticker} due to high valuations and flat near-term earnings growth. Wait for a better entry point."
            ]
            return json.dumps({
                "score": score,
                "summary": random.choice(summaries)
            })
        elif "tagline" in prompt and "behavioral_insight" in prompt:
            pnl_pct = 0.0
            for word in prompt.split():
                if "%" in word:
                    try:
                        pnl_pct = float(word.replace("%", "").replace("(", "").replace(")", ""))
                        break
                    except:
                        pass
            if pnl_pct > 50:
                tagline = f"Bruh, you'd be flexing a new ride right now. That {ticker} investment went to the moon! 🚀"
                insight = f"With a CAGR this solid, you would've bragged about it on Reddit. But let's be real, you probably would've cashed out way too early."
            elif pnl_pct < 0:
                tagline = f"Oof, this timeline stings. {ticker} down bad. Major L. 📉"
                insight = f"Seeing a drawdown like that would have made you delete your portfolio app. Diamond hands are hard when you are losing money."
            else:
                tagline = f"Better than your savings account, but not quite Lambo money. Mid. 😐"
                insight = f"A steady boring ride. Most Gen Z retail traders would have sold out of boredom to chase meme coins."
            return json.dumps({
                "tagline": tagline,
                "behavioral_insight": insight
            })
        return "Mock: VibeUp is online, but Claude API key is missing. Set ANTHROPIC_API_KEY to get real intelligence!"

    async def completion(self, prompt: str, system_prompt: str = "You are a financial assistant.", max_tokens: int = 1000) -> str:
        if not client:
            return self._mock_completion(prompt)

        try:
            if not client:
                raise ValueError("No Anthropic client configured")
            response = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Claude API completion error: {e}. Falling back to mock completion.")
            return self._mock_completion(prompt)

    async def _mock_stream_completion(self, prompt: str, system_prompt: str, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        mock_text = ""
        import random
        ticker = "STOCK"
        for word in prompt.replace(":", " ").replace(".", " ").replace("?", " ").replace("!", " ").split():
            if len(word) >= 3 and word.isupper() and word not in ["NSE", "FII", "RSI", "PE", "NSEI", "GST", "STT", "CAGR", "RBI", "FD", "ROE", "ROCE", "JSON", "EMA"]:
                ticker = word
                break

        if "ValueBot" in system_prompt or "fundamental" in system_prompt.lower():
            mock_text = f"💼 **Value Analysis for {ticker}:**\n\n" \
                        f"- **Valuation Moat**: The P/E ratio is trading at a significant discount compared to historical averages, showing potential undervaluation.\n" \
                        f"- **Capital Efficiency**: Return on Equity (ROE) stands strong at 18.5% with double-digit operating margin expansion.\n" \
                        f"- **Debt Position**: A clean balance sheet with low debt-to-equity means high resilience against interest rate hikes.\n" \
                        f"- **Verdict**: High-quality fundamental compounding stock with a strong margin of safety. Buy on dips."
        elif "QuantBot" in system_prompt or "technical" in system_prompt.lower():
            mock_text = f"📈 **Quant & Technical Analysis for {ticker}:**\n\n" \
                        f"- **Trend Structure**: Trading above the 50-day and 200-day EMAs, signaling a strong medium-term bullish structure.\n" \
                        f"- **Momentum**: RSI stands at 58. It is in the buy zone but not overextended, leaving room for further upside.\n" \
                        f"- **Volume Spikes**: High delivery volume accumulation indicates strong institutional interest in the last 5 sessions.\n" \
                        f"- **Verdict**: Clean cup-and-handle pattern breakout. Bullish momentum active."
        elif "MacroBot" in system_prompt or "macro" in system_prompt.lower():
            mock_text = f"🌍 **Macro & Sector Analysis for {ticker}:**\n\n" \
                        f"- **Policy Tailwinds**: Prime beneficiary of government capex push and domestic consumption themes.\n" \
                        f"- **Interest Rates**: Expected RBI rate stabilization in Q3/Q4 will ease funding costs for expansion.\n" \
                        f"- **Sector CAGR**: The sector is projected to grow at 14% CAGR, boosting long-term demand dynamics.\n" \
                        f"- **Verdict**: Favorable tailwinds. External sector risks are minimal."
        elif "debate" in prompt.lower() or "bull" in prompt.lower() or "bear" in prompt.lower():
            side = "bull" if "bull" in prompt.lower() or "bullbot" in prompt.lower() else "bear"
            mock_text = self.get_mock_debate(ticker, side)
        elif messages:
            mock_text = self.get_mock_chat_response(messages, {})
        else:
            mock_text = "Yo! VibeUp is currently running in local Demo mode with mock AI logic since ANTHROPIC_API_KEY is not configured. But I still got your back! Let's get these gains. DYOR!"

        words = mock_text.split(" ")
        for i in range(len(words)):
            chunk = (words[i] + " ") if i < len(words) - 1 else words[i]
            yield chunk
            await asyncio.sleep(0.04)

    async def stream_completion(self, prompt: str, system_prompt: str = "You are a financial assistant.", messages: List[Dict[str, str]] = None, max_tokens: int = 1000) -> AsyncGenerator[str, None]:
        if not client:
            async for chunk in self._mock_stream_completion(prompt, system_prompt, messages):
                yield chunk
            return

        try:
            # If full messages are supplied, use them; otherwise construct from prompt
            msg_payload = messages if messages else [{"role": "user", "content": prompt}]
            
            async with client.messages.stream(
                model="claude-3-5-sonnet-20241022",
                max_tokens=max_tokens,
                system=system_prompt,
                messages=msg_payload
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except Exception as e:
            logger.error(f"Claude streaming error: {e}. Falling back to mock streaming.")
            async for chunk in self._mock_stream_completion(prompt, system_prompt, messages):
                yield chunk

    async def json_completion(self, prompt: str, system_prompt: str = "You are a helpful assistant.", max_tokens: int = 1000) -> Dict[str, Any]:
        full_prompt = f"{prompt}\n\nIMPORTANT: Respond ONLY with a valid JSON block, starting with '{{' and ending with '}}'. Do not write any markdown codeblock formatting or extra text."
        text = await self.completion(full_prompt, system_prompt, max_tokens)
        
        # Clean text in case Claude outputs Markdown blocks like ```json ... ```
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                cleaned = "\n".join(lines[1:-1]).strip()
        
        try:
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse Claude JSON output: {e}. Raw response: {text}")
            # Try regex parsing if simple load fails, or return fallback dict
            try:
                # Basic bracket extract
                start_idx = cleaned.find("{")
                end_idx = cleaned.rfind("}")
                if start_idx != -1 and end_idx != -1:
                    return json.loads(cleaned[start_idx:end_idx+1])
            except Exception as inner_e:
                logger.error(f"Brute force JSON extract failed: {inner_e}")
            
            return {"error": "json_parse_failed", "raw": text}

# Global service instance
claude_service = ClaudeService()
