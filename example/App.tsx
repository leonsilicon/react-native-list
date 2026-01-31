import { useRef } from "react";
import { processColor, SafeAreaView, Text, useWindowDimensions, View } from "react-native";
import {
  renderSync,
  setup,
  UiList,
  uiListModule,
} from "react-native-nitro-list";
import {
  UiListView,
  UiListViewMethods,
} from "react-native-nitro-list/src/specs/UiListView.nitro";
import { callback } from "react-native-nitro-modules";
import { runOnUI, scheduleOnUI } from "react-native-worklets";

setup(); // TODO: put that in library somewhere

const colorRedProcessed = processColor("red");
const colorGreenProcessed = processColor("green");

let isSetup = false;
export default function App() {
  // i like me better when i am with you
  console.log("App render");
  const uiListRef = useRef<UiListView>(null);
  const { height, width } = useWindowDimensions();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* <Text>Worklet Test</Text> */}
      <UiList
        style={{
          flex: 1,
          height,
          width,
        }}
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
              global.itemId = (global.itemId ?? 0) + 1;
              const NewElement = global.React.createElement(
                "RCTView",
                {
                  key: "itemid-" + global.itemId,
                  ref,
                  collapsable: false,
                  width: 100,
                  height: 100,
                  marginBottom: 10,
                  marginLeft: 10,
                  backgroundColor: colorRedProcessed,
                },
                // TODO: currently this causes the renderer to never finish…?
                [
                  global.React.createElement("RCTView", {
                    key: "childid-" + global.itemId,
                    width: 50,
                    height: 50,
                    backgroundColor: colorGreenProcessed,
                  }),
                ]
              );
              global.log("Test element created: ", NewElement);
              if (global.elementsRendered == null) {
                global.elementsRendered = [];
              }
              global.elementsRendered.push(NewElement);


              const ParentContainer = global.React.createElement(
                "RCTView",
                {
                },
                global.elementsRendered
              );

              global.log("Render result:")
              global.log(ParentContainer.props.children);

              global.Render(ParentContainer, () => {
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
