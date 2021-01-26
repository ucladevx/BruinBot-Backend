#!/usr/bin/env python

import asyncio
import websockets

async def connect_and_keep_alive():
    uri = "ws://localhost:8081"
    async with websockets.connect(uri) as websocket:
        msg = "Hi! I'm Teddy Bear."
        await websocket.send(msg)

        res = await websocket.recv()
        print(res)

        while True:
            res = await websocket.recv()
            if res == "shutdown":
                break
            print(res)

asyncio.get_event_loop().run_until_complete(connect_and_keep_alive())
