#!/usr/bin/env python3

import socket

HOST = '127.0.0.1'
PORT = 8082

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)

sock.settimeout(5) # Number of seconds we want to wait before pinging the server

sock.connect((HOST, PORT))

sock.send(b'This is Teddy Bear.')

while True:
    try:
        msg = sock.recv(1024).decode("utf-8") 

    except socket.timeout:
        # Do things like ping the server or make request to the server here
        print('Socket timeout, pinging server...')
        sock.send(b'Heartbeat from Teddy Bear.')
        continue

    if msg == 'shutdown':
        print('Shutting down...')
        break

    print('Received: {}'.format(msg))

sock.close()