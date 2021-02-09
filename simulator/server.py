from bson.objectid import ObjectId
import pymongo
import argparse
import random
import requests
import time
from multiprocessing import Value, Process

random.seed(time.time())

# Shared memory between processes
# https://docs.python.org/3/library/multiprocessing.html#sharing-state-between-processes
loop = Value("b", True)
latitude = Value("d", 0)
longitude = Value("d", 0)

client = pymongo.MongoClient('mongodb://localhost:27017/bruinbot-dev')
db = client['bruinbot-dev']


def main_loop(loop, latitude, longitude, baseUrl, eventId, updateInterval):
    """The main loop for the robot"s internal processing."""

    prev_time = time.time()
    pathProgresses = {}
    eventObjectID = ObjectId(eventId)

    while True:
        if loop.value != True:
            return

        # Update every UPDATE_INTERVAL seconds
        if time.time() - prev_time >= updateInterval:
            prev_time = int(time.time())

            # Get bot information for specified event
            eventBotIds = db.events.find_one({'_id': eventObjectID})['bots']
            bots = [x for x in db.bruinbots.find(
                {"_id": {"$in": eventBotIds}})]

            if not bots:
                print("Error retrieving Bruinbots.")
                exit()

            # Keep track of which point in the path the bot is on
            for bot in bots:
                if bot["_id"] not in pathProgresses and bot["status"] == "InTransit":
                    pathProgresses[bot["_id"]] = 0

            for bot in bots:
                if bot["status"] == "InTransit":
                    if bot["_id"] not in pathProgresses:
                        pathProgresses[bot["_id"]] = 0

                    bot_path = bot["path"]
                    next_point = bot_path[pathProgresses[bot["_id"]]]

                    print(
                        f'{bot["name"]} is now on ({next_point["latitude"]}, {next_point["longitude"]}), {pathProgresses[bot["_id"]] + 1}/{len(bot_path)} of path in progress')

                    # Update MongoDB bot document's location
                    res = db.bruinbots.update_one(
                        {"_id": bot["_id"]},
                        {"$set": {"location":
                                  {"latitude": str(next_point["latitude"]),
                                   "longitude": str(next_point["longitude"])}
                                  }})

                    if not res:
                        print(
                            f'ERROR: {bot["name"]} failed to update location.')

                    pathProgresses[bot["_id"]] += 1
                    if pathProgresses[bot["_id"]] == len(bot_path):
                        del pathProgresses[bot["_id"]]
                        print(
                            f'{bot["name"]} has finished its path and has arrived at its destination!')

        time.sleep(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Simulate BruinBots by firing periodic requests.")
    parser.add_argument("--prod", action="store_true",
                        help="If flag specified, run simulator on prod server, otherwise run on local server")
    parser.add_argument("--event", metavar="eventId", required=True,
                        help="Event ID of event whose bots will be simulated")
    parser.add_argument("--interval", metavar="updateInterval", type=int, default=10,
                        help="Interval at which simulator fires requests (default 10s)")

    args = parser.parse_args()
    eventId = args.event
    updateInterval = args.interval
    baseUrl = ""
    # Don't include the trailing slash in the baseUrl
    if args.prod:
        # Load balancer is currently offline, when it is rebooted this will need to be updated
        baseUrl = "http://bruinbot-load-balancer-1177858409.us-west-1.elb.amazonaws.com/"
    else:
        baseUrl = "http://localhost:8080"

    # Create and start process that hosts the onboard continuous loop
    operation_process = Process(
        target=main_loop, args=(loop, latitude, longitude, baseUrl, eventId, updateInterval))
    operation_process.start()

    # Wait until onboard continous loop is complete
    operation_process.join()
