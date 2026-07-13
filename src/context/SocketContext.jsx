import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getToken } from "../lib/api";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!user) return;

    const token = getToken();
    if (!token) return;

    const socket = io("/", { auth: { token } });
    socketRef.current = socket;

    socket.on("user_online", ({ userId, online }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on("notification", (notif) => {
      setNotifications((prev) => [{ ...notif, id: Date.now(), read: false, created_at: new Date().toISOString() }, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("new_message_notification", ({ chatId, message, from }) => {
      setNotifications((prev) => [{
        id: Date.now(), type: "message", title: "Yangi xabar",
        description: message.text?.slice(0, 50), read: false, link: "/chat",
        created_at: new Date().toISOString()
      }, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("user_typing", ({ userId: uid, chatId }) => {
      setTypingUsers((prev) => ({ ...prev, [`${chatId}_${uid}`]: true }));
    });

    socket.on("user_stop_typing", ({ userId: uid, chatId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[`${chatId}_${uid}`];
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinChat = (chatId) => socketRef.current?.emit("join_chat", chatId);
  const leaveChat = (chatId) => socketRef.current?.emit("leave_chat", chatId);
  const sendMessage = (chatId, text) => socketRef.current?.emit("send_message", { chatId, text });
  const startTyping = (chatId) => socketRef.current?.emit("typing", { chatId });
  const stopTyping = (chatId) => socketRef.current?.emit("stop_typing", { chatId });

  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, onlineUsers, notifications, unreadCount,
      typingUsers, joinChat, leaveChat, sendMessage, startTyping, stopTyping,
      setNotifications, setUnreadCount, addNotification
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
