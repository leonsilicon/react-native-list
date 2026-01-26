/** @type {import('react-native-worklets/plugin').PluginOptions} */
const workletsPluginOptions = {
  globals: ['React'],
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['react-native-worklets/plugin', workletsPluginOptions],
    ]
  };
};
