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
  return s.replace('""', "'").replace('"', '').replace('  ', ' ').strip()

def getAssertion(a):
  if len(a) == 0:
    return ''

  a = '["' + a + '"],\n'

  return a


if len(sys.argv) != 3:
  print('usage: python create-test-files.py [tests.csv] [reference/example.html]')
  exit()

f = open('test.template', 'r')

template = f.read()

tests = open(sys.argv[1], 'r')

count = 0
for row in tests:
  cells = row.split(',')
  if count > 1:
    mode = clean(cells[3])
    task = clean(cells[2])
    instructions = clean(cells[4])

    assertions = ''

    i = 5
    while (i < len(cells)):
      a = clean(cells[i])
      i += 1
      assertions += getAssertion(a)

    assertions = assertions.strip()[:-1]

    example = sys.argv[2]
    fname = (task + mode).lower().replace('=', '-').replace("'", '').replace('"', '').replace(' ', '-')
    if len(fname):
      fname += '.html'
      print(fname)

      test = template
      test = test.replace('%TASK%', task)
      test = test.replace('%MODE%', mode)
      test = test.replace('%INSTRUCTIONS%', instructions)
      test = test.replace('%ASSERTIONS%', assertions)
      test = test.replace('%EXAMPLE%', example)

      t = open('..\\' + fname, 'w')
      t.write(test)
      t.close()

  count += 1
