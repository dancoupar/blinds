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

err_count = 0
bad_response_count = 0

def poll():
    global err_count
    global bad_response_count
    while (True):
        try:
            logging.info('polling for command')
            response = requests.get(url = url)
            if (response.status_code == 200):
                if (response.text == 'up' or response.text == 'down' or response.text == 'stop'):
                    logging.info('received command ' + response.text.upper())
                    os.system('python /usr/src/blinds/blinds.py ' + response.text)
                    bad_response_count = 0
            else:
                logging.error('received bad response: ' + str(response.status_code))
                bad_response_count += 1
                if (bad_response_count > 9):
                    logging.critical('aborted after ' + str(bad_response_count) + ' bad responses')
                    sys.exit(1)
                time.sleep(1)
            err_count = 0
        except Exception as err:
            logging.error(str(err))
            err_count += 1
            if (err_count > 9):
                logging.critical('aborted after ' + str(err_count) + ' errors')
                sys.exit(1)
            time.sleep(1)

poll()
