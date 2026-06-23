// Standard Expo Babel config. Nothing custom needed for this project.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
