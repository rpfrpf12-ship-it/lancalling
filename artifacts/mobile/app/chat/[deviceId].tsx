import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageBubble } from "@/components/MessageBubble";
import { useMessages } from "@/contexts/MessagesContext";
import { useSocket } from "@/contexts/SocketContext";
import { useColors } from "@/hooks/useColors";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ deviceId: string; deviceName: string }>();
  const { deviceId, deviceName } = params;
  const { getMessages, sendMessage, markRead } = useMessages();
  const { initiateCall } = useSocket();
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const messages = getMessages(deviceId);

  useEffect(() => {
    markRead(deviceId);
    return () => {
      markRead(deviceId);
    };
  }, [deviceId]);

  function handleSend() {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(deviceId, deviceName, text);
    setText("");
  }

  function handleCall() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    initiateCall(deviceId, deviceName);
  }

  const initials =
    (deviceName ?? "?")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { backgroundColor: colors.primary + "28" }]}>
          <Text style={[styles.headerInitials, { color: colors.primary }]}>{initials}</Text>
          <View
            style={[
              styles.onlineDot,
              { backgroundColor: colors.online, borderColor: colors.card },
            ]}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
            {deviceName}
          </Text>
          <Text style={[styles.headerStatus, { color: colors.online }]}>Online</Text>
        </View>
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: colors.online + "1E" }]}
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <Feather name="phone" size={20} color={colors.online} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...messages].reverse()}
        keyExtractor={(m) => m.id}
        inverted
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => <MessageBubble message={item} />}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
              Start a conversation with {deviceName}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom:
              Math.max(insets.bottom, 12) + (Platform.OS === "web" ? 34 : 0),
          },
        ]}
      >
        <View
          style={[
            styles.inputWrap,
            { backgroundColor: colors.input, borderColor: colors.border },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Message..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: text.trim() ? colors.primary : colors.muted },
          ]}
          onPress={handleSend}
          disabled={!text.trim()}
          activeOpacity={0.8}
        >
          <Feather
            name="send"
            size={18}
            color={text.trim() ? "#fff" : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 12,
    paddingTop: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 8, marginRight: 2 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerInitials: { fontSize: 14, fontFamily: "Inter_700Bold" },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  headerStatus: { fontSize: 12, fontFamily: "Inter_400Regular" },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: { paddingVertical: 12, flexGrow: 1 },
  emptyChat: { alignItems: "center", padding: 48 },
  emptyChatText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
