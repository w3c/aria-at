/** @format */

const fsPromise = require("fs/promises");
const fsExtra = require("fs-extra");

/**
 * @param {Host} host
 * @param {string} name
 * @returns {UnknownAsset}
 */
export function createUnknownAsset(name) {
  return {
    type: "unknown",
    name,
    error: null,
  };
}

/**
 * @param {Host} host
 * @param {string} name
 * @returns {FileAsset}
 */
export function createFileAsset(name) {
  return {
    type: "file",
    name,
    buffer: null,
    error: null,
  };
}

/**
 * @param {Host} host
 * @param {string} name
 * @returns {DirectoryAsset}
 */
export function createDirectoryAsset(name) {
  return {
    type: "directory",
    name,
    entries: null,
    error: null,
  };
}

/**
 * @param {Host} host
 * @param {string} path
 * @returns {RootAsset}
 */
export function createRootAsset(path) {
  return {
    type: "root",
    path: path,
    entries: null,
    error: null,
  };
}

const ALL_TYPES = ["unknown", "file", "directory", "root"];

/**
 * @param {PartialFileOptions} options
 * @returns {FileOptions}
 */
function defaultOptions(options) {
  if (
    options &&
    "workingdir" in options &&
    "types" in options &&
    options.types &&
    "unknown" in options.types &&
    "file" in options.types &&
    "directory" in options.types
  ) {
    return options;
  }
  return {
    workingdir: (options ? options.workingdir : null) || process.cwd(),
    types: {
      unknown: true,
      file: true,
      directory: true,
      ...options.types,
    },
  };
}

/**
 * @param {T} a
 * @param {T} b
 * @returns {boolean}
 * @template {Uint8Array | string[]} T
 */
