import asyncio
import os
import sys

# Add root folder to python path so it finds backend package
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.services.rag_service import rag_service

SEED_DOCUMENTS = [
    {
        "content": "SEBI circular SEBI/HO/MRD/MRD-PoD-1/P/CIR/2026/04: Modification in the framework for inclusion of stocks in derivatives segment. A stock must have a minimum market-wide position limit of Rs 500 crores (up from Rs 300 crores). Rolling average daily delivery value in cash market must be at least Rs 10 crores. ZOMATO meets all criteria and is officially cleared for derivatives trading from next monthly series.",
        "metadata": {"ticker": "ZOMATO", "source": "SEBI Circular"}
    },
    {
        "content": "SEBI Regulatory update on Quick Commerce segment operations: Circular limits maximum delivery warehouse storage capacities in residential zones to 5,000 sq ft. Compliance check requires all Dark Stores of Blinkit (Zomato), Zepto, and Instamart to acquire fire safety NOC. Zomato announces Blinkit has achieved 98% dark store NOC compliance and margins will not be impacted.",
        "metadata": {"ticker": "ZOMATO", "source": "SEBI Guideline"}
    },
    {
        "content": "Titan Q4 Corporate Filing: Consolidated net sales up 17% YoY. Jewellery division (Tanishq) growth remains strong at 19% led by wedding season sales. Watch division EBIT margin expands to 11.2% due to higher share of premium smart wearables. Net cash flows from operations reported at Rs 1,840 crore.",
        "metadata": {"ticker": "TITAN", "source": "NSE announcement"}
    },
    {
        "content": "SEBI Gold Import Duty circular: Custom duties on raw gold bars reduced from 15% to 10% in the national budget. Titan Company Limited (Tanishq) welcomes the step, expecting a reduction in working capital debt by Rs 300 crore and a boost of 1.2% in jewelry gross margins.",
        "metadata": {"ticker": "TITAN", "source": "SEBI Circular"}
    },
    {
        "content": "Adani Ports press release: Completed acquisition of 100% equity stake in Gopalpur Port Limited for an enterprise value of Rs 3,080 crore. Gopalpur is a deepwater port with 20 MMT capacity, expanding Adani's East Coast dominance and volume capture from steel plants in Odisha.",
        "metadata": {"ticker": "ADANIPORTS", "source": "NSE Circular"}
    },
    {
        "content": "SEBI advisory on port infrastructure conglomerates: Directs that net-debt-to-EBITDA ratio of listed port operators must not exceed 4.0x. Adani Ports current ratio stands at 2.8x, demonstrating strong leverage buffer and credit rating of AA+.",
        "metadata": {"ticker": "ADANIPORTS", "source": "SEBI Circular"}
    },
    {
        "content": "Tata Steel earnings release: Revenues flat YoY at Rs 58,600 crore. Tata Steel Europe reports EBITDA loss of £120 million due to blast furnace closure in Port Talbot. Domestic India steel sales volumes grew 11% YoY, offsetting European weakness.",
        "metadata": {"ticker": "TATASTEEL", "source": "NSE Announcement"}
    },
    {
        "content": "SEBI directive on ESG reporting: Requires top 1000 listed entities to disclose BRSR (Business Responsibility and Sustainability Reporting) metrics. Tata Steel aligns 85% of domestic plants with carbon emission limits, saving Rs 120 crores in carbon tax penalty.",
        "metadata": {"ticker": "TATASTEEL", "source": "SEBI Circular"}
    },
    {
        "content": "RBI directive on Paytm Payments Bank: Complete ban on fresh deposits or credit transactions in accounts and wallets after March 15. One97 Communications partners with Axis Bank, HDFC, and SBI to redirect merchant settlement accounts, ensuring 95% merchant retention.",
        "metadata": {"ticker": "PAYTM", "source": "RBI/SEBI Notice"}
    }
]

async def seed():
    print("Starting RAG database seeding...")
    for doc in SEED_DOCUMENTS:
        try:
            content = doc["content"]
            meta = doc["metadata"]
            print(f"Ingesting: {meta['ticker']} - {meta['source']}")
            await rag_service.ingest_document(content, meta)
        except Exception as e:
            print(f"Error seeding doc: {e}")
    print("RAG database seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed())
