import React, { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [cuentaSolicitada, setCuentaSolicitada] = useState(null);

  useEffect(() => {
    if (socket) return;

    const url = import.meta.env.VITE_SOCKET_URL;
    console.log("🔌 Conectando socket a:", url);

    const socketInstance = io(url, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("✅ [Socket] Conectado:", socketInstance.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("⚠️ [Socket] Desconectado:", reason);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ [Socket] Error:", err.message);
    });

    socketInstance.on("cuentaSolicitada", (data) => {
      console.log("💰 Cuenta solicitada:", data);
      setCuentaSolicitada(data);
    });

    return () => {
      console.log("🚪 Cerrando socket...");
      socketInstance.disconnect();
    };
  }, [socket]);

  const joinRoom = (room) => socket?.emit("joinRoom", room);
  const leaveRoom = (room) => socket?.emit("leaveRoom", room);

  return (
    <SocketContext.Provider
      value={{ socket, joinRoom, leaveRoom, cuentaSolicitada, setCuentaSolicitada }}
    >
      {children}
    </SocketContext.Provider>
  );
};
