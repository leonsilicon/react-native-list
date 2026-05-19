import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ExamplePicker } from "./ExamplePicker";
import { DynamicTextHeightsExample } from "./examples/DynamicTextHeightsExample";
import { ListUpdateLabExample } from "./examples/ListUpdateLabExample";
import type { ExampleId } from "./types";

type ExamplesStackParamList = {
  Examples: undefined;
  ListUpdateLab: undefined;
  DynamicTextHeights: undefined;
};

type ExamplePickerScreenProps = NativeStackScreenProps<
  ExamplesStackParamList,
  "Examples"
>;

type ListUpdateLabScreenProps = NativeStackScreenProps<
  ExamplesStackParamList,
  "ListUpdateLab"
>;

type DynamicTextHeightsScreenProps = NativeStackScreenProps<
  ExamplesStackParamList,
  "DynamicTextHeights"
>;

const Stack = createNativeStackNavigator<ExamplesStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
};

function ExamplePickerScreen(props: ExamplePickerScreenProps) {
  function selectExample(exampleId: ExampleId) {
    if (exampleId === "update-lab") {
      props.navigation.navigate("ListUpdateLab");
      return;
    }

    props.navigation.navigate("DynamicTextHeights");
  }

  return <ExamplePicker onSelectExample={selectExample} />;
}

function ListUpdateLabScreen(props: ListUpdateLabScreenProps) {
  function goBack() {
    props.navigation.goBack();
  }

  return <ListUpdateLabExample onBack={goBack} />;
}

function DynamicTextHeightsScreen(props: DynamicTextHeightsScreenProps) {
  function goBack() {
    props.navigation.goBack();
  }

  return <DynamicTextHeightsExample onBack={goBack} />;
}

export function ExamplesApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Examples" screenOptions={screenOptions}>
        <Stack.Screen name="Examples" component={ExamplePickerScreen} />
        <Stack.Screen name="ListUpdateLab" component={ListUpdateLabScreen} />
        <Stack.Screen
          name="DynamicTextHeights"
          component={DynamicTextHeightsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
