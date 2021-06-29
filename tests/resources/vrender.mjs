const mounts = new WeakMap();

/**
 * @param {HTMLElement} mount
 * @param {NodeNode} newValue
 */
export function render(mount, newValue) {
  let lastValue = mounts.get(mount);
  if (!lastValue) {
    lastValue = ElementType.init(newQueue(), null, null, element(mount.tagName));
    lastValue.ref = mount;
    mounts.set(mount, lastValue);
  }
  const queue = newQueue();
  lastValue.type.diff(queue, lastValue, element(mount.tagName, newValue));
  runQueue(queue);
  if (!newValue) {
    mounts.delete(mount);
  }
}

/**
 * @param {string} shape
 * @param  {...NodeNode} content
 * @returns {ElementNode}
 */
export function element(shape, ...content) {
  return {
    type: ELEMENT_TYPE_NAME,
    shape,
    content: content.map(asNode),
  };
}

/**
 * @param  {...NodeNode} content
 * @returns {FragmentNode}
 */
export function fragment(...content) {
  return {
    type: FRAGMENT_TYPE_NAME,
    shape: FRAGMENT_TYPE_NAME,
    content: content.map(asNode),
  };
}

/**
 * @param  {string} content
 * @returns {TextNode}
 */
export function text(content) {
  return {
    type: TEXT_TYPE_NAME,
    shape: TEXT_TYPE_NAME,
    content,
  };
}

/**
 * @param {function} shape
 * @param {...NodeNode} content
 * @returns {ComponentNode}
 */
export function component(shape, ...content) {
  return {
    type: COMPONENT_TYPE_NAME,
    shape,
    content,
  };
}

/**
 * @param {{[key: string]: string}} styleMap
 * @returns {MemberNode}
 */
export function style(styleMap) {
  return attribute(
    "style",
    Object.keys(styleMap)
      .map(key => `${key}: ${styleMap[key]};`)
      .join(" ")
  );
}

/**
 * @param {string[]} names
 * @returns {MemberNode}
 */
export function className(names) {
  return attribute("class", names.filter(Boolean).join(" "));
}

/**
 * @param {string} name
 * @param  {string | boolean} value
 * @returns {MemberNode}
 */
export function attribute(name, value) {
  return {
    type: ATTRIBUTE_TYPE_NAME,
    name,
    value,
  };
}

/**
 * @param {string} name
 * @param  {any} value
 * @returns {MemberNode}
 */
export function property(name, value) {
  return {
    type: PROPERTY_TYPE_NAME,
    name,
    value,
  };
}

/**
 * @param {string} name
 * @param  {any} value
 * @returns {MemberNode}
 */
export function meta(name, value) {
  return {
    type: META_TYPE_NAME,
    name,
    value,
  };
}

const refMap = new WeakMap();

/**
 * @param {{ref: HTMLElement | null}} value
 * @returns {MemberNode}
 */
export function ref(value) {
  let refHook = refMap.get(value);
  if (!refHook) {
    refHook = (/** @type {HTMLElement} */ element) => {
      value.ref = element;
    };
    refMap.set(value, refHook);
  }
  return {
    type: REF_TYPE_NAME,
    name: "ref",
    value: refHook,
  };
}

const noop = function () {};

/**
 * @param {boolean} shouldFocus
 */
export function focus(shouldFocus) {
  return {
    type: REF_TYPE_NAME,
    name: "focus",
    value: shouldFocus ? element => element.focus() : noop,
  };
}

function asNode(item) {
  if (typeof item === "string") {
    return text(item);
  } else if (Array.isArray(item)) {
    return fragment(...item);
  } else if (item === null || item === undefined) {
    return fragment();
  }
  return item;
}

const ELEMENT_TYPE_NAME = "element";
const FRAGMENT_TYPE_NAME = "fragment";
const COMPONENT_TYPE_NAME = "component";
const TEXT_TYPE_NAME = "text";
const ATTRIBUTE_TYPE_NAME = "attribute";
const PROPERTY_TYPE_NAME = "property";
const REF_TYPE_NAME = "ref";
const META_TYPE_NAME = "meta";

