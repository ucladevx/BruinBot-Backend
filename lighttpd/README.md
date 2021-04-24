# Lighttpd - Webserver for remote access to camera feed on BruinBot

# Installation

Download from here: https://www.lighttpd.net/download/  
Alternatively on macOS, if you have homebrew installed, run `brew install lighttpd` 

# Modifying config file

Replace the config file located at `/usr/local/etc/lighttpd/lighttpd.conf` with the config file in this directory

# Creating index.html

There should be an existing index.html file located at `/usr/local/var/www/index.html`. If it doesn't exist, create an index.html at the specified path. Copy the code from the index.html located in this directory to your local index.html file

# Running Lighttpd

```
lighttpd -f /usr/local/etc/lighttpd/lighttpd.conf
```

You should now be able to visit `localhost:8090` to view the webserver.

To restart the server for any reason:
```
lighttpd -f /usr/local/etc/lighttpd/lighttpd.conf restart
```

# Other

- If you want to modify the port on which the server runs, edit the config file's server.port to whichever port you would like.
- You could also play around with the index.html file and the camera feed (which is currently the webcam)
