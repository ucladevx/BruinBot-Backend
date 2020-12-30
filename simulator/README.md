# BruinBot Simulator

This Flask server simulates a single bot. 

### Set up instructions:
**Make sure you are using Python 3!**

Set up virtual environment

```
python -m venv env
```

Activate virtual environment

- Windows (cmd): `.\env\Scripts\activate`
- Windows (Bash): `source env/Scripts/activate`
- macOS: `source env/bin/activate`

Deactivate virtual environment
```
deactivate
```

Install Python modules (equivalent of running `npm ci`)

```
pip install -r requirements.txt
```

Ways to run simulator (see `python server.py -h` for more options)

```
python server.py --event randomeventid123abc
python server.py --event randomeventid123abc --prod
python server.py --event randomeventid123abc --interval 20
```
