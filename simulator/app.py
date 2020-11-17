from flask import Flask
import requests
app = Flask(__name__)


@app.before_first_request
def initial():
    return


@app.route('/')
def hello_world():
    return 'Hello, World!'
