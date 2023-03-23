#!/usr/bin/python
import logging
import requests
import os
import time

logging.basicConfig(
    level=logging.INFO,
    datefmt='%Y-%m-%d %H:%M:%S',
    format='%(asctime)-15s - [%(levelname)s] %(module)s: %(message)s',
    handlers=[logging.FileHandler("blinds.log"), logging.StreamHandler()])
  
url = "https://blind-control-relay-xxxxxxxxxxxx.onrender.com/subscribe"
err_count = 0
bad_response_count = 0

def poll():
    global err_count
    global bad_response_count
    while (bad_response_count < 10):
        logging.info('polling for command')
        response = requests.get(url = url)
        if (response.status_code == 200):
            if (response.text == 'UP' or response.text == 'DOWN' or response.text == 'STOP'):
                logging.info('received command ' + response.text)
                os.system('python /usr/src/blinds/blinds.py ' + response.text)
                bad_response_count = 0
        else:
            logging.error('received bad response: ' + str(response.status_code))
            bad_response_count += 1
        err_count = 0

try:
    poll()
    logging.critical('aborted after ' + str(bad_response_count) + ' bad responses')
    
except Exception as err:
    logging.error(str(err))
    err_count += 1
    if (err_count < 10):
        time.sleep(10)
        poll()
