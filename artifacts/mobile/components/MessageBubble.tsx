import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Message } from "@/contexts/MessagesContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  message: Message;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message }: Props) {
  const colors = useColors();
  const isMine = message.isMine;

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          isMine
            ? [styles.bubbleMine, { backgroundColor: colors.primary }]
            : [
                styles.bubbleTheirs,
                { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ],
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isMine ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.time,
            {
              color: isMine
                ? colors.primaryForeground + "99"
                : colors.mutedForeground,
            },
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 3,
  },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  text: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  time: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    textAlign: "right",
  },
});
