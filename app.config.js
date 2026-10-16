const environments = require('./config/ios-environments.json');

module.exports = ({ config }) => {
  const environment = process.env.IOS_APP_ENV;
  // Preserve existing Expo Go, web and Android development configuration.
  if (!environment) {
    if (process.env.IOS_DISTRIBUTION === 'true') {
      throw new Error('IOS_APP_ENV is required for iOS distribution');
    }
    return config;
  }
  if (!Object.hasOwn(environments, environment)) {
    throw new Error('IOS_APP_ENV must be staging or production');
  }
  const variant = environments[environment];
  return {
    ...config,
    name: variant.name,
    scheme: variant.scheme,
    ios: {
      ...config.ios,
      bundleIdentifier: variant.bundleIdentifier,
      buildNumber: '1', // Replaced with an ASC-allocated number before archiving.
    },
    extra: {
      ...config.extra,
      iosDistributionEnvironment: environment,
      // Build identity only: backend isolation was explicitly deferred.
    },
  };
};
