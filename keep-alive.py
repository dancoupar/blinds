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
    handlers=[logging.FileHandler("/usr/src/blinds/keep-alive.log"), logging.StreamHandler()])

try:
    url = os.environ['CONTROL_RELAY_URI'] + '/health'
except:
    logging.critical('unable to read environmental variable CONTROL_RELAY_URI')
    sys.exit(1)

bad_response_count = 0

def keep_alive():
    global bad_response_count
    while (True):
        try:
            logging.info('polling health check endpoint')
            response = requests.get(url)
            if (response.status_code == 200):
                logging.info('received 200')
                bad_response_count = 0
                logging.info('waiting for 14 minutes')
                time.sleep(14 * 60)
            else:
                logging.error('received ' + str(response.status_code))
                bad_response_count += 1
                backoff_seconds = 10 * bad_response_count
                logging.info('backing off for ' + str(backoff_seconds) + ' seconds')
                time.sleep(backoff_seconds)
        except Exception as err:
            logging.error(str(err))
            sys.exit(1)

keep_alive()
