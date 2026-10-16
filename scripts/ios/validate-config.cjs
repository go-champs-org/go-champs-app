const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const environments = require('../../config/ios-environments.json');
const app = require('../../app.json').expo;
const pkg = require('../../package.json');

assert.match(app.version, /^\d+\.\d+\.\d+$/);
assert.equal(app.version, pkg.version, 'package and Expo versions must match');
for (const [environment, variant] of Object.entries(environments)) {
  const config = JSON.parse(execFileSync(process.execPath, [
    'node_modules/expo/bin/cli', 'config', '--type', 'public', '--json',
  ], { env: { ...process.env, IOS_APP_ENV: environment, IOS_DISTRIBUTION: 'true' }, encoding: 'utf8' }));
  assert.equal(config.name, variant.name);
  assert.equal(config.ios.bundleIdentifier, variant.bundleIdentifier);
  assert.equal(config.scheme, variant.scheme);
  assert.equal(config.extra.iosDistributionEnvironment, environment);
  assert.equal(config.newArchEnabled, app.newArchEnabled);
  assert.deepEqual(config.android, app.android);
}
if (process.env.GITHUB_REF_TYPE === 'tag') {
  assert.equal(process.env.GITHUB_REF_NAME, `ios-v${app.version}`, 'Release tag must match Expo version');
}
console.log('Both iOS identities validated. Backend routing remains unchanged and is NOT isolated.');