/** @type ElementStateType */
const ElementType = {
  name: ELEMENT_TYPE_NAME,
  diffEntry: /** @type {DiffEntryFunction} */ (diffChildEntry),
  init: /** @type {InitNodeFunction} */ (
    function (queue, parent, after, /** @type {ElementNode} */ node) {
      const state = {
        type: ElementType,
        parent,
        after,
        shape: node.shape,
        content: null,
        ref: null,
        refHooks: null,
        rewriteChildIndex: 0,
        children: null,
        rewriteMemberIndex: 0,
        members: null,
      };
      enqueueChange(queue, addElement, state);
      return state;
    }
  ),
  diff: /** @type {DiffFunction} */ (
    function (queue, /** @type {ElementState} */ lastValue, /** @type {ElementNode} */ newValue) {
      lastValue.rewriteMemberIndex = 0;
      diffFragment(queue, lastValue, newValue);
      if (lastValue.members !== null) {
        const group = lastValue.members;
        let index;
        for (index = lastValue.rewriteMemberIndex; index < group.length; index++) {
          const node = group[index];
          node.type.teardown(queue, node);
        }
        if (lastValue.rewriteMemberIndex === 0) {
          lastValue.members = null;
        } else {
          group.length = lastValue.rewriteMemberIndex;
        }
      }
    }
  ),
  teardown: /** @type {TeardownFunction} */ (
    function (queue, /** @type {ElementState} */ state) {
      enqueueChange(queue, removeElement, state);
      const {children} = state;
      if (children !== null) {
        for (let i = 0; i < children.length; i++) {
          children[i].type.softTeardown(children[i]);
        }
      }
    }
  ),
  softTeardown: /** @type {SoftTeardownFunction} */ (softTeardownElement),
};

/** @type {FragmentStateType} */
const FragmentType = {
  name: FRAGMENT_TYPE_NAME,
  diffEntry: /** @type {DiffEntryFunction} */ (diffChildEntry),
  init(queue, parent, after, node) {
    return {
      type: FragmentType,
      parent,
      after,
      shape: FRAGMENT_TYPE_NAME,
      content: null,
      rewriteChildIndex: 0,
      children: null,
    };
  },
  diff: /** @type {DiffFunction} */ (diffFragment),
  teardown: /** @type {TeardownFunction} */ (
    function (queue, /** @type {FragmentState} */ state) {
      const {children} = state;
      if (children !== null) {
        for (let i = 0; i < children.length; i++) {
          children[i].type.teardown(queue, children[i]);
        }
      }
    }
  ),
  softTeardown: /** @type {SoftTeardownFunction} */ (softTeardownElement),
};

/** @type ComponentStateType */
const ComponentType = {
  name: COMPONENT_TYPE_NAME,
  diffEntry: /** @type {DiffEntryFunction} */ (diffChildEntry),
  init: /** @type {InitNodeFunction} */ (
    function (queue, parent, after, /** @type {ComponentNode} */ node) {
      return {
        type: ComponentType,
        parent,
        after,
        shape: node.shape,
        content: null,
        rendered: null,
      };
    }
  ),
  diff: /** @type {DiffFunction} */ (
    function (queue, /** @type {ComponentState} */ lastChild, /** @type {ComponentNode} */ node) {
      /** @type {MemberNode} */
      const componentOptionsMeta = node.content.find(isOptions) || null;
      const componentOptions = componentOptionsMeta ? componentOptionsMeta.value : null;
      if (shallowEquals(lastChild.content, componentOptions) === false) {
        lastChild.content = componentOptions;
        queue.prepare.push(lastChild);
      }
    }
  ),
  teardown: /** @type {TeardownFunction} */ (
    function (queue, /** @type {ComponentState} */ state) {
      if (state.rendered !== null) {
        state.rendered.type.teardown(queue, state.rendered);
      }
    }
  ),
  softTeardown: /** @type {SoftTeardownFunction} */ (
    function (/** @type {ComponentState} */ state) {
      if (state.rendered !== null) {
        state.rendered.type.softTeardown(state.rendered);
      }
    }
  ),
};

/** @type TextStateType */
const TextType = {
  name: TEXT_TYPE_NAME,
  diffEntry: /** @type {DiffEntryFunction} */ (diffChildEntry),
  init: /** @type {InitNodeFunction} */ (
    function (queue, parent, after, /** @type {TextNode} */ node) {
      /** @type {TextState} */
      const state = {
        type: TextType,
        parent,
        after,
        shape: TEXT_TYPE_NAME,
        content: node.content,
        ref: null,
      };
      enqueueChange(queue, addText, state);
      return state;
    }
  ),
  diff: /** @type {DiffFunction} */ (
    function (queue, /** @type {TextState} */ lastChild, /** @type {TextNode} */ node) {
      if (lastChild.content !== node.content) {
        lastChild.content = node.content;
        enqueueChange(queue, changeText, lastChild);
      }
    }
  ),
  teardown: /** @type {TeardownFunction} */ (
    function (queue, /** @type {TextState} */ state) {
      enqueueChange(queue, removeText, state);
    }
  ),
  softTeardown() {},
};

