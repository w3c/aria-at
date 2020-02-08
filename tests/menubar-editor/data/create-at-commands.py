import sys
import os
import string
import glob

import optparse
import subprocess
import shlex
import time
import getopt

import json

def clean(s):
  return s.replace('""', "'").replace('"', '').replace('  ', ' ').strip()



if len(sys.argv) != 2:
  print('usage: python create-at-commands.py [at-commance.csv]')
  exit()

f = open('..\..\recourses\at-commands.js', 'r')
currentCommands = f.read()

ncf = open('at-commands.js', 'w')

newCommands = open(sys.argv[1], 'r')

count = 0
for row in newCommmands:
  cells = row.split(',')
  if count > 1:
    command = clean(cells[2])
    mode = clean(cells[3])
    at = clean(cells[4])

    keys = ''

    i = 5
    while (i < len(cells)):
      k = clean(cells[i])
      i += 1
      keys += getAssertion(a)

    keys = keys.strip()[:-1]

  count += 1
