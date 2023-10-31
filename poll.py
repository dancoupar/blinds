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
            response = requests.get(url = url, auth=('', client_key), timeout=(2, 310))
            if (response.status_code == 200):
                if (response.text == 'up' or response.text == 'down' or response.text == 'stop'):
                    logging.info('received command ' + response.text.upper())
                    os.system('python /usr/src/blinds/blinds.py ' + response.text)
                    bad_response_count = 0
                else:
                    logging.critical('received unrecognised command ' + response.text.upper())
                    sys.exit(1)
            elif (response.status_code == 504):
                # The control relay will time out the request after 5 minutes
                # This is normal and not considered an error, we just fire off a new request
                request_time = response.elapsed.total_seconds()
                logging.info('request timed out after ' + str(request_time) + ' seconds')
                bad_response_count = 0
            elif (response.status_code == 401):
                logging.critical('received 401')
                sys.exit(1)
            else:
                request_time = response.elapsed.total_seconds()
                logging.error('received ' + str(response.status_code) + ' after ' + str(request_time) + ' seconds')
                bad_response_count += 1
                backoff_seconds = 10 * bad_response_count
                logging.info('backing off for ' + str(backoff_seconds) + ' seconds')
                time.sleep(backoff_seconds)
        except requests.exceptions.Timeout:
            logging.error(str(err))
        except Exception as err:
            logging.error(str(err))
            sys.exit(1)

poll()
