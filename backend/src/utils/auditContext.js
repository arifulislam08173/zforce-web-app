const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

function runWithContext(context, fn) {
  return storage.run(context, fn);
}

function enterWithContext(context) {
  storage.enterWith(context);
}

function getAuditContext() {
  return storage.getStore() || null;
}

module.exports = {
  runWithContext,
  enterWithContext,
  getAuditContext,
};
