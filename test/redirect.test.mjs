import assert from "node:assert/strict";
import test from "node:test";
import { isPlaidOAuthDocument, redirectLocation } from "../src/index.js";

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

test("Plaid document paths include slash and index forms, not other files", () => {
  assert.equal(isPlaidOAuthDocument("/plaid-oauth"), true);
  assert.equal(isPlaidOAuthDocument("/plaid-oauth/"), true);
  assert.equal(isPlaidOAuthDocument("/plaid-oauth/index.html"), true);
  assert.equal(isPlaidOAuthDocument("/plaid-oauth/index.html/"), true);
  assert.equal(isPlaidOAuthDocument("/terms"), false);
  assert.equal(isPlaidOAuthDocument("/assets/plaid-oauth.js"), false);
});
