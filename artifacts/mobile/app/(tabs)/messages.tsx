import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMessages, type Conversation } from "@/contexts/MessagesContext";
import { useColors } from "@/hooks/useColors";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function ConvoItem({ item }: { item: Conversation }) {
  const colors = useColors();

  const initials = item.deviceName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  function handlePress() {
    router.push({
      pathname: "/chat/[deviceId]",
      params: { deviceId: item.deviceId, deviceName: item.deviceName },
    });
  }

  return (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + "28" }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
        {item.unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>
              {item.unreadCount > 9 ? "9+" : item.unreadCount}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.deviceName, { color: colors.foreground }]} numberOfLines={1}>
            {item.deviceName}
          </Text>
          {item.lastMessage && (
            <Text style={[styles.time, { color: colors.mutedForeground }]}>
              {timeAgo(item.lastMessage.timestamp)}
            </Text>
          )}
        </View>
        {item.lastMessage && (
          <Text
            style={[
              styles.preview,
              {
                color:
                  item.unreadCount > 0 ? colors.foreground : colors.mutedForeground,
                fontFamily:
                  item.unreadCount > 0 ? "Inter_500Medium" : "Inter_400Regular",
              },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage.isMine ? "You: " : ""}
            {item.lastMessage.text}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations } = useMessages();

  const convList = Object.values(conversations).sort(
    (a, b) =>
      (b.lastMessage?.timestamp ?? 0) - (a.lastMessage?.timestamp ?? 0)
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + (Platform.OS === "web" ? 67 : 16),
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Messages</Text>
      </View>

      <FlatList
        data={convList}
        keyExtractor={(c) => c.deviceId}
        contentContainerStyle={{
          paddingBottom:
            Math.max(insets.bottom, 16) + (Platform.OS === "web" ? 34 : 0) + 80,
        }}
        renderItem={({ item }) => <ConvoItem item={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="message-square" size={30} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No conversations yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Find devices in the Devices tab{"\n"}and start a conversation
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
  },
  initials: { fontSize: 19, fontFamily: "Inter_700Bold" },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  content: { flex: 1, marginLeft: 12, minWidth: 0 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
    gap: 8,
  },
  deviceName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  time: { fontSize: 12, fontFamily: "Inter_400Regular", flexShrink: 0 },
  preview: { fontSize: 13, lineHeight: 18 },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
