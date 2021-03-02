#!/usr/bin/env python

import asyncio
import websockets

async def connect_and_keep_alive():
    uri = "ws://localhost:8080/"
    timeout = 10
    async with websockets.connect(uri) as websocket:
        msg = "register Teddy Bear"
        await websocket.send(msg)

        res = await websocket.recv()
        print(res)

        while True:
            try:
                res = await asyncio.wait_for(websocket.recv(), timeout)
                if res == "shutdown":
                    break
                print(res)
            except:
                # Send request to ws server here...
                await websocket.send("path")

asyncio.get_event_loop().run_until_complete(connect_and_keep_alive())