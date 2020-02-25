import sys
import json

def clean(s):
  return s.replace('""', "'").replace('"', "").replace('  ', ' ').strip()

if len(sys.argv) != 2:
  print('usage: python create-at-commands.py [at-commands.csv]')
  exit()

newCommandsCSV = open(sys.argv[1], 'r')
count = 0
command = ''
lastCommand = 'x'

ncSets = {}
nc = {}

for row in newCommandsCSV:
  cells = row.split(',')

  if count > 1:
    command = clean(cells[1])
    if command != lastCommand:
      print()

    mode = clean(cells[2])
    at = clean(cells[3])

    if nc.get(command) == None:
      nc[command] = {}

    if nc[command].get(mode) == None:
      nc[command][mode] = {}

    if nc[command][mode].get(at) == None:
      nc[command][mode][at] = []

    # prevent duplications
    uniqueKey = command + mode + at
    if ncSets.get(uniqueKey) == None:
      ncSets[uniqueKey] = set();

    i = 4
    key = clean(cells[i])
    while len(key):

      # prevent duplications
      if (key not in ncSets[uniqueKey]):
          ncSets[uniqueKey].add(key)

          space = key.find(' ')
          keyData = ''
          if space >= 0:
            keyData = [key[0:space], key[space:]]
          else:
            keyData = [key]

          nc[command][mode][at].append(key)
          print ('[adding][' + command + '][' + mode + '][' + at + ']: ' + key)

      i += 1
      if (i >= len(cells)):
        key = '';
      else:
        key = clean(cells[i])

  lastCommand = command
  count += 1

ncf = open('commands.json', 'w')
ncf.write(json.dumps(nc))
ncf.close()
