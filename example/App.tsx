import React from "react";
import { Text } from "react-native";
// TODO: right now in worklets trying to import from 'react-native' fails, and its undefined
import View from "react-native/Libraries/Components/View/View";
// const { View } = require("react-native/Libraries/Components/View/View");
import {scheduleOnUI} from 'react-native-worklets';
import {setup, uiListModule, uiManagerHelper} from "react-native-nitro-list"
import { NitroModules } from "react-native-nitro-modules";

setup();

// TODO: in bundle mode i can't move this to an import, as it would try
// to import the whole file, which tries to use NitroModules., which will
// crash as nitro modules can't init.
// Either I have to fix this, _or_, actually create NitroModules on the UI runtime.
const uiListModuleBoxed = NitroModules.box(uiListModule);
const capturedOnJS = global.nativeFabricUIManager;
const uiManagerHelperBoxed = NitroModules.box(uiManagerHelper);

function renderSync() {
  "worklet";
  const uiManagerHelperUnboxed = uiManagerHelperBoxed.unbox();
  uiManagerHelperUnboxed.renderSync(capturedOnJS);
}

// const capturedOnJS = global.__nativeComponentRegistry__hasComponent
scheduleOnUI(() => {
  "worklet"

  const test = <View style={{
    width: 100,
    height: 100,
    backgroundColor: "red",
  }} />;
  console.log("View on UI thread:", test);

  global.Render(test, () => {
    global._log("Render complete");
  });

  renderSync();
})

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Working</Text>
    </View>
  );
}
