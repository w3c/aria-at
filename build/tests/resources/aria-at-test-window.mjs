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

  windowOnBeforeUnload() {
    window.setTimeout(() => {
      if (this.window.closed) {
        this.window = undefined;
      }

      /** Re-enable open popup button. If the window was reloaded it may be 100ms  */
      this.hooks.windowClosed();
    }, 100);
  }

  windowOnDOMContentLoaded() {
    if (this.window) {
      this.prepare();
    }
  }

  /**
   * @param {Window} testPageWindow
   */
  injectSetupResetButton(testPageWindow) {
    const {scripts, setupScriptName} = this;
    const setupScriptPresent = Boolean(setupScriptName && scripts[setupScriptName]);

    /** @type {'setup' | 'post-setup'} */
    let runSetupOrRelad = setupScriptPresent ? 'setup' : 'post-setup';

    const buttonDiv = testPageWindow.document.createElement('div');
    buttonDiv.innerHTML = `
      <div style="position: relative; left: 0; right: 0; height: 2rem;">
        <button autofocus style="height: 100%; width: 100%;"${setupScriptPresent ? '' : ' disabled'}>Run Test Setup</button>
      </div>
    `;
    const buttonButton = buttonDiv.querySelector('button');

    buttonButton.onclick = function() {
      try {
        if (runSetupOrRelad === 'setup') {
          runSetupOrRelad = 'post-setup';
          buttonButton.disabled = true;

          if (setupScriptName) {
            scripts[setupScriptName](testPageWindow.document);
          }
        }
      } catch (error) {
        window.console.error(error);
        throw error;
      }
    };

    const bodyElement = testPageWindow.document.body;
    const mainElement = bodyElement.getElementsByTagName('main')[0] || bodyElement;

    mainElement.appendChild(buttonDiv.children[0]);
  }

  open() {
    if (this.window) {
      this.window.close();
    }

    this.window = window.open(this.pageUri, "_blank", "toolbar=0,location=0,menubar=0,width=400,height=400");

    this.hooks.windowOpened();

    // Prepare the window once we can modify it.
    this.window.addEventListener('DOMContentLoaded', this.windowOnDOMContentLoaded.bind(this));
  }

  async prepare() {
    if (!this.window) {
      return;
    }

    // Re-enable open button when unloaded by closing the window or reloading it.
    this.window.onbeforeunload = this.windowOnBeforeUnload.bind(this);

    // Make sure the origin is the same, and prevent this from firing on an 'about' page.
    while (
      this.window.location.origin !== window.location.origin ||
      this.window.document.readyState !== "complete" && this.window.document.readyState !== "interactive"
    ) {
      await new Promise(resolve => window.setTimeout(resolve, 100));
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