/** @type {MemberStateType} */
const AttributeType = {
  name: ATTRIBUTE_TYPE_NAME,
  diffEntry: /** @type {DiffEntryFunction} */ (diffMemberEntry),
  init(parent, name) {
    return {
      type: AttributeType,
      parent,
      name,
      value: null,
    };
  },
  diff: /** @type {DiffFunction} */ (
    function (queue, /** @type {MemberState} */ old, /** @type {MemberNode} */ memberNode) {
      if (old.value !== memberNode.value) {
        old.value = memberNode.value;
        if (old.value === false) {
          enqueueChange(queue, removeAttribute, old);
        } else {
          enqueueChange(queue, changeAttribute, old);
        }
      }
    }
  ),
  teardown(queue, state) {
    enqueueChange(queue, removeAttribute, state);
  },
};

/** @type {MemberStateType} */
const PropertyType = {
  name: PROPERTY_TYPE_NAME,
  diffEntry: /** @type {DiffEntryFunction} */ (diffMemberEntry),
  init(parent, name) {
    return {
      type: PropertyType,
      parent,
      name,
      value: null,
    };
  },
  diff: /** @type {DiffFunction} */ (
    function (queue, /** @type {MemberState} */ old, /** @type {MemberNode} */ memberNode) {
      if (old.value !== memberNode.value) {
        old.value = memberNode.value;
        enqueueChange(queue, changeProperty, old);
      }
    }
  ),
  teardown(queue, state) {
    state.value = undefined;
    enqueueChange(queue, changeProperty, state);
  },
};

/** @type {MemberStateType} */
const RefType = {
  name: REF_TYPE_NAME,
  diffEntry: /** @type {DiffEntryFunction} */ (diffMemberEntry),
  init(parent, name) {
    return {
      type: RefType,
      parent,
      name,
      value: null,
    };
  },
  diff: /** @type {DiffFunction} */ (
    function (queue, /** @type {MemberState} */ state, /** @type {MemberNode} */ node) {
      if (state.value !== node.value) {
        state.value = node.value;
        if (state.parent.refHooks === null) {
          state.parent.refHooks = [];
        }
        if (state.parent.refHooks.indexOf(state) === -1) {
          state.parent.refHooks.push(state);
        }
        enqueuePost(queue, updateRef, state);
      }
    }
  ),
  teardown(queue, state) {
    const index = state.parent.refHooks.indexOf(state);
    state.parent.refHooks.splice(index, 1);
    if (state.parent.refHooks.length === 0) {
      state.parent.refHooks = null;
    }
    enqueuePost(queue, unsetRef, state);
  },
};

const typeMap = {
  [ELEMENT_TYPE_NAME]: ElementType,
  [FRAGMENT_TYPE_NAME]: FragmentType,
  [COMPONENT_TYPE_NAME]: ComponentType,
  [TEXT_TYPE_NAME]: TextType,
  [ATTRIBUTE_TYPE_NAME]: AttributeType,
  [PROPERTY_TYPE_NAME]: PropertyType,
  [REF_TYPE_NAME]: RefType,
};

/** @type DiffEntryFunction */
function diffChildEntry(queue, parent, /** @type NodeStateType */ metaType, /** @type NodeNode */ element) {
  if (!parent.children) {
    parent.children = [];
  }
  const index = parent.rewriteChildIndex++;
  let state = parent.children[index];
  if (!state || state.shape !== element.shape) {
    if (state) {
      state.type.teardown(queue, state);
    }
    state = /** @type {NodeState} */ (metaType.init(queue, parent, parent.children[index - 1] || null, element));
    parent.children[index] = state;

    const sibling = parent.children[index + 1];
    if (sibling) {
      sibling.after = state;
    }
  }
  state.type.diff(queue, state, element);
}

