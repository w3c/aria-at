import sys
import os
import string
import glob

import optparse
import subprocess
import shlex
import time
import getopt

def clean(s):
  return s.replace('""', "'").replace('"', "").replace('  ', ' ').strip()

TARGET1 = 'const AT_COMMAND_MAP = {'
TARGET2 = '};'

def ATCommandsToObject(commands):

  def getKeyboardCommands(data, command, mode, at):
    i = data.find(mode)
    if i > 0:
      if commandsObj.get(command) == None:
        commandsObj[command] = {}

      if commandsObj[command].get(mode) == None:
        commandsObj[command][mode] = {}

      i = data.find(at, i+1)
      if i > 0:
        i = commandData.find('[', i+1)
        if i > 0:
          i += 1
          j = commandData.find(']', i)
          if j > 0:
            keys = commandData[i:j].strip()
            commandsObj[command][mode][at] = []
            for k in keys.split(','):
              k = k.strip()
              if len(k):
                commandsObj[command][mode][at].append(k)

            for k in commandsObj[command][mode][at]:
              print('[' + command + '][' + mode + '][' + at + ']: ' + k)
            return

    print('[' + command + '][' + mode + '][' + at + ']: not found')

  commandsObj = {}

  a = commands.split(TARGET1)
  before = a[0] + TARGET1
  commands = a[1]
  if len(commands) > 0:
    b = commands.split(TARGET2)
    commands = b[0]
    after = TARGET2 + b[1]

    i = 0
    j = 0;
    while i >=0 and j >= 0 and i < len(commands):

      i = commands.find('"', j)
      if i > 0:
        j = commands.find('"', i+1)
        if j > 0:
          j += 1
          command = commands[i:j]
          commandsObj[command] = {}
          k = commands.find('"', j)
          if k > 0:
            commandData = commands[j+1:k-1]

            getKeyboardCommands(commandData, command, 'reading', 'jaws')
            getKeyboardCommands(commandData, command, 'reading', 'nvda')
            getKeyboardCommands(commandData, command, 'reading', 'voiceover')
            getKeyboardCommands(commandData, command, 'interaction', 'jaws')
            getKeyboardCommands(commandData, command, 'interaction', 'nvda')
            getKeyboardCommands(commandData, command, 'interaction', 'voiceover')

  return [before, commandsObj, after]


if len(sys.argv) != 2:
  print('usage: python create-at-commands.py [at-commance.csv]')
  exit()

ccf = open('../../resources/at-commands.mjs', 'r')
newCommands = ccf.read()

newCommands = ATCommandsToObject(newCommands)
newCommandsCSV = open(sys.argv[1], 'r')
count = 0
commands = ''

for row in newCommandsCSV:
  cells = row.split(',')
  if count > 1:
    command = clean(cells[1])
    mode = clean(cells[2])
    at = clean(cells[3])
    keys = clean(cells[4])

    print (command + ' ' + at + ' ' + mode + ' ' + keys)

  count += 1


ncf = open('at-commands.mjs', 'w')
ncf.write(newCommands[0]+str(newCommands[1])+newCommands[2])
ncf.close()

