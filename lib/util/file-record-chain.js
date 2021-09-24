/// <reference path="./file-record-types.js" />

const { host: defaultHost, isDirectory, isFile } = require('./file-record');

/**
 * @param {FileRecord.Record | FileRecordChain} record
 * @returns {FileRecord.Record}
 */
function toRecord(record) {
  if (record instanceof FileRecordChain) {
    return record.record;
  }
  return record;
}

class FileRecordChain {
  /**
   * @param {FileRecord.Record} [record]
   */
  constructor(record, host = defaultHost) {
    this._record = record;
    this._host = host;
  }

  /**
   * @returns {FileRecord.Record | undefined}
   */
  get record() {
    return this._record;
  }

  /**
   * @returns {string | undefined}
   */
  get name() {
    if (this._record) {
      return this._record.name;
    }
    return undefined;
  }

  /**
   * @returns {FileRecordChain[]}
   */
  get entries() {
    if (isDirectory(this._record)) {
      return this._record.entries.map(record => new FileRecordChain(record, this._host));
    }
    return [];
  }

  /**
   * @returns {Uint8Array | undefined}
   */
  get buffer() {
    if (this._record) {
      return this._record.buffer;
    }
    return undefined;
  }

  /**
   * @returns {string | undefined}
   */
  get text() {
    const { buffer } = this;
    if (buffer) {
      return new TextDecoder().decode(buffer);
    }
    return undefined;
  }

  /**
   * @returns {boolean}
   */
  isDirectory() {
    return isDirectory(this._record);
  }

  /**
   * @returns {boolean}
   */
  isFile() {
    return isFile(this._record);
  }

  /**
   * @param {string} filepath
   * @param {FileRecord.Record | FileRecordChain} entry
   */
  add(filepath, entry) {
    this._host.insert(this._record, filepath, toRecord(entry));
  }

  /**
   * @param {string} filepath
   */
  delete(filepath) {
    this._host.delete(this._record, filepath);
  }

  /**
   * @param {string} filepath
   * @returns {FileRecordChain}
   */
  find(filepath) {
    return new FileRecordChain(this._host.find(this._record, filepath), this._host);
  }

  /**
   * @param {object} [options]
   * @param {string} [options.glob]
   * @returns {FileRecordChain}
   */
  filter(options) {
    return new FileRecordChain(this._host.filter(this._record, options), this._host);
  }

  /**
   * @param {FileRecord.Record | FileRecordChain} previous
   * @returns {FileRecordChangesChain}
   */
  changesAfter(previous) {
    const previousRecord = toRecord(previous);

    return new FileRecordChangesChain(
      previousRecord,
      this._record,
      this._host.changesFrom(previousRecord, this._record),
      this._host
    );
  }

  /**
   * @param {string} root
   * @param {object} [options]
   * @param {string} [options.glob]
   * @returns {Promise<FileRecordChain>}
   */
  static async read(root, options, host = defaultHost) {
    return new FileRecordChain(host.read(root, options), host);
  }
}

class FileRecordChangesChain {
  /**
   * @param {FileRecord.Record} previous
   * @param {FileRecord.Record} next
   * @param {FileRecord.Change} changes
   */
  constructor(previous, next, changes, host = defaultHost) {
    this._previous = previous;
    this._next = next;
    this._changes = changes;
    this._host = host;
  }

  /**
   * @param {string} root
   */
  async commit(root) {
    await this._host.commitChanges(root, this._changes);
  }
}

module.exports = {
  FileRecordChain,
  FileRecordChangesChain,
};
