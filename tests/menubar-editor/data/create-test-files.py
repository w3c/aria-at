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
  return s.replace('""', "'").replace('"', '').replace('  ', ' ').replace(';', ',').strip()

def getAssertion(a):
  if len(a) == 0:
    return ''

  priority = '1'

  if a.find('1:') == 0:
    a = a[2:]

  if a.find('2:') == 0:
    priority = '2'
    a = a[2:]

  if a.find('3:') == 0:
    priority = '3'
    a = a[2:]

  a = '      [' + priority + ', "' + a + '"],\n'

  return a

def getSetupTestPageScript(fname):

  code = ''

  if len(fname.strip()):
    f = open(os.path.join('js', (fname + '.js')), 'r')

    code = 'setupTestPage: function setupTestPage(document) {\n'

    for line in f:
      code += '      ' + line.strip() + '\n'

    code += '    },\n'

  return code

def getSetupTestPageDescription(description):
  if description:
    return 'setup_script_description: "' + description.replace('"', "'") + '",'
  else:
    return ''

path = ''
testTitle = ''

if not (len(sys.argv) == 3 or len(sys.argv) == 5):
  print('usage: python create-test-files.py [reference.csv] [tests.csv] [path] [title]')
  print('note: path and title are optional, when included an index.html file will be created')
  exit()

if len(sys.argv) == 5:
  path = sys.argv[3]
  testTitle = sys.argv[4]

f = open('test.template', 'r')
template = f.read()

if len(testTitle):
  f = open('index.template', 'r')
  index = f.read()

print('REFERENCES')

references = open(sys.argv[1], 'r')
referenceLinks = {}
for ref in references:
  r = ref.split(',')
  key = r[0].strip()
  url = r[1].strip()
  print(key + ': ' + url)
  referenceLinks[key] = url

print()

print('FILES')

tests = open(sys.argv[2], 'r')

count = 0
testList = ''
repeatNames = {}
for row in tests:
  cells = row.split(',')
  if count > 1:
    title = clean(cells[2])
    appliesTo = clean(cells[3]).replace(', ', '", "');
    mode = clean(cells[4])
    task = clean(cells[5])
    setupTestPage = getSetupTestPageScript(cells[6])
    setupTestPageDescription = getSetupTestPageDescription(cells[7])
    refs = clean(cells[8]).split(' ')
    instructions = clean(cells[9])

    assertions = ''

    i = 10
    while (i < len(cells)):
      a = clean(cells[i])
      i += 1
      assertions += getAssertion(a)

    references = '<link rel="help" href="' + referenceLinks['example'] + '">\n'

    for r in refs:
      if len(r):
        references += '<link rel="help" href="' + referenceLinks[r] + '">\n'

    assertions = assertions[:-2]

    example = referenceLinks['reference']
    fname = task.lower().replace('=', '-').replace("'", '').replace('"', '').replace(' ', '-')

    if fname in repeatNames.keys():
      num = repeatNames[fname] + 1
      repeatNames[fname] = repeatNames[fname] + 1
      fname = fname + '-' + str(num)
    else:
      repeatNames[fname] = 1

    test = template
    if len(fname) > 3:
      fname += '.html'
      print('TEST ' + str(count-1) + ': ' + fname)
      test = test.replace('%SETUP_TEST_PAGE%', setupTestPage)
      test = test.replace('%SETUP_TEST_PAGE_DESCRIPTION%', setupTestPageDescription)
      test = test.replace('%TITLE%', title)
      test = test.replace('%REFERENCES%', references)
      test = test.replace('%APPLIES_TO%', appliesTo)
      test = test.replace('%TASK%', task)
      test = test.replace('%MODE%', mode)
      test = test.replace('%INSTRUCTIONS%', instructions)
      test = test.replace('%ASSERTIONS%', assertions)
      test = test.replace('%EXAMPLE%', example)

      if len(testTitle):
          testList += '    <li><a target="test_file" href="localhost:3000/tests/' + path + '/' + fname + '">' + title + '</a></li>\n'

      t = open(os.path.join('..', fname), 'w')
      t.write(test)
      t.close()

  count += 1


if len(testTitle):
  index = index.replace("%TITLE%", testTitle)
  index = index.replace("%TEST_LIST%", testList)
  t = open(os.path.join('..', 'index.html'), 'w')
  t.write(index)
  t.close()

