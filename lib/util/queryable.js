/**
 * @template T
 */
class Queryable {
  /**
   * @param {object} options
   * @param {string} options.name
   * @param {function(function(T): boolean): T} options.find
   * @param {function(function(T): boolean): T[]} options.findAll
   */
  constructor({ name, find, findAll }) {
    /** @type {string} */
    this.name = name;
    /**
     * @type {function(function(T): boolean): T}
     * @private
     */
    this.find = find;
    /**
     * @type {function(function(T): boolean): T[]}
     * @private
     */
    this.findAll = findAll;
  }
  where(goal) {
    return this.find(where2(goal));
  }
  allWhere(goal) {
    return this.findAll(where2(goal));
  }
  /**
   * @param {string} name
   * @param {Object<string, T> | T[]} collection
   * @returns {Queryable<T>}
   * @template T
   */
  static from(name, collection) {
    if (!Array.isArray(collection)) {
      collection = Object.values(collection);
    }
    return new Queryable({
      name,
      find: collection.find.bind(collection),
      findAll: collection.filter.bind(collection),
    });
  }
}

/**
 * @param {*} goal a non array object or non-function literal value
 * @returns {function(*): boolean}
 */
function where2(goal) {
  if (typeof goal === 'object' && goal !== null) {
    if (Array.isArray(goal)) {
      throw new Error();
    }
    const keyChecks = Object.entries(goal).map(([key, value]) => {
      const check = where2(value);
      const get = target => target[key];
      return target => check(get(target));
    });
    const isObject = target => typeof target === 'object' && !Array.isArray(target);
    const allChecks = [isObject, ...keyChecks];
    return target => allChecks.every(check => check(target));
  } else if (typeof goal === 'function') {
    throw new Error();
  }
  return target => target === goal;
}

exports.Queryable = Queryable;
