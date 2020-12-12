from flask import Flask
import requests
from multiprocessing import Value, Process
import time
import random

app = Flask(__name__)
baseURL = "http://localhost:5000"

random.seed(time.time())

# String id of the bot this server manages as identified on MongoDB; defaults to None
botId = '5fbb7eaf447fa728f2f3abe0'
pathId = '5fd4168b5021096c6bd37acb'

# shared memory between processes
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
    bot_payload = {
        "id": botId
    }
    path_payload = {
        "id": pathId
    }

    bot = requests.get(baseURL + "/bots/", data=bot_payload)

    while True:
        if loop.value != True:
            return

        if int(time.time()) % 10 == 0:
            bot = requests.get(baseURL + "/bots/", data=bot_payload)
            
        random.seed(time.time())
        latitude.value = random.uniform(-90, 90)
        longitude.value = random.uniform(-180, 180)

        # update bot location on server
        location_payload = {
            "latitude": str(latitude.value),
            "longitude": str(longitude.value),
            "id": botId
        }
        requests.put(baseURL + "/bots/updateLocation", data=location_payload)

        print(requests.get(baseURL + "/paths/path", data=path_payload).content)

        time.sleep(1)

if __name__ == "__main__":
    # create and start process that hosts the onboard continuous loop
    operation_process = Process(
        target=main_loop, args=(loop, latitude, longitude))
    operation_process.start()

    # run the Flask server
    app.run(port=8000, debug=True, use_reloader=False)

    # wait until onboard continous loop is complete
    operation_process.join()
