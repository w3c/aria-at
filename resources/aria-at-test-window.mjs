export class TestWindow {
  /**
   * @param {object} options
   * @param {Window | null} [options.window]
   * @param {string} options.pageUri
   * @param {TestWindowHooks} [options.hooks]
   */
  constructor({ window = null, pageUri, hooks }) {
    /** @type {Window | null} */
    this.window = window;

    /** @type {string} */
    this.pageUri = pageUri;

    /** @type {TestWindowHooks} */
    this.hooks = {
      windowOpened: () => {},
      windowClosed: () => {},
      ...hooks,
    };
  }

  open() {
    this.window = window.open(
      this.pageUri,
      '_blank',
      'toolbar=0,location=0,menubar=0,width=800,height=800'
    );

    this.hooks.windowOpened();

    this.prepare();
  }

  prepare() {
    if (!this.window) {
      return;
    }

    if (this.window.closed) {
      this.window = undefined;
      this.hooks.windowClosed();
      return;
    }

    if (
      this.window.location.origin !== window.location.origin || // make sure the origin is the same, and prevent this from firing on an 'about' page
      this.window.document.readyState !== 'complete'
    ) {
      window.setTimeout(() => {
        this.prepare();
      }, 100);
      return;
    }

    // If the window is closed, re-enable open popup button
    this.window.onunload = () => {
      window.setTimeout(() => this.prepare(), 100);
    };
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
