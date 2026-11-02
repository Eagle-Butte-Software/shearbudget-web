// Plaid Link OAuth return for https://shearbudget.com/plaid-oauth.
// Docs: https://plaid.com/docs/link/oauth/ — reinitialize with the same link
// token and receivedRedirectUri set to window.location.href, query included.
// The token is the Plaid sample key "link_token" in localStorage or
// sessionStorage. This page does not exchange tokens and does not log them.

const LINK_SCRIPT = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
const TOKEN_KEY = "link_token";
const SOURCE = "shearbudget-plaid-oauth";

const statusEl = document.getElementById("plaid-oauth-status");

function show(message) {
  if (statusEl) statusEl.textContent = message;
}

function storageGet(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode can block storage. The opener message still carries the result.
  }
}

function readLinkToken() {
  const token = storageGet(TOKEN_KEY);
  if (!token) return null;
  if (!token.startsWith("link-") || token.length > 2048 || /\s/.test(token)) return null;
  return token;
}

function publish(extra) {
  const payload = {
    source: SOURCE,
    receivedRedirectUri: window.location.href,
    ...extra,
  };
  storageSet("plaid_oauth_received_redirect_uri", window.location.href);
  if (extra.publicToken) storageSet("plaid_public_token", extra.publicToken);
  try {
    const channel = new BroadcastChannel(SOURCE);
    channel.postMessage(payload);
    channel.close();
  } catch {
    // BroadcastChannel is unavailable. localStorage and opener still apply.
  }
  const opener = window.opener;
  if (opener && !opener.closed) {
    opener.postMessage(payload, "*");
  }
}

function loadPlaid() {
  if (window.Plaid) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = LINK_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Plaid Link failed to load"));
    document.head.appendChild(script);
  });
}

function resumeLink(linkToken) {
  const handler = window.Plaid.create({
    token: linkToken,
    receivedRedirectUri: window.location.href,
    onSuccess(publicToken) {
      try {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
      } catch {
        // Ignore storage failures. The public token is still published below.
      }
      publish({ publicToken });
      show("Your bank connection is ready. You can close this window and return to Shear Budget.");
    },
    onExit(err) {
      if (err) {
        show("The bank connection did not finish. Return to Shear Budget and try again.");
        return;
      }
      show("You can close this window and return to Shear Budget.");
    },
  });
  handler.open();
}

function returnedWithoutToken() {
  publish({});
  show("You're back from your bank. Return to Shear Budget to finish connecting. If Shear Budget is still open, it should continue on its own.");
}

async function main() {
  let oauthStateId = "";
  try {
    oauthStateId = new URL(window.location.href).searchParams.get("oauth_state_id") || "";
  } catch {
    oauthStateId = "";
  }

  if (!oauthStateId) {
    show("This page finishes a bank connection started in Shear Budget. If you opened it directly, go back to the app and start from there.");
    return;
  }

  const linkToken = readLinkToken();
  if (!linkToken) {
    returnedWithoutToken();
    return;
  }

  try {
    await loadPlaid();
    resumeLink(linkToken);
  } catch {
    returnedWithoutToken();
  }
}

main();
