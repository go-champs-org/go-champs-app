const { test } = require('node:test');
const assert = require('node:assert/strict');
const configure = require('../../app.config');
const config = require('../../app.json').expo;

test('distribution fails closed without an explicit environment', () => {
  process.env.IOS_DISTRIBUTION = 'true';
  delete process.env.IOS_APP_ENV;
  assert.throws(() => configure({ config }), /required/);
  process.env.IOS_APP_ENV = 'prod';
  assert.throws(() => configure({ config }), /staging or production/);
  delete process.env.IOS_APP_ENV;
  delete process.env.IOS_DISTRIBUTION;
});

test('ordinary development retains its original configuration', () => {
  assert.deepEqual(configure({ config }), config);
});