/** @type {DiffFunction} */
function diffFragment(
  queue,
  /** @type {ElementState | FragmentState} */ lastValue,
  /** @type {ElementNode | FragmentNode} */ newValue
) {
  lastValue.rewriteChildIndex = 0;
  const {content} = newValue;
  for (let i = 0; i < content.length; i++) {
    const node = content[i];
    const metaType = typeMap[node.type];
    metaType.diffEntry(queue, lastValue, metaType, node);
  }
  const children = lastValue.children;
  if (children !== null) {
    const childIndex = lastValue.rewriteChildIndex;
    for (let i = childIndex; i < children.length; i++) {
      const node = children[i];
      node.type.teardown(queue, node);
    }
    if (childIndex === 0) {
      lastValue.children = null;
    } else {
      children.length = childIndex;
    }
  }
}

/** @type {DiffEntryFunction} */
function diffMemberEntry(
  queue,
  /** @type {ElementState} */ element,
  /** @type {MemberStateType} */ nodeType,
  /** @type {MemberNode} */ node
) {
  if (element.members === null) {
    element.members = [];
  }
  const group = element.members;

  const writeIndex = element.rewriteMemberIndex++;
  let index;
  for (index = writeIndex; index < group.length; index++) {
    const item = group[index];
    if (item.type.name === node.type && item.name === node.name) {
      break;
    }
  }

  let old = group[index];
  if (index !== writeIndex) {
    group[index] = group[writeIndex];
  }
  if (!old) {
    old = nodeType.init(element, node.name);
    group[writeIndex] = old;
  }
  old.type.diff(queue, old, node);
}

/** @type {SoftTeardownFunction} */
function softTeardownElement(/** @type {ElementState} */ state) {
  const {children} = state;
  if (children !== null) {
    for (let i = 0; i < children.length; i++) {
      children[i].type.softTeardown(children[i]);
    }
  }
}

/**
 * @param {Data} node
 * @returns {node is MemberNode}
 */
function isOptions(node) {
  return node.type === META_TYPE_NAME && node.name === "options";
}

/**
 * @param {Queue} queue
 */
function runQueue(queue) {
  const {prepare, changes: apply, post} = queue;
  for (let i = 0; i < prepare.length; i++) {
    changeViewRender(prepare[i], queue);
  }
  for (let i = 0; i < apply.length; i += 2) {
    apply[i](apply[i + 1]);
  }
  for (let i = 0; i < post.length; i += 2) {
    post[i](post[i + 1]);
  }
}

/**
 * @param {ComponentState} componentState
 * @param {Queue} queue
 */
function changeViewRender(componentState, queue) {
  const newRender = componentState.shape(componentState.content) || null;
  if (newRender) {
    const metaType = typeMap[newRender.type];
    let lastRender = componentState.rendered;
    if (!lastRender || lastRender.shape !== newRender.shape) {
      if (lastRender) {
        lastRender.type.teardown(queue, lastRender);
      }
      lastRender = metaType.init(queue, componentState, null, newRender);
      componentState.rendered = lastRender;
    }
    lastRender.type.diff(queue, lastRender, newRender);
  } else if (componentState.rendered) {
    componentState.rendered.type.teardown(queue, componentState.rendered);
    componentState.rendered = null;
  }
}

/**
 * @param {MemberState} state
 */
function changeProperty(state) {
  state.parent.ref[state.name] = state.value;
}

/**
 * @param {MemberState} state
 */
function removeAttribute(state) {
  state.parent.ref.removeAttribute(state.name);
}

/**
 * @param {MemberState} state
 */
function changeAttribute(state) {
  state.parent.ref.setAttribute(state.name, state.value);
}

/**
 * @param {TextState} state
 */
function removeText(state) {
  state.ref.parentNode.removeChild(state.ref);
}

/**
 * @param {TextState} state
 */
function changeText(state) {
  state.ref.textContent = state.content;
}

/**
 * @param {TextState} state
 */
function addText(state) {
  state.ref = document.createTextNode(state.content);
  state.ref.textContent = state.content;
  insertAfterSibling(state);
}

/**
 * @param {NodeState} after
 * @returns {NodeState}
 */
function deepestDescendant(after) {
  if (after === null) {
    return after;
  } else if (after.type === FragmentType) {
    const {children} = /** @type {FragmentState} */ (after);
    if (children !== null) {
      return deepestDescendant(children[children.length - 1]);
    }
  } else if (after.type === ComponentType) {
    const {rendered} = /** @type {ComponentState} */ (after);
    if (rendered !== null) {
      return deepestDescendant(rendered);
    }
  }
  return after;
}

