/**
 * @param {TemplateStringsArray} templateArray
 * @param  {...*} args
 * @returns {Lines}
 */
function reindent(templateArray, ...args) {
  return Lines.cast(
    templateArray
      .map(Lines.cast)
      .reduce((carry, subtemplate, index) =>
        carry.indent(args[index - 1]).concat(subtemplate)
      )
  );
}

const indentRegExp = /^\s*/;
class Line {
  /**
   * @param {Line | string} head
   * @param {Line | string} tail
   */
  constructor(head, tail = '') {
    /** @type {Line | string} */
    this.head = head;
    /** @type {Line | string} */
    this.tail = tail;
  }

  /**
   * @param {Lines} lines
   * @returns {Line[]}
   */
  concat(lines) {
    if (lines.lines.length === 0) {
      return [this];
    }
    return [new Line(this, lines.lines[0]), ...lines.lines.slice(1)];
  }

  /**
   * @param {Lines} lines
   * @returns {Line[]}
   */
  indent(lines) {
    if (this.head instanceof Line) {
      return this.head.indent(lines);
    }
    if (lines.lines.length === 0) {
      return [this];
    }
    const { head } = this;
    let indent = indentRegExp.exec(head)[0];
    if (indent.length === head.length) {
      indent = head;
    }
    return [
      new Line(this, lines.lines[0]),
      ...lines.lines.slice(1).map((l) => new Line(indent, l)),
    ];
  }

  /**
   * @returns {string}
   */
  toString() {
    return this.head.toString() + this.tail.toString();
  }
}
class Lines {
  /**
   * @param {Line[]} lines
   */
  constructor(lines) {
    /** @type {Line[]} */
    this.lines = lines;
  }

  /**
   * @param {*} lines
   * @returns {Lines}
   */
  static cast(lines) {
    if (lines instanceof Lines) {
      return lines;
    } else if (typeof lines !== 'string') {
      return new Lines(
        String(lines)
          .split('\n')
          .map((line) => new Line(line))
      );
    }
    return new Lines(lines.split('\n').map((line) => new Line(line)));
  }

  static reindent(templateArray, ...args) {
    return reindent(templateArray, ...args);
  }

  concat(linesRaw) {
    const lines = Lines.cast(linesRaw);
    if (this.lines.length === 0) {
      return lines;
    }
    return new Lines([
      ...sliceButLast(this.lines),
      ...last(this.lines).concat(lines),
    ]);
  }

  indent(linesRaw) {
    const lines = Lines.cast(linesRaw);
    if (this.lines.length === 0) {
      return lines;
    }
    return new Lines([
      ...sliceButLast(this.lines),
      ...last(this.lines).indent(lines),
    ]);
  }

  toString() {
    return this.lines.map((line) => line.toString().trimRight()).join('\n');
  }
}

/**
 * @param {T[]} ary
 * @returns {T[]}
 * @template T
 */
function sliceButLast(ary) {
  return ary.slice(0, ary.length - 1);
}

/**
 * @param {T[]} ary
 * @returns {T}
 * @template T
 */
function last(ary) {
  return ary[ary.length - 1];
}

exports.reindent = reindent;
exports.Line = Line;
exports.Lines = Lines;
