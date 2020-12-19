from flask import Flask
import requests
from multiprocessing import Value, Process
import time
import random

app = Flask(__name__)

random.seed(time.time())
UPDATE_INTERVAL = 5

BASE_URL = 'http://bruinbot-load-balancer-1177858409.us-west-1.elb.amazonaws.com'
EVENT_ID = '5fc90164d5869f00143e7fac'

# Shared memory between processes
# https://docs.python.org/3/library/multiprocessing.html#sharing-state-between-processes
loop = Value('b', True)
latitude = Value('d', 0)
longitude = Value('d', 0)

@app.before_first_request
def initial():
    return

@app.route('/')
def display_bot_status():
    return str(latitude.value) + ", " + str(longitude.value)

def main_loop(loop, latitude, longitude):
    """The main loop for the robot's internal processing."""
    event_bots_query = {
        "eventId": EVENT_ID
    }

    bots = requests.get(
        BASE_URL + "/events/bots",
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
        if time.time() - prev_time >= 10:
            prev_time = int(time.time())

            for bot in bots:
                if bot["path"]:
                    bot_path = bot["path"]["points"]
                    next_point = bot_path[bot["path_index"]]

                    location_payload = {
                        "latitude": str(next_point["latitude"]),
                        "longitude": str(next_point["longitude"]),
                        "botId": bot["_id"]
                    }

                    res = requests.put(
                        BASE_URL + "/bots/updateLocation",
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
    # Create and start process that hosts the onboard continuous loop
    operation_process = Process(
        target=main_loop, args=(loop, latitude, longitude))
    operation_process.start()

    # Run the Flask server
    app.run(port=8000, debug=True, use_reloader=False)

    # Wait until onboard continous loop is complete
    operation_process.join()
