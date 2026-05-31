import { useColors } from "@/hooks/useColors";
import { useSocket } from "@/contexts/SocketContext";
import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const colors = useColors();
  const { hasSetupCompleted, isLoading } = useSocket();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return hasSetupCompleted ? (
    <Redirect href="/(tabs)/" />
  ) : (
    <Redirect href="/setup" />
  );
}
