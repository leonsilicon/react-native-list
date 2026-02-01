import React, { useRef } from "react";
import {
  processColor,
  useWindowDimensions,
  View,
} from "react-native";
import {
  renderSync,
  setup,
  UiList,
  uiListModule,
} from "react-native-nitro-list";
import {
  type UiListView,
} from "react-native-nitro-list/src/specs/UiListView.nitro";
import { callback } from "react-native-nitro-modules";
import { scheduleOnUI } from "react-native-worklets";

setup(); // TODO: put that in library somewhere

const colorRedProcessed = processColor("red");
const colorGreenProcessed = processColor("green");

const data = Array.from({ length: 10_000 }).map((_, index) => ({
  id: index.toString(),
  title: `Item #${index}`,
}));

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

            global.log(
              "Setting makeNativeViewCallback on UiListView on",
              typeof ref.setMakeNativeViewCallback
            );

            const tagToArrayPosition: Record<number, number> = {};
            global.tagToArrayPosition = tagToArrayPosition;
            const tagToItemId: Record<number, number> = {};
            global.tagToItemId = tagToItemId;

            // TODO: can we enable this somehow as a prop?
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
                [
                  global.React.createElement(
                    "RCTText",
                    {
                      key: "childid-" + global.itemId,
                      // width: 50,
                      // height: 50,
                      backgroundColor: colorGreenProcessed,
                    },
                    [
                      global.React.createElement("RCTRawText", {
                        key: "rawtextid-" + global.itemId,
                        // text: "Item #" + global.itemId,
                        text: ""
                      }),
                    ]
                  ),
                ]
              );
              // global.log("Test element created: ", NewElement);
              if (global.elementsRendered == null) {
                global.elementsRendered = [];
              }
              const newLength = global.elementsRendered.push(NewElement);
              const currentIndex = newLength - 1;

              const ParentContainer = global.React.createElement(
                "RCTView",
                {},
                global.elementsRendered
              );

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
            log ("[JS] Setting updateViewCallback on UiListView");

            ref.setUpdateViewCallback(
              uiListModule,
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
                const NewElement = global.React.createElement(
                  "RCTView",
                  {
                    key: "itemid-" + itemId,
                    // ref, // TODO: i hope this is cool?
                    collapsable: false,
                    width: 100,
                    height: 100,
                    marginBottom: 10,
                    marginLeft: 10,
                    backgroundColor: colorRedProcessed,
                  },
                  [
                    global.React.createElement(
                      "RCTText",
                      {
                        key: "childid-" + itemId,
                        backgroundColor: colorGreenProcessed,
                      },
                      [
                        global.React.createElement("RCTRawText", {
                          key: "rawtextid-" + index,
                          text: "Item #" + index,
                        }),
                      ]
                    ),
                  ]
                );

                // Update the new element in the global array
                const position = tagToArrayPosition[reactTag];
                if (position == null) {
                  throw new Error("No position for tag " + reactTag);
                }
                global.elementsRendered[position] = NewElement;

                // Update the parent container
                const ParentContainer = global.React.createElement(
                  "RCTView",
                  {},
                  global.elementsRendered
                );

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

            log("[JS] UiListView setup complete.");
          });
        })}
      />
    </View>
  );
}
