import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSocket, type Device } from "@/contexts/SocketContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  device: Device;
}

export function DeviceCard({ device }: Props) {
  const colors = useColors();
  const { initiateCall } = useSocket();

  function handleChat() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/chat/[deviceId]",
      params: { deviceId: device.id, deviceName: device.name },
    });
  }

  function handleCall() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    initiateCall(device.id, device.name);
  }

  const initials = device.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + "28" }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>{initials || "?"}</Text>
        <View
          style={[
            styles.onlineDot,
            { backgroundColor: colors.online, borderColor: colors.card },
          ]}
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {device.name}
        </Text>
        <Text style={[styles.status, { color: colors.online }]}>Online</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary + "20" }]}
          onPress={handleChat}
          activeOpacity={0.7}
        >
          <Feather name="message-circle" size={17} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.online + "20" }]}
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <Feather name="phone" size={17} color={colors.online} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  initials: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
