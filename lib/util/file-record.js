/// <reference path="./file-record-types.js" />

const _fs = require('fs');
const _path = require('path');

/**
 * @enum {FileRecord.Action}
 */
const Action = {
  /** @type {'parallel'} */
  PARALLEL: 'parallel',
  /** @type {'sequence'} */
  SEQUENCE: 'sequence',
  /** @type {'makeDirectory'} */
  MAKE_DIRECTORY: 'makeDirectory',
  /** @type {'writeFile'} */
  WRITE_FILE: 'writeFile',
  /** @type {'unlinkEntry'} */
  UNLINK_ENTRY: 'unlinkEntry',
};

const host = createHost();

module.exports = {
  host,
  createHost,

  isDirectory,
  isFile,

  Action,
};

function isDirectory(record) {
  return Boolean(record && 'entries' in record && record.entries);
}

function isFile(record) {
  return Boolean(record && 'buffer' in record && record.buffer);
}

function createHost({ fs = _fs.promises, path = _path } = {}) {
  /**
   * @param {FileRecord.Record} record
   * @param {string[]} splitPath
   * @param {FileRecord.Record[]} parents
   * @param {FileRecord.Functor} fn
   * @returns {Promise<FileRecord.Record>}
   */
  async function _walk(record, splitPath, parents, fn) {
    const newRecord = await Promise.resolve(fn(record, splitPath, parents)).catch(error => {
      if (error.code === 'ENOENT') {
        return record;
      }
      throw error;
    });

    if (newRecord.entries) {
      const entries = await Promise.all(
        newRecord.entries.map(entry =>
          _walk(entry, [...splitPath, entry.name], [...parents, newRecord], fn)
        )
      );
      return {
        ...newRecord,
        entries,
      };
    }

    return newRecord;
  }

  /**
   * @param {FileRecord.Record} record
   * @param {FileRecord.Functor} fn
   * @returns Promise<FileRecord.Record>
   */
  async function walk(record, fn) {
    return _walk(record, [], [], fn);
  }

  /**
   * @param {FileRecord.Record} record
   * @returns {FileRecord.Record}
   */
  function clone(record) {
    if (record.entries) {
      return { ...record, entries: record.entries.map(clone) };
    }
    return { ...record };
  }

  /**
   * Create a function to match paths from a path glob.
   *
   * This function provides a simple conversion from a glob source.
   *
   * If this glob needs to match partial values the glob needs to be written as such. For example if
   * the paths '' (empty string), 'tests', and 'tests/resources', need to be matched together, this
   * could be written ',tests,tests/resources' or ',tests{,resources}'. These partial paths may need
   * to be matched if the glob is used to deeply match a hierarchy, like reading from the filesystem
   * with `read`.
   *
   * - '{' start a set of options and match one of them
   * - '}' end a set of options
   * - ',' separate two options
   * - '/' match a posix or windows path separator
   * - '*' match anything except a path separator
   * - '**' match everythring
   *
   * @param {string} glob a fs-like glob to test paths with
   * @returns {function(string): boolean}
   */
  function compileGlob(glob) {
    const expr = new RegExp(
      `^(${glob.replace(/\{|\}|,|\.|\/|\*{1,2}/g, match =>
        match === '{'
          ? '('
          : match === '}'
          ? ')'
          : match === ','
          ? '|'
          : match === '.'
          ? '\\.'
          : match === '/'
          ? '[\\\\/]'
          : match === '*'
          ? '[^\\\\/]*'
          : '.*'
      )})$`
    );

    return target => expr.test(target);
  }

  /**
   * @param {string} root
   * @returns {Promise<FileRecord.Record>}
   */
  async function readFS(root) {
    try {
      const names = await fs.readdir(root);
      return { entries: names.map(name => ({ name })) };
    } catch (error) {
      if (error.code === 'ENOTDIR') {
        const buffer = await fs.readFile(root);
        return { buffer };
      }

      throw error;
    }
  }

  /**
   * @param {string} root
   * @param {object} [options]
   * @param {string} [options.glob]
   * @returns {Promise<FileRecord.Record>}
   */
  async function read(root, { glob = '**' } = {}) {
    const matchesGlob = compileGlob(glob);
    return walk({}, async (record, splitPath) => {
      const subpath = splitPath.join(path.sep);
      const rawRecord = await readFS(path.join(root, subpath));
      if (isDirectory(rawRecord)) {
        return {
          ...record,
          ...rawRecord,
          entries: rawRecord.entries.filter(({ name }) => matchesGlob(path.join(subpath, name))),
        };
      }
      return { ...record, ...rawRecord };
    });
  }

  /**
   * @param {string} root
   * @param {FileRecord.Change} change
   */
  async function commitChanges(root, change) {
    switch (change.action) {
      case Action.SEQUENCE:
        for (let j = 0; j < change.group.length; j++) {
          await commitChanges(root, change.group[j]);
        }
        break;
      case Action.PARALLEL:
        await Promise.all(change.group.map(commitChanges.bind(null, root)));
        break;
      case Action.MAKE_DIRECTORY:
        await fs.mkdir(path.join(root, change.path), { recursive: true });
        break;
      case Action.WRITE_FILE:
        await fs.writeFile(path.join(root, change.path), change.buffer);
        break;
      case Action.UNLINK_ENTRY:
        await fs.unlink(path.join(root, change.path));
        break;
      default:
        throw new Error(`unknown change: ${change.action}`);
    }
  }

  function describeChanges(changes) {
    switch (changes.action) {
      case Action.SEQUENCE:
      case Action.PARALLEL:
        return changes.group.map(describeChanges).join('\n');
      case Action.MAKE_DIRECTORY:
      case Action.WRITE_FILE:
      case Action.UNLINK_ENTRY:
        return `${changes.action} ${changes.path}`;
      default:
        throw new Error(`unknown change: ${changes.action}`);
    }
  }

  /**
   * @param {FileRecord.Record} previous
   * @param {FileRecord.Record} next
   * @returns {FileRecord.Change}
   */
  function changesFrom(previous, next) {
    function prependPathName(parentName, entries) {
      return entries.filter(Boolean).map(({ path: changePath, ...change }) =>
        change.group
          ? {
              path: path.join(parentName, changePath),
              ...change,
              group: prependPathName(parentName, change.group),
            }
          : {
              path: path.join(parentName, changePath),
              ...change,
            }
      );
    }

    function flattenParallel(entry) {
      if (entry.action === Action.PARALLEL) {
        return {
          path: entry.path,
          action: Action.PARALLEL,
          group: entry.group.flatMap(subentry =>
            subentry.action === Action.PARALLEL ? flattenParallel(subentry).group : subentry
          ),
        };
      }
      return entry;
    }

    if (!previous || (!previous.entries && !previous.buffer)) {
      previous = null;
    }
    if (!next || (!next.entries && !next.buffer)) {
      next = null;
    }

    if (previous && !next) {
      if (previous.entries) {
        // remove directory: remove children then remove self
        return {
          path: '',
          action: Action.SEQUENCE,
          group: [
            flattenParallel({
              path: '',
              action: Action.PARALLEL,
              group: previous.entries.flatMap(entry =>
                prependPathName(entry.name, [changesFrom(entry, null)])
              ),
            }),
            { path: '', action: Action.UNLINK_ENTRY },
          ],
        };
      } else if (previous.buffer) {
        // remove file
        return { path: '', action: Action.UNLINK_ENTRY };
      }
    } else if (!previous && next) {
      if (next.entries) {
        // new directory: make directory then create children
        return {
          path: '',
          action: Action.SEQUENCE,
          group: [
            { path: '', action: Action.MAKE_DIRECTORY },
            flattenParallel({
              path: '',
              action: Action.PARALLEL,
              group: next.entries.flatMap(entry =>
                prependPathName(entry.name, [changesFrom(null, entry)])
              ),
            }),
          ],
        };
      } else if (next.buffer) {
        // new file
        return { path: '', action: Action.WRITE_FILE, buffer: next.buffer };
      }
    } else if (previous.entries) {
      if (next.entries) {
        // update children
        return flattenParallel({
          path: '',
          action: Action.PARALLEL,
          group: [
            ...previous.entries.flatMap(entry =>
              prependPathName(entry.name, [
                changesFrom(
                  entry,
                  next.entries.find(({ name }) => name === entry.name)
                ),
              ])
            ),
            ...next.entries
              .filter(entry => previous.entries.every(({ name }) => name !== entry.name))
              .flatMap(entry => prependPathName(entry.name, [changesFrom(null, entry)])),
          ],
        });
      } else if (next.buffer) {
        // replace with file: remove directory then write file
        return {
          path: '',
          action: Action.SEQUENCE,
          group: [
            changesFrom(previous, null),
            { path: '', action: Action.WRITE_FILE, buffer: next.buffer },
          ],
        };
      }
    } else if (previous.buffer) {
      if (next.buffer) {
        if (!bufferIsSame(previous.buffer, next.buffer)) {
          // update file
          return { path: '', action: Action.WRITE_FILE, buffer: next.buffer };
        }
      } else if (next.entries) {
        // replace with directory: remove file then make directory
        return {
          path: '',
          action: Action.SEQUENCE,
          group: [{ path: '', action: Action.UNLINK_ENTRY }, changesFrom(null, next)],
        };
      }
    }
  }

  function bufferIsSame(previous, next) {
    if (previous.length !== next.length) {
      return false;
    }
    for (let i = 0; i < previous.length; i++) {
      if (previous[i] !== next[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {FileRecord.Record} record
   * @param {string} filepath
   * @param {FileRecord.Record} item
   */
  function insertInRecord(record, filepath, item) {
    let splitPath;
    if (typeof filepath === 'string') {
      splitPath = filepath.split(/[\\/]/g);
    } else {
      splitPath = filepath;
    }

    if (isFile(record)) {
      throw new Error('Cannot add a file as a child of a file.');
    }

    if (!isDirectory(record)) {
      record.entries = [];
    }

    if (splitPath.length > 1) {
      let entry = record.entries.find(({ name }) => name === splitPath[0]);
      if (!entry) {
        entry = { name: splitPath[0] };
        record.entries.push(entry);
      }

      insertInRecord(entry, splitPath.slice(1), clone(item));
    } else {
      record.entries.push({ name: splitPath[0], ...clone(item) });
    }
  }

  function deleteInRecord(record, filepath) {
    let splitPath;
    if (typeof filepath === 'string') {
      splitPath = filepath.split(/[\\/]/g);
    } else {
      splitPath = filepath;
    }

    if (isFile(record)) {
      throw new Error('Cannot delete file inside a file.');
    }

    if (!isDirectory(record)) {
      record.entries = [];
    }

    if (splitPath.length > 1) {
      const entry = record.entries.find(({ name }) => name === splitPath[0]);
      if (entry) {
        deleteInRecord(entry, splitPath.slice(1));
      }
    } else {
      const entryIndex = record.entries.findIndex(({ name }) => name === splitPath[0]);
      if (entryIndex !== -1) {
        record.entries.splice(entryIndex, 1);
      }
    }
  }

  /**
   * @param {FileRecord.Record} record
   * @param {string | string[]} subpath
   * @return {FileRecord.Record | null}
   */
  function findInRecord(record, subpath) {
    let splitPath;
    if (typeof subpath === 'string') {
      if (!subpath) {
        return record;
      }
      splitPath = subpath.split(/[\\/]/g);
    } else if (Array.isArray(subpath)) {
      if (subpath.length === 0) {
        return record;
      }
      splitPath = subpath;
    }

    if (!record || splitPath.length === 0) {
      return record;
    } else if (!isDirectory(record)) {
      return undefined;
    }

    const pathItem = splitPath[0];
    return findInRecord(
      record.entries.find(({ name }) => name === pathItem),
      splitPath.slice(1)
    );
  }

  function _filterRecords(entries, splitPath, test) {
    return entries
      .filter(subrecord => test(subrecord, splitPath))
      .map(subrecord => {
        if (isDirectory(subrecord)) {
          return {
            ...subrecord,
            entries: _filterRecords(subrecord.entries, [...splitPath, subrecord.name], test),
          };
        }
        return subrecord;
      });
  }

  /**
   * @param {FileRecord.Record} record
   * @param {object} test
   * @param {object} [test.glob]
   * @returns {FileRecord.Record}
   */
  function filterRecords(record, test) {
    if (test.glob) {
      const globTest = compileGlob(test.glob);
      test = (subrecord, splitPath) => {
        return globTest(
          (subrecord.name ? [...splitPath, subrecord.name] : splitPath).join(path.sep)
        );
      };
    } else {
      throw new Error('Pass a test object to fileRecord.filter.');
    }

    if (isDirectory(record)) {
      return { ...record, entries: _filterRecords(record.entries, [], test) };
    }
    return record;
  }

  return {
    walk,
    clone,
    read,
    readFS,
    find: findInRecord,
    filter: filterRecords,
    insert: insertInRecord,
    delete: deleteInRecord,

    changesFrom,
    commitChanges,
    describeChanges,

    compileGlob,
  };
}
