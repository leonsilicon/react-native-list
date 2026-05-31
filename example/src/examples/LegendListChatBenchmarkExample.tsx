import React, { memo, useMemo } from "react";
import { Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { ExampleHeader } from "../components";
import { styles } from "../styles";
import type { ChatBenchmarkMessage } from "./chatBenchmarkData";
import {
  areChatBenchmarkMessagesEqual,
  chatBenchmarkMessageCount,
  makeChatBenchmarkMessages,
} from "./chatBenchmarkData";

function keyExtractor(item: ChatBenchmarkMessage) {
  return item.id;
}

function itemsAreEqual(
  oldMessage: ChatBenchmarkMessage,
  newMessage: ChatBenchmarkMessage,
) {
  return areChatBenchmarkMessagesEqual(oldMessage, newMessage);
}

const LegendChatRow = memo(function LegendChatRow(props: {
  message: ChatBenchmarkMessage;
}) {
  let rowStyle: StyleProp<ViewStyle> = [styles.chatRow, styles.chatRowOther];
  let bubbleStyle: StyleProp<ViewStyle> = [
    styles.chatBubble,
    styles.chatBubbleOther,
  ];
  let author = null;
  let reactions = null;

  if (props.message.isOwnMessage) {
    rowStyle = [styles.chatRow, styles.chatRowOwn];
    bubbleStyle = [styles.chatBubble, styles.chatBubbleOwn];
  } else {
    author = <Text style={styles.chatAuthor}>{props.message.author}</Text>;
  }

  if (props.message.reactions.length > 0) {
    reactions = (
      <View style={styles.chatReactions}>
        {props.message.reactions.map((reaction) => {
          const reactionKey = reaction.emoji + "-" + String(reaction.count);

          return (
            <View key={reactionKey} style={styles.chatReactionChip}>
              <Text style={styles.chatReactionText}>{reaction.emoji}</Text>
              <Text style={styles.chatReactionText}>{reaction.count}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={rowStyle}>
      <View style={bubbleStyle}>
        {author}
        <Text style={styles.chatMessage}>{props.message.message}</Text>
        <Text style={styles.chatMeta}>{props.message.timestamp}</Text>
      </View>
      {reactions}
    </View>
  );
});

function renderItem(props: { item: ChatBenchmarkMessage }) {
  return <LegendChatRow message={props.item} />;
}

export function LegendListChatBenchmarkExample(props: { onBack: () => void }) {
  const messages = useMemo(() => {
    return makeChatBenchmarkMessages();
  }, []);

  return (
    <View style={styles.root}>
      <ExampleHeader
        title="Legend List chat benchmark"
        subtitle="10k measured chat rows with left/right bubbles and reaction chips."
        onBack={props.onBack}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {chatBenchmarkMessageCount} messages
        </Text>
        <Text style={styles.summaryText}>Legend List</Text>
      </View>

      <LegendList
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        itemsAreEqual={itemsAreEqual}
        recycleItems
        contentContainerStyle={styles.chatListContent}
        style={{
          flex: 1,
        }}
      />
    </View>
  );
}