/**
 * @param {ElementState | TextState} element
 */
function insertAfterSibling(element) {
  /** @type {NodeState} */
  let state = element;
  let after = deepestDescendant(state.after);
  do {
    if (after === null) {
      if (state.parent.type === ElementType) {
        break;
      }
      state = state.parent;
      after = state;
    }
    if (after.type !== ElementType && after.type !== TextType) {
      after = deepestDescendant(after.after);
    }
  } while (after === null || (after.type !== ElementType && after.type !== TextType));

  if (after !== null) {
    const {ref} = /** @type {ElementState | TextState} */ (after);
    ref.parentNode.insertBefore(element.ref, ref.nextSibling);
  } else {
    const {ref} = /** @type {ElementState} */ (state.parent);
    if (ref.childNodes.length) {
      ref.insertBefore(element.ref, ref.childNodes[0]);
    } else {
      ref.appendChild(element.ref);
    }
  }
}

/**
 * @param {ElementState} state
 */
function removeElement(state) {
  state.ref.parentNode.removeChild(state.ref);
  state.ref = null;
}

/**
 * @param {ElementState} state
 */
function addElement(state) {
  state.ref = document.createElement(state.shape);
  insertAfterSibling(state);
}

/**
 * @param {MemberState} state
 */
function updateRef(state) {
  state.value(state.parent.ref);
}

/**
 * @param {MemberState} state
 */
function unsetRef(state) {
  state.value(null);
}

function shallowEquals(a, b) {
  if (a === null || b === null) {
    return a === b;
  }
  for (const key of Object.keys(a)) {
    if (key in b) {
      if (a[key] !== b[key]) {
        return false;
      }
    } else {
      return false;
    }
  }
  for (const key of Object.keys(b)) {
    if (!(key in a)) {
      return false;
    }
  }
  return true;
}

/**
 * @callback StateAction
 * @param {S} state
 * @template {State} S
 */

/**
 * @returns {Queue}
 */
function newQueue() {
  return {prepare: [], changes: [], post: []};
}

/**
 * @param {Queue} queue
 * @param {StateAction<S>} fn
 * @param {S} state
 * @template {State} S
 */
function enqueueChange(queue, fn, state) {
  queue.changes.push(fn, state);
}

/**
 * @param {Queue} queue
 * @param {StateAction<S>} fn
 * @param {S} state
 * @template {State} S
 */
function enqueuePost(queue, fn, state) {
  queue.post.push(fn, state);
}

/**
 * @typedef Queue
 * @property {Array} prepare
 * @property {Array} changes
 * @property {Array} post
 */

/**
 * @callback DiffEntryFunction
 * @param {Queue} queue
 * @param {ElementState | FragmentState} parent
 * @param {StateType} nodeType
 * @param {Data} node
 * @returns {void}
 */

/**
 * @callback InitNodeFunction
 * @param {Queue} queue
 * @param {NodeState} parent
 * @param {NodeState | null} after
 * @param {NodeNode} node
 * @returns {NodeState}
 */

/**
 * @callback DiffFunction
 * @param {Queue} queue
 * @param {State} state
 * @param {Data} node
 * @returns {void}
 */

/**
 * @callback TeardownFunction
 * @param {Queue} queue
 * @param {NodeState} state
 * @returns {void}
 */

/**
 * @callback SoftTeardownFunction
 * @param {NodeState} state
 * @returns {void}
 */

/**
 * @typedef NodeStateTypeGeneric
 * @property {Name} name
 * @property {DiffEntryFunction} diffEntry
 * @property {DiffFunction} diff
 * @property {InitNodeFunction} init
 * @property {TeardownFunction} teardown
 * @property {SoftTeardownFunction} softTeardown
 * @template {string | symbol} Name
 */

/**
 * @typedef NodeStateTypeCreate
 * @property {Name} name
 * @property {(queue: Queue, parent: ElementState | FragmentState, meta: StateType, node: Node) => void} diffEntry
 * @property {(queue: Queue, state: S, node: Node) => void} diff
 * @property {(queue: Queue, parent: ElementState | FragmentState, after: NodeState, node: Node) => void} init
 * @property {(queue: Queue, state: S) => void} teardown
 * @property {(state: S) => void} softTeardown
 * @template {string | symbol} Name
 * @template {State} S
 * @template {Data} Node
 */

