import { useRef } from "react";
import { Text, View } from "react-native";
import { UiList, setup, renderSync, uiListModule } from "react-native-nitro-list";
import {
  UiListView,
  UiListViewMethods,
} from "react-native-nitro-list/src/specs/UiListView.nitro";
import { callback } from "react-native-nitro-modules";
import { scheduleOnUI, runOnUI } from "react-native-worklets";

setup(); // TODO: put that in librar somewhere

function makeNativeViewCallback() {
  "worklet";

  console.log("test");
  // const ref = global.React.createRef();
  // const Test = global.React.createElement("RCTView", { ref }/*, [
  //     global.React.createElement("RCTView", { key: "child1" }), // this causes a react crash right
  // ] */);
  // global.log("Test element created: ", Test)

  // global.Render(Test, () => {
  //     global._log("Render complete")
  // });

  // if (ref.current == null) {
  //     throw new Error("Ref is null after render");
  // }

  // // const shadowNode = ref.current.node; // jsi::Object NativeState ShadowNodeWrapper
  // const tag = ref.current.canonical.nativeTag;
  // global.log("Ref current nativeTag: ", tag);

  // // cause a sync render to create the actual native view
  // const start = performance.now()
  // renderSync();
  // global.log("renderSync took ", performance.now() - start, "ms");
}

let isSetup = false;
export default function App() {
  // i like me better when i am with you
  console.log("App render");
  const uiListRef = useRef<UiListView>(null);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Worklet Test</Text>
      <UiList
        hybridRef={callback((ref) => {
          if (isSetup) return;
          isSetup = true;

          console.log("hybrid ref received!");
          scheduleOnUI(() => {
            "worklet";

            console.log(
              "Setting makeNativeViewCallback on UiListView on",
              typeof ref.setMakeNativeViewCallback
            );
            ref.setMakeNativeViewCallback(uiListModule, () => {
              "worklet";

              const ref = global.React.createRef();
              const Test = global.React.createElement(
                "RCTView",
                { ref } /*, [
        global.React.createElement("RCTView", { key: "child1" }), // this causes a react crash right 
    ] */
              );
              global.log("Test element created: ", Test);

              global.Render(Test, () => {
                global._log("Render complete");
              });

              if (ref.current == null) {
                throw new Error("Ref is null after render");
              }

              // const shadowNode = ref.current.node; // jsi::Object NativeState ShadowNodeWrapper
              const tag = ref.current.canonical.nativeTag;
              global.log("Ref current nativeTag: ", tag);

              // cause a sync render to create the actual native view
              const start = performance.now();
              renderSync();
              global.log("renderSync took ", performance.now() - start, "ms");

              return tag;
            });
          });
        })}
      />
    </View>
  );
}
