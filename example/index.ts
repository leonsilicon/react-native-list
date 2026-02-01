// import { isRNRuntime } from 'react-native-worklets';
// if (isRNRuntime()) { // Note: at one point i thought thats necessary, because worklets will load the whole bundle to the other runtime
// However, it turns out this was mostly due to inlineRequires set to false.
// Ticket: https://github.com/software-mansion/react-native-reanimated/issues/8904
    const { registerRootComponent } = require('expo');
    const App = require('./App').default;

    // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
    // It also ensures that whether you load the app in Expo Go or in a native build,
    // the environment is set up appropriately
    registerRootComponent(App);
// }
