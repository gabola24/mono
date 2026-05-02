import asyncio
import os
import sys

# append backend path
sys.path.append("/Users/mac/Downloads/agentpepe/backend")

from app.services.skill_discovery import process_skill_discovery
from app.db.database import get_session

async def main():
    content = "User: I am learning about bonsai tree shaping.\nAssistant: That's a great hobby! Bonsai requires patience."
    async for session in get_session():
        try:
            badges = await process_skill_discovery(session, content)
            print("Badges awarded:", badges)
        finally:
            await session.close()

if __name__ == "__main__":
    from app.config import settings
    asyncio.run(main())
