import React from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "./styles";

export function ExampleHeader(props: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <View style={[styles.header, styles.headerWithBack]}>
      <Pressable style={styles.backButton} onPress={props.onBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
      <View>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.subtitle}>{props.subtitle}</Text>
      </View>
    </View>
  );
}

export function DebugButton(props: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={props.onPress}>
      <Text style={styles.buttonText}>{props.label}</Text>
    </Pressable>
  );
}