function sameData(a, b) {
  if (a.length === b.length) {
    for (let i = 0; i < a.length; i++) {
      if (deepEquals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * @param {DiskAsset} asset
 * @param {PartialFileOptions} [options]
 * @returns {Promise<DiskAsset>}
 */
export async function readAsset(asset, options) {
  options = defaultOptions(options);
  if (asset.type === "unknown") {
    if (options.types.unknown) {
      const dirAsset = await readAsset(createDirectoryAsset(asset.name), options);
      if (dirAsset.entries !== null) {
        return dirAsset;
      }
      const fileAsset = await readAsset(createFileAsset(asset.name), options);
      if (fileAsset.buffer !== null) {
        return fileAsset;
      }
    }
    return asset;
  } else if (asset.type === "file") {
    if (options.types.file) {
      try {
        const buffer = new Uint8Array(await fsPromise.readFile(path.resolve(options.workingdir, asset.name)));
        return /** @type {FileAsset} */ ({
          type: "file",
          name: asset.name,
          buffer,
          action: "loaded",
          error: null,
        });
      } catch (error) {
        return /** @type {FileAsset} */ ({
          type: "file",
          name: asset.name,
          buffer: null,
          action: "failed",
          error,
        });
      }
    }
    return asset;
  } else if (asset.type === "directory") {
    if (options.types.directory) {
      try {
        const names = await fsPromise.readdir(path.resolve(options.workingdir, asset.name));
        const entries = await Promise.all(names.map(name => readAsset(createUnknownAsset(name), options)));
        return /** @type {DirectoryAsset} */ ({
          type: "directory",
          name: asset.name,
          entries,
          action: "loaded",
          error: null,
        });
      } catch (error) {
        return /** @type {DirectoryAsset} */ ({
          type: "directory",
          name: asset.name,
          entries: null,
          action: "failed",
          error,
        });
      }
    }
    return asset;
  } else if (asset.type === "root") {
    try {
      const names = await fsPromise.readdir(path.resolve(options.workingdir, asset.name));
      const entries = await Promise.all(names.map(name => readAsset(createUnknownAsset(name), options)));
      return /** @type {RootAsset} */ ({
        type: "root",
        path: asset.name,
        entries,
        action: "loaded",
        error: null,
      });
    } catch (error) {
      return /** @type {RootAsset} */ ({
        type: "root",
        path: asset.name,
        entries: null,
        action: "failed",
        error,
      });
    }
  } else {
    throw new Error(`unknown asset type: ${asset.type}`);
  }
}

/**
 * @param {EntryAsset[]} previous
 * @param {EntryAsset[]} current
 * @returns {boolean}
 */
function sameEntries(previous, current) {
  if (previous.length !== current.length) {
    return false;
  }
  for (let i = 0; i < current.length; i++) {
    const previousEntry = previous[i];
    const currentEntry = current[i];
    if (previousEntry.type !== currentEntry.type) {
      return false;
    }
    if (previousEntry.name !== currentEntry.name) {
      return false;
    }
    if (currentEntry.type === "file") {
      if (!sameData(previousEntry.buffer, currentEntry.buffer)) {
        return false;
      }
    } else if (currentEntry.type === "directory") {
      if (!sameEntries(previousEntry.entries, currentEntry.entries)) {
        return false;
      }
    } else if (currentEntry.type !== "unknown") {
      throw new Error(`unknown asset type: ${currentEntry.type}`);
    }
  }
  return true;
}

/**
 * @param {EntryAsset[]} entries
 * @returns {EntryAsset[]}
 */
function changedEntries(entries) {
  return entries.map(entry => {
    if (entry.type === "directory") {
      return /** @type {DirectoryAsset} */ ({
        ...entry,
        entries: changedEntries(entries),
        action: "changed",
      });
    }
    return {
      ...entry,
      action: "changed",
    };
  });
}

/**
 * @param {T} previous
 * @param {T} current
 * @returns {T}
 * @template {DiskAsset} T
 */
export function diffAsset(previous, current) {
  if (current.type === "file" && previous.type === "file") {
    if (sameData(previous.buffer, current.buffer)) {
      return /** @type {FileAsset} */ ({
        ...current,
        action: "unchanged",
      });
    }
  } else if (current.type === "file" && previous.type !== "file") {
    return /** @type {FileAsset} */ ({
      ...current,
      action: "replace",
    });
  } else if (
    (current.type === "directory" && previous.type === "directory") ||
    (current.type === "root" && previous.type === "root")
  ) {
    const entries = [
      ...current.entries.map(currentEntry => {
        const previousEntry = previous.entries.find(
          ({type, name}) => type === currentEntry.type && name === currentEntry.name
        );
        if (!previousEntry) {
          return currentEntry;
        }
        return diffAsset(previousEntry, currentEntry);
      }),
      ...previous.entries
        .map(previousEntry => {
          const currentEntry = current.entries.find(
            ({type, name}) => type === previousEntry.type && name === previousEntry.name
          );
          if (!currentEntry) {
            return /** @type {UnknownAsset} */ ({
              type: "unknown",
              name: previousEntry.name,
              action: "unlinked",
              error: null,
            });
          }
        })
        .filter(Boolean),
    ].sort(({name: a}, {name: b}) => a.localeCompare(b));
    return /** @type {T} */ ({
      ...current,
      entries,
      action: entries.every(({action}) => (action === "unchanged" ? "unchanged" : "changed")),
    });
  } else if (current.type === "directory" && previous.type !== "directory") {
    return /** @type {DirectoryAsset} */ ({
      ...current,
      entries: changedEntries(current.entries),
      action: "replace",
    });
  } else if (current.type === "unknown" && previous.type === "unknown") {
    if (previous.name === current.name) {
      return /** @type {UnknownAsset} */ ({
        ...current,
        action: "unchanged",
      });
    }
  } else if (current.type !== previous.type) {
    throw new Error(`cannot diff asset types: ${previous.type} and ${current.type}`);
  } else {
    throw new Error(`unknown asset type: ${current.type}`);
  }
  return {...current, action: "changed"};
}

/**
 * @param {EntryAsset | RootAsset} asset
 * @param {PartialFileOptions} [options]
 * @returns {Promise<void>}
 */
export async function writeAsset(asset, options = {}) {
  options = defaultOptions(options);
  if (asset.type === "file") {
    if (asset.action === "replace") {
      await fsExtra.unlink(path.resolve(options.workingdir, asset.name));
    }
    if (asset.action !== "unchanged") {
      await fsPromise.writeFile(path.resolve(options.workingdir, asset.name));
    }
  } else if (asset.type === "directory") {
    if (asset.entries !== null) {
      const dirOptions = /** @type {FileOptions} */ ({
        ...options,
        workingdir: path.resolve(options.workingdir, options.name),
      });
      if (asset.action === "replace") {
        await fsExtra.unlink(dirOptions.workingdir);
      }
      if (asset.action !== "unchanged") {
        await fsExtra.mkdirp(dirOptions.workingdir);
        for (const entry of asset.entries) {
          await writeAsset(entry, dirOptions);
        }
      }
    }
  } else if (asset.type === "root") {
    if (asset.entries !== null) {
      const rootOptions = /** @type {} */ ({
        ...options,
        workingdir: path.resolve(asset.path),
      });
      if (asset.action !== "unchanged") {
        for (const entry of asset.entries) {
          await writeAsset(entry, rootOptions);
        }
      }
    }
  } else if (asset.action === "unlinked") {
    await fsExtra.unlink(path.resolve(dirOptions.workingdir, asset.name));
  } else if (asset.type !== "unknown") {
    throw new Error(`unknown asset type: ${asset.type}`);
  }
}

/**
 * @typedef FileOptions
 * @property {string} workingdir
 * @property {object} types
 * @property {boolean} types.unknown
 * @property {boolean} types.file
 * @property {boolean} types.directory
 */

/**
 * @typedef PartialFileOptions
 * @property {string} [workingdir]
 * @property {object} [types]
 * @property {boolean} [types.unknown]
 * @property {boolean} [types.file]
 * @property {boolean} [types.directory]
 */

/** @typedef {module:types/file~DiskAsset} DiskAsset */
