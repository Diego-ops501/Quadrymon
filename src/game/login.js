(function (root) {
  "use strict";
  async function loginInPage(credentials, submit) {
    const loginPage = () => location.origin === "https://poke.idleworld.online" && /^\/login\/?$/.test(location.pathname);
    if (!loginPage()) return "wrong-page";
    if (!credentials.login || !credentials.password) return "missing";
    const pause = () => new Promise(resolve => setTimeout(resolve, 100));
    let username, password, form;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (!loginPage()) return "wrong-page";
      password = document.querySelector('input[type="password"]');
      form = password?.closest("form");
      username = form?.querySelector('input[autocomplete="username"], input[name="username"], input[name="email"], input[name="login"], input[type="email"], input[placeholder="Email or username"]');
      if (username && password && form) break;
      await pause();
    }
    if (!username || !password || !form) return "not-ready";
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    for (const [input, value] of [[username, credentials.login], [password, credentials.password]]) {
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (!submit) return "filled";
    // Allow the native page's state handlers to enable its login button.
    for (let attempt = 0; attempt < 50; attempt++) {
      if (!loginPage() || !form.isConnected) return "wrong-page";
      const captcha = form.querySelector('[name="cf-turnstile-response"], [name="g-recaptcha-response"], [name="h-captcha-response"]');
      if (captcha && !captcha.value) return "challenge";
      const button = form.querySelector('button[aria-label="Log in"], button[type="submit"], button:not([type])');
      if (button && !button.disabled) {
        button.click();
        return "submitted";
      }
      await pause();
    }
    return "not-ready";
  }
  const api = {
    source(login, password, submit = false) {
      return "(" + loginInPage.toString() + ")(" + JSON.stringify({ login, password }) + "," + Boolean(submit) + ")";
    },
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.QuadrymonLogin = api;
})(typeof globalThis === "object" ? globalThis : this);
