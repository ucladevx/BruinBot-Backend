#!/usr/bin/env python

import asyncio
import websockets
import argparse
import random

async def connect_and_keep_alive(bot_id, uri):
    timeout = 10
    async with websockets.connect(uri) as websocket:
        msg = "join " + bot_id
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
                rand_lat = random.uniform(-90, 90)
                rand_lon = random.uniform(-180, 180)
                await websocket.send("location " + bot_id + " " + str(rand_lat) + " " + str(rand_lon))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Performs bot to server actions using WebSockets.")
    parser.add_argument("--prod", action="store_true",
                        help="If flag specified, run simulator on prod server, otherwise run on local server")
    parser.add_argument("--bot", metavar="bot_id", required=True,
                        help="ID of bot that this script manages")

    args = parser.parse_args()
    bot_id = args.bot
    uri = ""
    if args.prod:
        uri = "ws://bruinbot-load-balancer-1177858409.us-west-1.elb.amazonaws.com/"
    else:
        uri = "ws://localhost:8080/"
    asyncio.get_event_loop().run_until_complete(connect_and_keep_alive(bot_id, uri))
