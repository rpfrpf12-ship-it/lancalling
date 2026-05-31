import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";

const MESSAGES_KEY = "@lan_messages_v1";

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  text: string;
  timestamp: number;
  isMine: boolean;
}

export interface Conversation {
  deviceId: string;
  deviceName: string;
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
}

interface MessagesCtx {
  conversations: Record<string, Conversation>;
  sendMessage: (toId: string, toName: string, text: string) => void;
  getMessages: (deviceId: string) => Message[];
  markRead: (deviceId: string) => void;
}

const MessagesContext = createContext<MessagesCtx>({
  conversations: {},
  sendMessage: () => {},
  getMessages: () => [],
  markRead: () => {},
});

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { socket, myDevice } = useSocket();
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket || !myDevice) return;
    const handler = (data: {
      from: string;
      fromName: string;
      text: string;
      timestamp: number;
    }) => {
      const msg: Message = {
        id: makeId(),
        fromId: data.from,
        fromName: data.fromName,
        toId: myDevice.id,
        text: data.text,
        timestamp: data.timestamp,
        isMine: false,
      };
      upsertMessage(data.from, data.fromName, msg, false);
    };
    socket.on("private-message", handler);
    return () => {
      socket.off("private-message", handler);
    };
  }, [socket, myDevice]);

  async function load() {
    try {
      const raw = await AsyncStorage.getItem(MESSAGES_KEY);
      if (raw) setConversations(JSON.parse(raw));
    } catch {}
  }

  async function persist(convos: Record<string, Conversation>) {
    try {
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(convos));
    } catch {}
  }

  function upsertMessage(
    deviceId: string,
    deviceName: string,
    msg: Message,
    isMine: boolean
  ) {
    setConversations((prev) => {
      const existing = prev[deviceId] ?? {
        deviceId,
        deviceName,
        messages: [],
        unreadCount: 0,
      };
      const updated: Conversation = {
        ...existing,
        deviceName,
        messages: [...existing.messages, msg],
        lastMessage: msg,
        unreadCount: isMine ? existing.unreadCount : existing.unreadCount + 1,
      };
      const next = { ...prev, [deviceId]: updated };
      persist(next);
      return next;
    });
  }

  function sendMessage(toId: string, toName: string, text: string) {
    if (!socket || !myDevice || !text.trim()) return;
    const msg: Message = {
      id: makeId(),
      fromId: myDevice.id,
      fromName: myDevice.name,
      toId,
      text: text.trim(),
      timestamp: Date.now(),
      isMine: true,
    };
    socket.emit("private-message", {
      from: myDevice.id,
      fromName: myDevice.name,
      to: toId,
      text: text.trim(),
      timestamp: msg.timestamp,
    });
    upsertMessage(toId, toName, msg, true);
  }

  function getMessages(deviceId: string): Message[] {
    return conversations[deviceId]?.messages ?? [];
  }

  function markRead(deviceId: string) {
    setConversations((prev) => {
      if (!prev[deviceId]) return prev;
      const next = {
        ...prev,
        [deviceId]: { ...prev[deviceId], unreadCount: 0 },
      };
      persist(next);
      return next;
    });
  }

  return (
    <MessagesContext.Provider value={{ conversations, sendMessage, getMessages, markRead }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessagesContext);
}
