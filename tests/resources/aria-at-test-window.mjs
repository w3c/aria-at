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

  /** If the window is closed, re-enable open popup button. */
  windowOnBeforeUnload() {
    window.setTimeout(() => {
      if (this.window.closed) {
        this.window = undefined;

        this.hooks.windowClosed();
      } else {
        // If the window is open (after a location.reload()) rerun the setupTestPage script.
        this.prepare();
      }
    }, 100);
  }

  injectSetupResetButton(testPageWindow) {
    const buttonDiv = testPageWindow.document.createElement('div');
    buttonDiv.innerHTML = `
      <div style="position: relative; left: 0; right: 0; height: 2rem;">
        <button style="height: 100%; width: 100%;">Run Test Setup</button>
      </div>
    `;
    const buttonButton = buttonDiv.querySelector('button');

    /** @type {'setup' | 'reload'} */
    let runSetupOrRelad = 'setup';

    const setupScriptName = this.setupScriptName;

    buttonButton.onclick = function() {
      try {
        if (runSetupOrRelad === 'setup') {
          runSetupOrRelad = 'reload';
          buttonButton.innerText = 'Reload Test';

          if (setupScriptName) {
            scripts[behavior.setupScriptName](testPageWindow.document);
          }
        } else {
          testPageWindow.location.reload();
          buttonButton.disabled = true;
        }
      } catch (error) {
        window.console.error(error);
        throw error;
      }
    };

    testPageWindow.document.body.insertBefore(buttonDiv.children[0], testPageWindow.document.body.children[0]);
  }

  open() {
    this.window = window.open(this.pageUri, "_blank", "toolbar=0,location=0,menubar=0,width=400,height=400");

    this.hooks.windowOpened();

    // If the window is closed, re-enable open popup button
    this.window.onbeforeunload = this.windowOnBeforeUnload.bind(this);
  }

  prepare() {
    if (!this.window) {
      return;
    }

    // make sure the origin is the same, and prevent this from firing on an 'about' page
    if (
      this.window.location.origin !== window.location.origin ||
      this.window.document.readyState !== "complete"
    ) {
      window.setTimeout(() => {
        this.prepare();
      }, 100);
      return;
    }

    this.injectSetupResetButton(this.window);
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
