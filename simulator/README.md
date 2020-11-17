# BruinBot Simulator

This Flask server simulates a single bot.

### Set up instructions:

Set up virtual environment

```
python3 -m venv env
```

Activate virtual environment

- Windows (cmd): `.\env\Scripts\activate`
- Windows (Bash): `source env/Scripts/activate`
- macOS: `source venv/bin/activate`

Install Python modules

```
pip install -r requirements.txt
```

Set environment variables

- Windows (cmd): `set FLASK_APP=app.py` (`set FLASK_ENV=development` for development environment)
- macOS / Windows (Bash): `export FLASK_APP=app.py` (`export FLASK_ENV=development` for development environment)

Run Flask server

```
flask run
```

You can also run `sh start.sh` if you have an sh compatible shell to set environment variables and run the Flask server.
