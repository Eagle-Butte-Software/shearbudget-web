import assert from "node:assert/strict";
import test from "node:test";
import { helpRedirectLocation, isPlaidOAuthDocument, redirectLocation } from "../src/index.js";

test("www redirect keeps the Plaid OAuth query string", () => {
  const url = new URL("https://www.shearbudget.com/plaid-oauth?oauth_state_id=abc-123");
  assert.equal(
    redirectLocation(url),
    "https://shearbudget.com/plaid-oauth?oauth_state_id=abc-123",
  );
});

test("shearbudget.app redirect keeps path and query", () => {
  const url = new URL("https://www.shearbudget.app/plaid-oauth/?oauth_state_id=abc-123&x=1");
  assert.equal(
    redirectLocation(url),
    "https://shearbudget.com/plaid-oauth/?oauth_state_id=abc-123&x=1",
  );
});

test("apex host is not redirected", () => {
  const url = new URL("https://shearbudget.com/plaid-oauth?oauth_state_id=abc-123");
  assert.equal(redirectLocation(url), null);
});

test("help and help.html redirect to guide preserving query", () => {
  assert.equal(
    helpRedirectLocation(new URL("https://shearbudget.com/help")),
    "https://shearbudget.com/guide",
  );
  assert.equal(
    helpRedirectLocation(new URL("https://shearbudget.com/help/")),
    "https://shearbudget.com/guide",
  );
  assert.equal(
    helpRedirectLocation(new URL("https://shearbudget.com/help.html?from=app")),
    "https://shearbudget.com/guide?from=app",
  );
  assert.equal(
    helpRedirectLocation(new URL("https://shearbudget.com/guide")),
    null,
  );
});

test("Plaid document paths include slash and index forms, not other files", () => {
  assert.equal(isPlaidOAuthDocument("/plaid-oauth"), true);
  assert.equal(isPlaidOAuthDocument("/plaid-oauth/"), true);
  assert.equal(isPlaidOAuthDocument("/plaid-oauth/index.html"), true);
  assert.equal(isPlaidOAuthDocument("/plaid-oauth/index.html/"), true);
  assert.equal(isPlaidOAuthDocument("/terms"), false);
  assert.equal(isPlaidOAuthDocument("/assets/plaid-oauth.js"), false);
});
