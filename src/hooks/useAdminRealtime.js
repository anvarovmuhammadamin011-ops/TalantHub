import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";

// Subscribes to the server's "admin_update" event (emitted to the "admin" socket room on
// vacancy/application/flag/dispute/support/verification changes) and calls onUpdate — debounced,
// since a single action (e.g. the moderation scan) can emit several updates in quick succession.
export function useAdminRealtime(onUpdate) {
  const { socket } = useSocket();
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!socket) return;
    let timeoutId = null;
    const handler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callbackRef.current(), 400);
    };
    socket.on("admin_update", handler);
    return () => {
      clearTimeout(timeoutId);
      socket.off("admin_update", handler);
    };
  }, [socket]);
}
