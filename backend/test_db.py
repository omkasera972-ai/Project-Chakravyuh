import asyncio
from database import client

async def test():
    result = await client.admin.command("ping")
    print(result)
    client.close()

asyncio.run(test())