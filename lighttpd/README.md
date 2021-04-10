# Lighttpd - Webserver for remote access to camera feed on BruinBot

# Installation

MacOS - brew install lighttpd Download from here alternatively: https://www.lighttpd.net/download/

# Modifying config file

Replace the config file located at /usr/local/etc/lighttpd/lighttpd.conf with the config file in this directory

# Creating index.html

There should be an existing index.html file located at /usr/local/var/www/index.html. If it doesn't exist, create an index.html at the specified path. Copy the code from the index.html located in this directory to your local index.html file

# Running Lighttpd

```
lighttpd -f /usr/local/etc/lighttpd/lighttpd.conf
```

You should now be able to visit `localhost:8090` to view the webserver.

# Other

- If you want to modify the port on which the server runs, edit the config file's server.port to whichever port you would like.
