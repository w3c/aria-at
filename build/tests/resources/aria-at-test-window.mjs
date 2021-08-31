export class TestWindow {
  /**
   * @param {object} options
   * @param {Window | null} [options.window]
   * @param {string} options.pageUri
   * @param {string} [options.setupScriptName]
   * @param {TestWindowHooks} [options.hooks]
   * @param {SetupScripts} [options.scripts]
   */
  constructor({window = null, pageUri, setupScriptName, hooks, scripts = {}}) {
    /** @type {Window | null} */
    this.window = window;

    /** @type {string} */
    this.pageUri = pageUri;

    /** @type {string} */
    this.setupScriptName = setupScriptName;

    /** @type {TestWindowHooks} */
    this.hooks = {
      windowOpened: () => {},
      windowClosed: () => {},
      ...hooks,
    };

    /** @type {SetupScripts} */
    this.scripts = scripts;
  }

  open() {
    this.window = window.open(this.pageUri, "_blank", "toolbar=0,location=0,menubar=0,width=400,height=400");

    this.hooks.windowOpened();

    // If the window is closed, re-enable open popup button
    this.window.onunload = () => {
      window.setTimeout(() => {
        if (this.window.closed) {
          this.window = undefined;

          this.hooks.windowClosed();
        }
      }, 100);
    };

    this.prepare();
  }

  prepare() {
    if (!this.window) {
      return;
    }

    let setupScriptName = this.setupScriptName;
    if (!setupScriptName) {
      return;
    }
    if (
      this.window.location.origin !== window.location.origin || // make sure the origin is the same, and prevent this from firing on an 'about' page
      this.window.document.readyState !== "complete"
    ) {
      window.setTimeout(() => {
        this.prepare();
      }, 100);
      return;
    }

    this.scripts[setupScriptName](this.window.document);
  }

  close() {
    if (this.window) {
      this.window.close();
    }
  }
}

/**
 * @typedef TestWindowHooks
 * @property {() => void} windowOpened
 * @property {() => void} windowClosed
 */

/** @typedef {import('./aria-at-test-formatter').SetupScripts} SetupScripts */
