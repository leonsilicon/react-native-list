import { View, Text } from "react-native";
import { UiList } from "react-native-list";

// This is the vision of how i imagine this API to work one day (next week? lol)

export default function App() {
  function renderItemWorklet(index: number) {
    "worklet";

    return (
      <View
        style={{
          width: 100,
          height: 100,
          backgroundColor: "red",
        }}
      >
        <Text>Item #{index}</Text>
      </View>
    );
  }

  // @ts-expect-error
  return <UiList renderItem={renderItemWorklet} />;
}
