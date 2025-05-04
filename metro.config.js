// Learn more https://docs.expo.io/guides/customizing-metro
const {getDefaultConfig} = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    extraNodeModules: {
      ...config.resolver.extraNodeModules,
      // Add any additional modules that should be resolved
    },
    // Add resolution for deprecated prop types
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.startsWith('react-native/Libraries/Components/View/ViewPropTypes')) {
        return context.resolveRequest(
          context,
          'deprecated-react-native-prop-types/ViewPropTypes',
          platform,
        );
      }
      if (moduleName === 'react-native/Libraries/Components/TextInput/TextInputPropTypes') {
        return context.resolveRequest(
          context,
          'deprecated-react-native-prop-types/TextInputPropTypes',
          platform,
        );
      }
      if (moduleName === 'react-native/Libraries/Image/ImagePropTypes') {
        return context.resolveRequest(
          context,
          'deprecated-react-native-prop-types/ImagePropTypes',
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};
