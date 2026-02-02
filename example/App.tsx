import React from "react";
import { Button, processColor, Text, useWindowDimensions } from "react-native";
// TODO: right now in worklets trying to import from 'react-native' fails, and its undefined
import View from "react-native/Libraries/Components/View/View";
// const { View } = require("react-native/Libraries/Components/View/View");
import { scheduleOnUI } from "react-native-worklets";
import {
  setup,
  UiList,
  uiListModule,
  uiManagerHelper,
} from "react-native-nitro-list";
import { callback, NitroModules } from "react-native-nitro-modules";

setup();

const colorRedProcessed = processColor("red");
const colorGreenProcessed = processColor("green");

let isSetup = false;

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
// scheduleOnUI(() => {
//   "worklet";

//   const ref = global.React.createRef();
//   global.itemId = (global.itemId ?? 0) + 1;
//   const NewElement = (
//     <View
//       key={"itemid-" + global.itemId}
//       ref={ref}
//       collapsable={false}
//       style={{
//         width: 100,
//         height: 100,
//         backgroundColor: colorRedProcessed,
//       }}
//     ></View>
//   );

//   if (global.elementsRendered == null) {
//     global.elementsRendered = [];
//   }
//   const newLength = global.elementsRendered.push(NewElement);
//   const currentIndex = newLength - 1;

//   const ParentContainer = <View>{global.elementsRendered}</View>;

//   global.Render(ParentContainer, () => {
//     global._log("Render complete");
//   });

//   renderSync();
// });

export default function App() {
  const { height, width } = useWindowDimensions();
  const [count, setCount] = React.useState(0);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* <Text>React Native Nitro List Example App</Text>
      <Button title={"Press me " + count} onPress={() => setCount(count + 1)}></Button> */}
      {/* <UiList
        style={{
          flex: 1,
          height,
          width,
        }}
        hybridRef={callback((ref) => {
          if (isSetup) return;
          isSetup = true;

          scheduleOnUI(() => {
            "worklet";
            const uiListModuleUnboxed = uiListModuleBoxed.unbox();
            console.log(uiListModuleUnboxed);
          });
        })}
      /> */}
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

            const tagToArrayPosition: Record<number, number> = {};
            global.tagToArrayPosition = tagToArrayPosition;
            const tagToItemId: Record<number, number> = {};
            global.tagToItemId = tagToItemId;

            const uiListModuleUnboxed = uiListModuleBoxed.unbox();

            // TODO: can we enable this somehow as a prop?
            ref.setMakeNativeViewCallback(uiListModuleUnboxed, () => {
              "worklet";

              const ref = global.React.createRef();
              global.itemId = (global.itemId ?? 0) + 1;
              const NewElement = (
                <View
                  key={"itemid-" + global.itemId}
                  ref={ref}
                  collapsable={false}
                  style={{
                    width: 100,
                    height: 100,
                    backgroundColor: colorRedProcessed,
                  }}
                ></View>
              );

              if (global.elementsRendered == null) {
                global.elementsRendered = [];
              }
              const newLength = global.elementsRendered.push(NewElement);
              const currentIndex = newLength - 1;

              const ParentContainer = <View>{global.elementsRendered}</View>;

              // global.log("Render result:");
              // global.log(ParentContainer.props.children);

              global.Render(ParentContainer, () => {
                global._log("Render complete");
              });

              if (ref.current == null) {
                throw new Error("Ref is null after render");
              }

              // const shadowNode = ref.current.node; // jsi::Object NativeState ShadowNodeWrapper
              const tag = ref.current.canonical.nativeTag;
              global.log("Ref current nativeTag: ", tag);
              tagToArrayPosition[tag] = currentIndex;
              tagToItemId[tag] = global.itemId;

              // cause a sync render to create the actual native view
              const start = performance.now();
              renderSync();
              global.log("renderSync took ", performance.now() - start, "ms");

              return tag;
            });

            ref.setUpdateViewCallback(
              uiListModuleUnboxed,
              (reactTag: number, index: number) => {
                "worklet";
                global.log(
                  `[JS] Update view callback called for tag ${reactTag} at index ${index}`,
                  tagToArrayPosition
                );

                const itemId = tagToItemId[reactTag];
                if (itemId == null) {
                  throw new Error("No itemId for tag " + reactTag);
                }

                // "Rerender the element"
                // this really means creating the elements with the same structure again
                // const NewElement = global.React.createElement(
                //   "RCTView",
                //   {
                //     key: "itemid-" + itemId,
                //     // ref, // TODO: i hope this is cool?
                //     collapsable: false,
                //     width: 100,
                //     height: 100,
                //     marginBottom: 10,
                //     marginLeft: 10,
                //     backgroundColor: colorRedProcessed,
                //   },
                //   [
                //     global.React.createElement(
                //       "RCTText",
                //       {
                //         key: "childid-" + itemId,
                //         backgroundColor: colorGreenProcessed,
                //       },
                //       [
                //         global.React.createElement("RCTRawText", {
                //           key: "rawtextid-" + index,
                //           text: "Item #" + index,
                //         }),
                //       ]
                //     ),
                //   ]
                // );
                const NewElement = (
                  <View
                    key={"itemid-" + itemId}
                    collapsable={false}
                    style={{
                      width: 100,
                      height: 100,
                      backgroundColor: colorRedProcessed,
                    }}
                  ></View>
                );

                // Update the new element in the global array
                const position = tagToArrayPosition[reactTag];
                if (position == null) {
                  throw new Error("No position for tag " + reactTag);
                }
                global.elementsRendered[position] = NewElement;

                // Update the parent container
                // const ParentContainer = global.React.createElement(
                //   "RCTView",
                //   {},
                //   global.elementsRendered
                // );
                const ParentContainer = <View>{global.elementsRendered}</View>;

                global.Render(ParentContainer, () => {
                  global._log("Update Render complete");
                });

                // Cause a sync render to update the actual native view
                const start = performance.now();
                renderSync();
                global.log(
                  "Update renderSync took ",
                  performance.now() - start,
                  "ms"
                );

                return true;
              }
            );
          });
        })}
      />
    </View>
  );
}
