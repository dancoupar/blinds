#!/usr/bin/python
import sys
import os
import logging
import requests
import time

logging.basicConfig(
    level=logging.INFO,
    datefmt='%Y-%m-%d %H:%M:%S',
    format='%(asctime)-15s - [%(levelname)s] %(module)s: %(message)s',
    handlers=[logging.FileHandler("/usr/src/blinds/blinds.log"), logging.StreamHandler()])

try:
    url = os.environ['CONTROL_RELAY_URI'] + '/subscribe'
except:
    logging.critical('unable to read environmental variable CONTROL_RELAY_URI')
    sys.exit(1)

try:
    client_key = os.environ['CLIENT_KEY']
except:
    logging.critical('unable to read environmental variable CLIENT_KEY')
    sys.exit(1)

bad_response_count = 0

def poll():
    global bad_response_count
    while (True):
        try:
            logging.info('polling for command')
            response = requests.get(url = url, auth=('', client_key))
            if (response.status_code == 200):
                if (response.text == 'up' or response.text == 'down' or response.text == 'stop'):
                    logging.info('received command ' + response.text.upper())
                    os.system('python /usr/src/blinds/blinds.py ' + response.text)
                    bad_response_count = 0
            else:
                request_time = response.elapsed.total_seconds()
                logging.error('received ' + str(response.status_code) + ' after ' + str(request_time) + ' seconds')
                # Occasionally the hosting infrastructure will timeout the request
                # Anything less than 10 minutes is considered a bad response
                if (request_time < 600):
                    bad_response_count += 1
                else:
                    bad_response_count = 0
                if (bad_response_count > 0):
                    backoff_seconds = 10 * bad_response_count
                    logging.info('backing off for ' + str(backoff_seconds) + ' seconds')
                    time.sleep(backoff_seconds)
        except Exception as err:
            logging.error(str(err))
            sys.exit(1)

poll()
