const _fs = require('fs');
const _path = require('path');

module.exports = {
  ...createManifestHost(),

  createManifestHost,

  DiskAction,
};

function createManifestHost({ fs = _fs.promises, path = _path } = {}) {
  /**
   * @param {DiskManifest} manifest
   * @param {string[]} pathComponents
   * @param {DiskManifest[]} parents
   * @param {DiskManifestFunctor} fn
   * @returns {Promise<DiskManifest>}
   */
  async function _createManifest(manifest, pathComponents, parents, fn) {
    const newManifest = await Promise.resolve(fn(manifest, pathComponents, parents)).catch(
      error => {
        if (error.code === 'ENOENT') {
          return manifest;
        }
        throw error;
      }
    );

    if (newManifest.entries) {
      const entries = await Promise.all(
        newManifest.entries.map(entry =>
          _createManifest(entry, [...pathComponents, entry.name], [...parents, newManifest], fn)
        )
      );
      return {
        ...newManifest,
        entries,
      };
    }

    return newManifest;
  }

  /**
   * @param {DiskManifest} manifest
   * @param {DiskManifestGlobs | DiskManifestFunctor} fn
   * @returns Promise<DiskManifest>
   */
  async function createManifest(manifest, fn) {
    if (typeof fn === 'object') {
      const filters = Object.entries(fn).map(([filter, read]) => ({
        filter: compileSimpleGlob(filter),
        read,
      }));
      fn = (submanifest, pathComponents, parents) => {
        const joinedPath = pathComponents.join(path.sep);
        for (const { filter, read } of filters) {
          if (filter.test(joinedPath)) {
            return read(submanifest, pathComponents, parents);
          }
        }
        return submanifest;
      };
    }
    return _createManifest(manifest, [], [], fn);
  }

  function compileSimpleGlob(filter) {
    return new RegExp(
      `^${filter.replace(/\{|\}|,|\.|\/|\*{1,2}/g, match =>
        match === '{'
          ? '('
          : match === '}'
          ? ')'
          : match === ','
          ? '|'
          : match === '.'
          ? '\\.'
          : match === '/'
          ? '[\\/]'
          : match === '*'
          ? '[^\\/]*'
          : '.*'
      )}$`
    );
  }

  /**
   * @param {string} root
   * @param {DiskManifest} manifest
   * @returns {Promise<DiskManifest>}
   */
  async function readDeep(root, manifest) {
    return createManifest(manifest, (submanifest, pathComponents) =>
      readShallow(path.join(root, pathComponents.join(path.sep)), submanifest)
    );
  }

  async function readShallow(root, manifest) {
    if (!manifest || (manifest.entries === undefined && manifest.buffer === undefined)) {
      try {
        const names = await fs.readdir(root);
        return { ...manifest, entries: names.map(name => ({ name })) };
      } catch (error) {
        if (error.code === 'ENOTDIR') {
          const buffer = await fs.readFile(root);
          return { ...manifest, buffer };
        }

        throw error;
      }
    }
    return manifest;
  }

  /**
   * @param {DiskChange} change
   */
  async function applyManifestChange(root, change) {
    switch (change.action) {
      case DiskAction.SEQUENCE:
        for (let j = 0; j < change.group.length; j++) {
          await applyManifestChange(root, change.group[j]);
        }
        break;
      case DiskAction.PARALLEL:
        await Promise.all(change.group.map(applyManifestChange.bind(null, root)));
        break;
      case DiskAction.MAKE_DIRECTORY:
        await fs.mkdir(path.join(root, change.path), { recursive: true });
        break;
      case DiskAction.WRITE_FILE:
        await fs.writeFile(path.join(root, change.path), change.buffer);
        break;
      case DiskAction.UNLINK_ENTRY:
        await fs.unlink(path.join(root, change.path));
        break;
      default:
        throw new Error(`unknown change: ${change.action}`);
    }
  }

  /**
   * @param {DiskManifest} previous
   * @param {DiskManifest} next
   * @returns {DiskChange}
   */
  function listManifestChanges(previous, next) {
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
      if (entry.action === DiskAction.PARALLEL) {
        return {
          path: entry.path,
          action: DiskAction.PARALLEL,
          group: entry.group.flatMap(subentry =>
            subentry.action === DiskAction.PARALLEL ? flattenParallel(subentry).group : subentry
          ),
        };
      }
      return entry;
    }

    if (previous && !previous.entries && !previous.buffer) {
      previous = null;
    }
    if (next && !next.entries && !next.buffer) {
      next = null;
    }

    if (previous && !next) {
      if (previous.entries) {
        // remove directory: remove children then remove self
        return {
          path: '',
          action: DiskAction.SEQUENCE,
          group: [
            flattenParallel({
              path: '',
              action: DiskAction.PARALLEL,
              group: previous.entries.flatMap(entry =>
                prependPathName(entry.name, [listManifestChanges(entry, null)])
              ),
            }),
            { path: '', action: DiskAction.UNLINK_ENTRY },
          ],
        };
      } else if (previous.buffer) {
        // remove file
        return { path: '', action: DiskAction.UNLINK_ENTRY };
      }
    } else if (!previous && next) {
      if (next.entries) {
        // new directory: make directory then create children
        return {
          path: '',
          action: DiskAction.SEQUENCE,
          group: [
            { path: '', action: DiskAction.MAKE_DIRECTORY },
            flattenParallel({
              path: '',
              action: DiskAction.PARALLEL,
              group: next.entries.flatMap(entry =>
                prependPathName(entry.name, [listManifestChanges(null, entry)])
              ),
            }),
          ],
        };
      } else if (next.buffer) {
        // new file
        return { path: '', action: DiskAction.WRITE_FILE, buffer: next.buffer };
      }
    } else if (previous.entries) {
      if (next.entries) {
        // update children
        return flattenParallel({
          path: '',
          action: DiskAction.PARALLEL,
          group: [
            ...previous.entries.flatMap(entry =>
              prependPathName(entry.name, [
                listManifestChanges(
                  entry,
                  next.entries.find(({ name }) => name === entry.name)
                ),
              ])
            ),
            ...next.entries
              .filter(entry => previous.entries.every(({ name }) => name !== entry.name))
              .flatMap(entry => prependPathName(entry.name, [listManifestChanges(null, entry)])),
          ],
        });
      } else if (next.buffer) {
        // replace with file: remove directory then write file
        return {
          path: '',
          action: DiskAction.SEQUENCE,
          group: [
            listManifestChanges(previous, null),
            { path: '', action: DiskAction.WRITE_FILE, buffer: next.buffer },
          ],
        };
      }
    } else if (previous.buffer) {
      if (next.buffer) {
        if (!bufferIsSame(previous.buffer, next.buffer)) {
          // update file
          return { path: '', action: DiskAction.WRITE_FILE, buffer: next.buffer };
        }
      } else if (next.entries) {
        // replace with directory: remove file then make directory
        return {
          path: '',
          action: DiskAction.SEQUENCE,
          group: [{ path: '', action: DiskAction.UNLINK_ENTRY }, listManifestChanges(null, next)],
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

  function findInManifest(manifest, subpath) {
    let pathComponents;
    if (typeof subpath === 'string') {
      if (!subpath) {
        return manifest;
      }
      pathComponents = subpath.split(path.sep);
    } else if (Array.isArray(subpath)) {
      if (subpath.length === 0) {
        return manifest;
      }
      pathComponents = subpath;
    }

    if (!manifest || pathComponents.length === 0) {
      return manifest;
    } else if (!manifest.entries) {
      return undefined;
    }

    const pathItem = pathComponents[0];
    return findInManifest(
      manifest.entries.find(({ name }) => name === pathItem),
      pathComponents.slice(1)
    );
  }

  return {
    createManifest,
    readDeep,
    readShallow,
    findInManifest,
    listManifestChanges,
    applyManifestChange,
  };
}

/**
 * @typedef DiskManifest
 * @property {DiskManifestEntry[] | null} [entries] an array of DiskManifestEntry or null if it should be removed
 * @property {Uint8Array | null} [buffer] a Uint8Array or null if it should be removed
 */

/**
 * @typedef DiskManifestEntry
 * @property {string} name
 * @property {DiskManifestEntry[] | null} [entries] an array of DiskManifestEntry or null if it should be removed
 * @property {Uint8Array | null} [buffer] a Uint8Array or null if it should be removed
 */

/**
 * @enum {'parallel'
 *   | 'sequence'
 *   | 'makeDirectory'
 *   | 'writeFile'
 *   | 'unlinkEntry'
 * }
 */
const DiskAction = {
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

/**
 * @typedef DiskChange
 * @property {string} path
 * @property {DiskAction} action
 * @property {Uint8Array} [buffer]
 * @property {DiskChange[]} [group]
 */

/**
 * @typedef {function(DiskManifest, string[], DiskManifest[]): PromiseLike<DiskManifest> | DiskManifest} DiskManifestFunctor
 */

/**
 * @typedef {{[filter: string]: DiskManifestFunctor}} DiskManifestGlobs
 */
