module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Remove fork-ts-checker que causa conflito com Node 24
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );
      return webpackConfig;
    },
  },
};
