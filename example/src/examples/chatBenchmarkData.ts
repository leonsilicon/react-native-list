export type ChatBenchmarkReaction = {
  emoji: string;
  count: number;
};

export type ChatBenchmarkMessage = {
  id: string;
  author: string;
  isOwnMessage: boolean;
  message: string;
  timestamp: string;
  reactions: ChatBenchmarkReaction[];
};

export const chatBenchmarkMessageCount = 10000;

const authors = [
  "Maya",
  "Jonas",
  "Sam",
  "Priya",
  "Alex",
  "Nora",
  "Owen",
  "Lena",
];

const messageFragments = [
  "Can you try the latest branch on device and compare the first scroll?",
  "The row should grow from the rendered message and the reactions below it.",
  "I left a longer note here so this bubble wraps across multiple lines before the reaction bar is measured.",
  "Short update.",
  "This is intentionally a bit wordier to force a taller chat item with dynamic text measurement and no fixed item size.",
  "Let's keep the payload deterministic so every benchmark run renders the same conversation.",
  "The next message flips alignment again, which should exercise left and right message containers.",
  "Adding a few reaction chips under only some messages makes the row height less predictable.",
  "Perf traces should make it obvious if measurement gets expensive while flinging through old messages.",
  "That sounds good. I will check the viewport around the middle of the thread too.",
  "One more medium sized message for a more realistic chat rhythm.",
  "Tiny.",
];

const reactionEmojis = ["👍", "❤️", "😂", "🔥", "👀", "✅", "🎉"];

function makeMessageBody(index: number) {
  const fragmentCount = 1 + ((index * 5) % 4);
  let body = "";

  for (
    let fragmentOffset = 0;
    fragmentOffset < fragmentCount;
    fragmentOffset += 1
  ) {
    const fragmentIndex =
      (index + fragmentOffset * 3) % messageFragments.length;
    const fragment = messageFragments[fragmentIndex];

    if (body.length > 0) {
      body += " ";
    }

    body += fragment;
  }

  return body;
}

function makeTimestamp(index: number) {
  const hour = 9 + Math.floor((index % 600) / 60);
  const minute = index % 60;
  const hourText = String(hour);
  let minuteText = String(minute);

  if (minute < 10) {
    minuteText = "0" + minuteText;
  }

  return hourText + ":" + minuteText;
}

function makeReactions(index: number): ChatBenchmarkReaction[] {
  const shouldHaveReactions = index % 3 === 0 || index % 7 === 0;

  if (!shouldHaveReactions) {
    return [];
  }

  const reactionCount = 1 + (index % 3);
  const reactions: ChatBenchmarkReaction[] = [];

  for (
    let reactionIndex = 0;
    reactionIndex < reactionCount;
    reactionIndex += 1
  ) {
    const emojiIndex = (index + reactionIndex * 2) % reactionEmojis.length;
    const count = 1 + ((index + reactionIndex * 11) % 42);
    const reaction: ChatBenchmarkReaction = {
      emoji: reactionEmojis[emojiIndex],
      count,
    };

    reactions.push(reaction);
  }

  return reactions;
}

export function makeChatBenchmarkMessages(): ChatBenchmarkMessage[] {
  const messages: ChatBenchmarkMessage[] = [];

  for (let index = 0; index < chatBenchmarkMessageCount; index += 1) {
    const rowNumber = index + 1;
    const rowNumberText = String(rowNumber);
    const authorIndex = index % authors.length;
    const message: ChatBenchmarkMessage = {
      id: "chat-message-" + rowNumberText,
      author: authors[authorIndex],
      isOwnMessage: index % 2 === 1,
      message: makeMessageBody(index),
      timestamp: makeTimestamp(index),
      reactions: makeReactions(index),
    };

    messages.push(message);
  }

  return messages;
}

function areReactionsEqual(
  oldMessage: ChatBenchmarkMessage,
  newMessage: ChatBenchmarkMessage,
) {
  if (oldMessage.reactions.length !== newMessage.reactions.length) {
    return false;
  }

  for (let index = 0; index < oldMessage.reactions.length; index += 1) {
    const oldReaction = oldMessage.reactions[index];
    const newReaction = newMessage.reactions[index];

    if (oldReaction.emoji !== newReaction.emoji) {
      return false;
    }

    if (oldReaction.count !== newReaction.count) {
      return false;
    }
  }

  return true;
}

export function areChatBenchmarkMessagesEqual(
  oldMessage: ChatBenchmarkMessage,
  newMessage: ChatBenchmarkMessage,
) {
  if (oldMessage.author !== newMessage.author) {
    return false;
  }

  if (oldMessage.isOwnMessage !== newMessage.isOwnMessage) {
    return false;
  }

  if (oldMessage.message !== newMessage.message) {
    return false;
  }

  if (oldMessage.timestamp !== newMessage.timestamp) {
    return false;
  }

  return areReactionsEqual(oldMessage, newMessage);
}
