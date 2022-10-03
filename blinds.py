import argparse
import time
import sys
import RPi.GPIO as GPIO

UP = '001110110011111110000110001111001000000110'
DOWN = '001110110011111110000011101111001000010000'
STOP = '001110110011111110000010101111001000010100'
UP_LEFT = '00111011001111111011111000111100101001101'
UP_MIDDLE = '00111011001111111101111000111100111001101'
UP_RIGHT = '00111011001111111001111000111100100101101'
DOWN_LEFT = '00111011001111111011101110111100101000000'
DOWN_MIDDLE = '00111011001111111101101110111100111000000'
DOWN_RIGHT = '00111011001111111001101110111100100100000'

SHORT_DELAY = 0.00030
LONG_DELAY = 0.00060

NUM_ATTEMPTS = 10
TRANSMIT_PIN = 24

def parse_args():
    parser = argparse.ArgumentParser(prog='blinds', description='A blind control program.')
    parser.add_argument('command', choices=['up', 'down', 'stop'], help='send a command to one or more blinds')
    group = parser.add_mutually_exclusive_group()
    group.add_argument('-a', '--all', help='send the command to all blinds', action='store_true')
    group.add_argument('-l', '--left', help='send the command to the left blind', action='store_true')
    group.add_argument('-m', '--middle', help='send the command to the middle blind', action='store_true')
    group.add_argument('-r', '--right', help='send the command to the right blind', action='store_true')
    return parser.parse_args()
 
def transmit_sequence(sequence):
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(TRANSMIT_PIN, GPIO.OUT)
    for t in range(NUM_ATTEMPTS):
        transmit_start_sequence()
        for i in sequence:
            if i == '1':
                transmit_bit(1, SHORT_DELAY)
                transmit_bit(0, LONG_DELAY)
            elif i == '0':
                transmit_bit(1, LONG_DELAY)
                transmit_bit(0, SHORT_DELAY)
            else:
                continue
        GPIO.output(TRANSMIT_PIN, 0)
    GPIO.cleanup()

def transmit_start_sequence():
    transmit_bit(1, 6 * LONG_DELAY)
    transmit_bit(0, 3 * LONG_DELAY + SHORT_DELAY)
    transmit_bit(1, SHORT_DELAY + LONG_DELAY)

def transmit_bit(value, duration):
    GPIO.output(TRANSMIT_PIN, value)
    time.sleep(duration)

if __name__ == '__main__':
    args = parse_args()
    sequence = args.command.upper()
    if args.left:
        sequence += '_LEFT'
    elif args.middle:
        sequence += '_MIDDLE'
    elif args.right:
        sequence += '_RIGHT'
    exec('transmit_sequence(' + sequence + ')')

