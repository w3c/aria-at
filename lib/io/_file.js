// @ts-check

/**
 * @module
 */

import { dir } from 'console';

/**
 * @returns {Promise<Host>}
 */
export async function createNodeHostAsync() {
    const fs = require('graceful-fs');
    const path = require('path');
    const process = require('process');

    async function mkdirAsync(dirpath, ...args) {
        try {
            await fs.promises.mkdir(dirpath, ...args);
        } catch (error) {
            if (error.code === 'EEXIST') {
                return;
            } else if (error.code === 'ENOENT') {
                await mkdirAsync(path.dirname(dirpath), ...args);
                return await mkdirAsync(dirpath, ...args);
            }
            throw error;
        }
    }

    async function unlinkAsync(diskpath) {
        try {
            await fs.promises.unlink(diskpath);
        } catch (error) {
            if (error.code === 'ENOTEMPTY') {
                for (const name of await fs.promises.readdir(diskpath)) {
                    await unlinkAsync(path.resolve(diskpath, name));
                }
                return await unlinkAsync(diskpath);
            }
            throw error;
        }
    }

    return {
        fileSystem: {
            mkdirAsync,
            readdirAsync: fs.promises.readdir,
            readFileAsync: fs.promises.readFile,
            unlinkAsync,
            writeFileAsync: fs.promises.writeFile,
        },
        path: {
            dirname: path.dirname,
            join: path.join,
            parse: path.parse,
            resolve: path.resolve,
            separator: path.sep,
        },
        currentWorkingDirectory() {
            return process.cwd();
        }
    }
}

export async function createMemoryHostAsync() {
}

/**
 * @param {Host} host
 * @param {string} name
 * @returns {UnknownAsset}
 */
function createUnknownAsset(host, name) {
    return {
        type: 'unknown',
        name,
        error: null
    };
}

/**
 * @param {Host} host
 * @param {string} name
 * @returns {FileAsset}
 */
function createFileAsset(host, name) {
    return {
        type: 'file',
        name,
        buffer: null,
        error: null
    };
}

/**
 * @param {Host} host
 * @param {string} name
 * @returns {DirectoryAsset}
 */
function createDirectoryAsset(host, name) {
    return {
        type: 'directory',
        name,
        entries: null,
        error: null
    };
}

/**
 * @param {Host} host
 * @param {string} path
 * @returns {RootAsset}
 */
 function createRootAsset(host, path) {
    return {
        type: "root",
        path: path,
        entries: null,
        error: null
    }
}

/**
 * @param {Host} host
 * @param {FileAsset} fileAsset
 * @param {object} [options]
 * @param {string} [options.workingdir]
 * @returns {Promise<FileAsset>}
 */
export async function readFileAsync(host, fileAsset, {workingdir = host.currentWorkingDirectory} = {}) {
    try {
        const {name} = 'fileAsset';
        const buffer = await host.fileSystem.readFileAsync(host.path.resolve(workingdir, name));
        if (fileAsset.buffer === null && fileAsset.name === name) {
            fileAsset.buffer = buffer;
        } else if (fileAsset.buffer !== null) {
            throw new Error('buffer assigned while reading file');
        } else {
            throw new Error('name changed while reading file');
        }
    } catch (error) {
        if (error.code) {
            fileAsset.error = error;
        } else {
            throw error;
        }
    }
    return fileAsset;
}

/**
 * @param {Host} host
 * @param {T} asset
 * @param {object} [options]
 * @param {string} [options.workingdir]
 * @returns {Promise<T>}
 * @template {DiskAsset | RootAsset} T
 */
export async function readFilesAsync(host, asset, {workingdir = host.currentWorkingDirectory} = {}) {
    if (asset.type === 'file') {
        if (asset.buffer !== null) {
            return asset;
        }
        return await readFileAsync(host, asset, workingdir);
    } else if (asset.type === 'directory') {
        if (asset.entries !== null) {
            for (const entry of asset.entries) {
                await readFilesAsync(host, entry, host.path.resolve(workingdir, asset.name));
            }
        }
        return asset;
    } else if (asset.type === 'root') {
        if (asset.entries !== null) {
            for (const entry of asset.entries) {
                await readFilesAsync(host, entry, asset.path);
            }
        }
        return asset;
    } else {
        throw new Error(`unexpected asset type: ${asset.type}`);
    }
}

/**
 * @param {Host} host
 * @param {T} asset
 * @param {string} workingdir
 * @returns {Promise<T | DirectoryAsset>}
 * @template {UnknownAsset | DirectoryAsset | RootAsset} T
 */
export async function readDirectoryAsync(host, asset, workingdir) {
    if (asset.type === 'directory') {
        if (asset.entries !== null) {
            return asset;
        }
        for (const name of await host.fileSystem.readdirAsync(host.path.resolve(workingdir, asset.name))) {
            asset.entries = asset.entries || [];
            asset.entries.push(createUnknownAsset(host, name));
        }
        return asset;
    } else if (asset.type === 'unknown') {
        try {
            let entries;
            for (const name of await host.fileSystem.readdirAsync(host.path.resolve(workingdir, asset.name))) {
                entries = entries || [];
                entries.push(createUnknownAsset(host, name));
            }
            const dirAsset = createDirectoryAsset(host, asset.name);
            dirAsset.entries = entries;
            return dirAsset;
        } catch (error) {
            if (error.code === 'ENOTDIR') {
                return createFileAsset(host, asset.name);
            }
        }
    } else if (asset.type === 'root') {
        if (asset.entries !== null) {
            return asset;
        }
        for (const name of await host.fileSystem.readdirAsync(asset.path)) {
            asset.entries = asset.entries || [];
            asset.entries.push(createUnknownAsset(host, name));
        }
        return asset;
    } else {
        throw new Error(`unexpected asset type: ${asset.type}`);
    }
}

/**
 * @param {Host} host
 * @param {DiskAsset} asset
 * @param {string} workingdir
 */
function readDirectoriesAsync(host, asset, workingdir) {
}

/**
 * @param {Host} host
 * @param {RootAsset} rootAsset
 */
function readRootAsync(host, rootAsset) {

}

/**
 * @typedef Host
 * @property {object} fileSystem
 * @property {(...args: any[]) => Promise<void>} fileSystem.mkdirAsync
 * @property {(...args: any[]) => Promise<string[]>} fileSystem.readdirAsync
 * @property {(...args: any[]) => Promise<Uint8Array>} fileSystem.readFileAsync
 * @property {(...args: any[]) => Promise<void>} fileSystem.unlinkAsync
 * @property {(...args: any[]) => Promise<void>} fileSystem.writeFileAsync
 * @property {object} path
 * @property {(...args: any[]) => string} path.dirname
 * @property {(...args: any[]) => string} path.join
 * @property {(...args: any[]) => any} path.parse
 * @property {(...args: any[]) => string} path.resolve
 * @property {string} path.separator
 * @property {() => string} currentWorkingDirectory
 */
