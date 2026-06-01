import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

const DEVICE_ID_KEY = "@lan_device_id";
const DEVICE_NAME_KEY = "@lan_device_name";

export interface Device {
  id: string;
  name: string;
  socketId: string;
}

export interface IncomingCall {
  fromId: string;
  fromName: string;
}

interface SocketCtx {
  socket: Socket | null;
  myDevice: { id: string; name: string } | null;
  devices: Device[];
  isConnected: boolean;
  isLoading: boolean;
  hasSetupCompleted: boolean;
  incomingCall: IncomingCall | null;
  setDeviceName: (name: string) => Promise<void>;
  dismissIncomingCall: () => void;
  acceptIncomingCall: () => void;
  rejectIncomingCall: () => void;
  initiateCall: (toId: string, toName: string) => void;
}

const SocketContext = createContext<SocketCtx>({} as SocketCtx);

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myDevice, setMyDevice] = useState<{ id: string; name: string } | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSetupCompleted, setHasSetupCompleted] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const myDeviceRef = useRef<{ id: string; name: string } | null>(null);

  useEffect(() => {
    init();
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  async function init() {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = makeId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    const name = (await AsyncStorage.getItem(DEVICE_NAME_KEY)) ?? "";
    const device = { id, name };
    setMyDevice(device);
    myDeviceRef.current = device;
    if (name) {
      setHasSetupCompleted(true);
      connectSocket(id, name);
    }
    setIsLoading(false);
  }

  function connectSocket(id: string, name: string) {
    socketRef.current?.disconnect();
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const url = domain ? `https://${domain}` : "http://localhost:80";
    const s = io(url, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1500,
    });

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("register-device", { id, name });
    });

    s.on("disconnect", () => {
      setIsConnected(false);
      setDevices([]);
    });

    s.on("device-list", (list: Device[]) => {
      setDevices(list.filter((d) => d.id !== id));
    });

    s.on("device-online", (d: Device) => {
      setDevices((prev) => {
        if (prev.find((x) => x.id === d.id)) return prev;
        return [...prev, d].filter((x) => x.id !== id);
      });
    });

    s.on("device-offline", (offId: string) => {
      setDevices((prev) => prev.filter((d) => d.id !== offId));
    });

    s.on("call-offer", (data: { from: string; fromName: string; to: string }) => {
      setIncomingCall({ fromId: data.from, fromName: data.fromName });
    });

    socketRef.current = s;
    setSocket(s);
  }

  async function setDeviceName(name: string) {
    const id = myDeviceRef.current?.id ?? makeId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    await AsyncStorage.setItem(DEVICE_NAME_KEY, name);
    const device = { id, name };
    setMyDevice(device);
    myDeviceRef.current = device;
    setHasSetupCompleted(true);
    connectSocket(id, name);
  }

  function dismissIncomingCall() {
    setIncomingCall(null);
  }

  function acceptIncomingCall() {
    if (!incomingCall) return;
    const { fromId, fromName } = incomingCall;
    setIncomingCall(null);
    router.push({
      pathname: "/call/[deviceId]",
      params: { deviceId: fromId, deviceName: fromName, mode: "incoming-accepted" },
    });
  }

  function rejectIncomingCall() {
    if (!incomingCall || !socketRef.current || !myDeviceRef.current) return;
    socketRef.current.emit("call-reject", {
      from: myDeviceRef.current.id,
      to: incomingCall.fromId,
    });
    setIncomingCall(null);
  }

  function initiateCall(toId: string, toName: string) {
    if (!socketRef.current || !myDeviceRef.current) return;
    router.push({
      pathname: "/call/[deviceId]",
      params: { deviceId: toId, deviceName: toName, mode: "outgoing" },
    });
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        myDevice,
        devices,
        isConnected,
        isLoading,
        hasSetupCompleted,
        incomingCall,
        setDeviceName,
        dismissIncomingCall,
        acceptIncomingCall,
        rejectIncomingCall,
        initiateCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
