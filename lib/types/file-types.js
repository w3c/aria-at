/**
 * Rudimentary virtual disk types representing the input files from disk, and
 * files before they are written to disk.
 *
 * @module types/file
 */

/**
 * @typedef UnknownAsset
 * @property {"unknown"} type
 * @property {string} name
 * @property {("pending" | "unlinked" | "unchanged")} action
 * @property {Error | null} error
 */

/**
 * @typedef ErrorAsset
 */

/**
 * @typedef FileAsset
 * @property {"file"} type
 * @property {string} name
 * @property {Uint8Array | null} buffer
 * @property {"replace" | "changed" | "unchanged"} action
 * @property {Error | null} error
 */

/**
 * @typedef DirectoryAsset
 * @property {"directory"} type
 * @property {string} name
 * @property {EntryAsset[] | null} entries
 * @property {"replace" | "changed" | "unchanged"} action
 * @property {Error | null} error
 */

/**
 * @typedef RootAsset
 * @property {"root"} type
 * @property {string} path
 * @property {EntryAsset[] | null} entries
 * @property {"changed" | "unchanged"} action
 * @property {Error | null} error
 */

/**
 * @typedef {(UnknownAsset | FileAsset | DirectoryAsset)} EntryAsset
 */

/**
 * @typedef {(UnknownAsset | FileAsset | DirectoryAsset | RootAsset)} DiskAsset
 */