/** @typedef {NodeStateTypeGeneric<typeof ELEMENT_TYPE_NAME>} ElementStateType */
/** @typedef {NodeStateTypeGeneric<typeof FRAGMENT_TYPE_NAME>} FragmentStateType */
/** @typedef {NodeStateTypeGeneric<typeof COMPONENT_TYPE_NAME>} ComponentStateType */
/** @typedef {NodeStateTypeGeneric<typeof TEXT_TYPE_NAME>} TextStateType */

/** @typedef {ElementStateType | FragmentStateType| ComponentStateType | TextStateType} NodeStateType */

/**
 * @callback InitMemberFunction
 * @param {ElementState} parent
 * @param {string} name
 * @returns {MemberState}
 */

/**
 * @callback TeardownMemberFunction
 * @param {Queue} queue
 * @param {MemberState} member
 * @returns {void}
 */

/**
 * @typedef MemberStateType
 * @property {string | symbol} name
 * @property {DiffEntryFunction} diffEntry
 * @property {DiffFunction} diff
 * @property {InitMemberFunction} init
 * @property {TeardownMemberFunction} teardown
 */

/**
 * @typedef {NodeStateType | MemberStateType} StateType
 */

/**
 * @typedef ElementState
 * @property {ElementStateType} type
 * @property {NodeState} parent
 * @property {NodeState | null} after
 * @property {string} shape
 * @property {null} content
 * @property {HTMLElement | null} ref
 * @property {MemberState[] | null} refHooks
 * @property {number} rewriteChildIndex
 * @property {NodeState[] | null} children
 * @property {number} rewriteMemberIndex
 * @property {MemberState[] | null} members
 */

/**
 * @typedef FragmentState
 * @property {FragmentStateType} type
 * @property {NodeState} parent
 * @property {NodeState | null} after
 * @property {typeof FRAGMENT_TYPE_NAME} shape
 * @property {null} content
 * @property {number} rewriteChildIndex
 * @property {NodeState[] | null} children
 */

/** @typedef {ElementState | FragmentState} ParentState */

/**
 * @typedef ComponentState
 * @property {ComponentStateType} type
 * @property {NodeState} parent
 * @property {NodeState | null} after
 * @property {function} shape
 * @property {object} content
 * @property {NodeState | null} rendered
 */

/**
 * @typedef TextState
 * @property {TextStateType} type
 * @property {NodeState} parent
 * @property {NodeState | null} after
 * @property {typeof TEXT_TYPE_NAME} shape
 * @property {string} content
 * @property {Text | null} ref
 */

/**
 * @typedef {ElementState | FragmentState | ComponentState | TextState} NodeState
 */

/**
 * @typedef MemberState
 * @property {MemberStateType} type
 * @property {ElementState} parent
 * @property {string} name
 * @property {*} value
 */

/** @typedef {NodeState | MemberState} State */

/** @typedef {typeof ELEMENT_TYPE_NAME | typeof FRAGMENT_TYPE_NAME | typeof COMPONENT_TYPE_NAME | typeof TEXT_TYPE_NAME} NodeNodeType */

/** @typedef {typeof ATTRIBUTE_TYPE_NAME | typeof PROPERTY_TYPE_NAME | typeof REF_TYPE_NAME | typeof META_TYPE_NAME} MemberNodeType */

/**
 * @typedef ElementNode
 * @property {typeof ELEMENT_TYPE_NAME} type
 * @property {string} shape
 * @property {Data[]} content
 */

/**
 * @typedef FragmentNode
 * @property {typeof FRAGMENT_TYPE_NAME} type
 * @property {typeof FRAGMENT_TYPE_NAME} shape
 * @property {Data[]} content
 */

/**
 * @typedef TextNode
 * @property {typeof TEXT_TYPE_NAME} type
 * @property {typeof TEXT_TYPE_NAME} shape
 * @property {string} content
 */

/**
 * @typedef ComponentNode
 * @property {typeof COMPONENT_TYPE_NAME} type
 * @property {function} shape
 * @property {Data[]} content
 */

/**
 * @typedef {ElementNode | FragmentNode | TextNode | ComponentNode} NodeNode
 */

/**
 * @typedef MemberNode
 * @property {MemberNodeType} type
 * @property {string} name
 * @property {*} value
 */

/** @typedef {NodeNode | MemberNode} Data */
