import argparse
import random
import requests
import time
from flask import Flask
from multiprocessing import Value, Process

app = Flask(__name__)
random.seed(time.time())

# Shared memory between processes
# https://docs.python.org/3/library/multiprocessing.html#sharing-state-between-processes
loop = Value("b", True)
latitude = Value("d", 0)
longitude = Value("d", 0)

@app.before_first_request
def initial():
    return

@app.route("/")
def display_bot_status():
    return str(latitude.value) + ", " + str(longitude.value)

def main_loop(loop, latitude, longitude, baseUrl, eventId, updateInterval):
    """The main loop for the robot"s internal processing."""
    event_bots_query = {
        "eventId": eventId
    }

    bots = requests.get(
        baseUrl + "/events/bots",
        params=event_bots_query
    ).json()

    if not bots:
        print("Error retrieving Buinbots.")
        exit()

    # Keep track of which point in the path the bot is on
    for bot in bots:
        bot["path_index"] = 0
        print(f'{bot["name"]}: {bot["path"]}\n')

    prev_time = time.time()
    while True:
        if loop.value != True:
            return

        # Update every UPDATE_INTERVAL seconds
        if time.time() - prev_time >= updateInterval:
            prev_time = int(time.time())

            for bot in bots:
                if bot["path"]:
                    bot_path = bot["path"]
                    next_point = bot_path[bot["path_index"]]

                    location_payload = {
                        "latitude": str(next_point["latitude"]),
                        "longitude": str(next_point["longitude"]),
                        "botId": bot["_id"]
                    }

                    res = requests.put(
                        baseUrl + "/bots/updateLocation",
                        data=location_payload
                    )

                    # Teleport bot back to beginning of path to re-run the route
                    bot["path_index"] = (bot["path_index"] + 1) % len(bot_path)

                    if res:
                        print(f'{bot["name"]} is now on ({next_point["latitude"]}, {next_point["longitude"]}), {bot["path_index"]}/{len(bot_path)} of path completed')
                    else:
                        print(f'ERROR: {bot["name"]} failed to update location.')

                    if (bot["path_index"] == 0):
                        print("Resetting " + bot["name"] + " back to start of path...")

        time.sleep(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate BruinBots by firing periodic requests.")
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

    # Run the Flask server
    app.run(port=8000, debug=True, use_reloader=False)

    # Wait until onboard continous loop is complete
    operation_process.join()
