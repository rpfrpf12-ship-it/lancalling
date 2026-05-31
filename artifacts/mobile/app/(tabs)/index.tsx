import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeviceCard } from "@/components/DeviceCard";
import { useSocket } from "@/contexts/SocketContext";
import { useColors } from "@/hooks/useColors";

export default function DevicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { devices, isConnected, socket, myDevice } = useSocket();

  function handleRefresh() {
    if (socket && myDevice?.name) {
      socket.emit("register-device", { id: myDevice.id, name: myDevice.name });
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Devices</Text>
          <View
            style={[
              styles.connectionBadge,
              {
                backgroundColor: isConnected
                  ? colors.online + "20"
                  : colors.destructive + "20",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isConnected
                    ? colors.online
                    : colors.destructive,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: isConnected ? colors.online : colors.destructive,
                },
              ]}
            >
              {isConnected ? "Connected" : "Connecting..."}
            </Text>
          </View>
        </View>
        {myDevice?.name ? (
          <Text style={[styles.myName, { color: colors.mutedForeground }]}>
            You are{" "}
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
              {myDevice.name}
            </Text>
          </Text>
        ) : null}
      </View>

      {!isConnected && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Connecting to server...
          </Text>
        </View>
      )}

      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom:
              Math.max(insets.bottom, 16) +
              (Platform.OS === "web" ? 34 : 0) +
              80,
          },
        ]}
        ListHeaderComponent={
          devices.length > 0 ? (
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {devices.length} {devices.length === 1 ? "device" : "devices"} online
            </Text>
          ) : null
        }
        ListEmptyComponent={
          isConnected ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="wifi" size={30} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No devices found
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Other devices running LAN Calling{"\n"}will appear here automatically
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <DeviceCard device={item} />}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
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
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  myName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  loadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  list: { paddingTop: 16 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
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
