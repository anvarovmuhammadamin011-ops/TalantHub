import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { playRingtone, stopRingtone } from "../lib/callRingtone";

const VideoCallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// status: idle | calling (outgoing, waiting) | ringing (incoming) | connecting | connected | ended
export function VideoCallProvider({ children }) {
  const { socket, sendMessage } = useSocket();
  const { user } = useAuth();
  const [call, setCall] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [mediaError, setMediaError] = useState(null);
  // Telegram uslubi: suhbat davom etayotganda ekranni kichraytirish
  const [minimized, setMinimized] = useState(false);
  // Karnay (chiqish qurilmasi) — faqat bir nechta audiooutput bo'lsa ko'rsatiladi
  const [speakerOn, setSpeakerOn] = useState(true);
  const [audioOutputs, setAudioOutputs] = useState([]);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const callRef = useRef(null);
  const timerRef = useRef(null);
  const timeoutRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);

  callRef.current = call;

  const cleanupMedia = useCallback(() => {
    stopRingtone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch { /* noop */ }
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setMuted(false);
    setCameraOff(false);
    setCallDuration(0);
    setMinimized(false);
    setSpeakerOn(true);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  const endCallSilent = useCallback(() => {
    cleanupMedia();
    setCall(null);
    setMediaError(null);
  }, [cleanupMedia]);

  const hangup = useCallback(() => {
    const c = callRef.current;
    if (c && socket) {
      socket.emit("call:hangup", { callId: c.callId });
      // Chatga tizim xabari qoldirish (davomiyligi bilan)
      if (c.status === "connected" && c.chatId) {
        const mm = String(Math.floor(callDuration / 60)).padStart(2, "0");
        const ss = String(callDuration % 60).padStart(2, "0");
        try { sendMessage(c.chatId, `📞 ${c.isVideo ? "Video" : "Audio"} qo'ng'iroq yakunlandi (${mm}:${ss})`); } catch { /* noop */ }
      }
    }
    endCallSilent();
  }, [socket, callDuration, sendMessage, endCallSilent]);

  const createPeerConnection = useCallback((callId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit("call:ice", { callId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams?.[0] || new MediaStream([e.track]);
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCall((prev) => (prev ? { ...prev, status: "connected" } : prev));
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        if (!timerRef.current) {
          timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
        }
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        // ICE restartga imkon berish uchun biroz kutamiz — UI o'zi hangup qiladi
      }
    };

    return pc;
  }, [socket]);

  const acquireMedia = useCallback(async (isVideo) => {
    setMediaError(null);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(async (chat, isVideo = true) => {
    if (!socket || !chat) return;
    if (callRef.current) return; // allaqachon qo'ng'iroq bor
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("camera-missing");
      return;
    }
    try {
      const stream = await acquireMedia(isVideo);
      refreshAudioOutputs();
      const targetId = chat.other_id;
      // Avval socket'ga initiate yuboramiz — server callId yaratib target'ga uzatadi.
      // Lekin WebRTC offer uchun bizga callId kerak emas: server'dan qaytgan
      // call:accepted dan keyin offer yaratamiz. Biroq soddalik uchun:
      // callId ni client'da oldindan generatsiya qilmaymiz — server yaratadi va
      // biz uni "call:incoming" echo orqali olmaymiz. Shuning uchun:
      // 1) vaqtinchalik pending yozuv yaratamiz, 2) server callId ni
      // callee'ga beradi, caller esa offer'ni callee userId orqali emas,
      // balki callee "call:accept" qilgach olingan callId bilan yuboradi.
      // Eng oddiy ishonchli yo'l: caller ham o'ziga xos callId yasaydi va
      // server uni hurmat qiladi.
      const callId = `${Date.now()}_${user?.id}_${targetId}`;
      const pc = createPeerConnection(callId);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: isVideo });
      await pc.setLocalDescription(offer);

      setCall({
        callId, chatId: chat.id, peerId: targetId,
        peerName: chat.other_name || "Foydalanuvchi",
        isVideo, direction: "outgoing", status: "calling",
        pendingOffer: offer,
      });

      socket.emit("call:initiate", { chatId: chat.id, isVideo, callId });

      timeoutRef.current = setTimeout(() => {
        // 45 soniyada javob bo'lmasa — bekor qilish
        const c = callRef.current;
        if (c && c.status === "calling") {
          socket.emit("call:cancel", { callId: c.callId });
          logCall(c.chatId, `📞 ${c.isVideo ? "Video" : "Audio"} qo'ng'iroq — javob bo'lmadi`);
          endCallSilent();
          setMediaError("no-answer");
        }
      }, 45000);
    } catch (err) {
      console.error("startCall error:", err);
      cleanupMedia();
      setMediaError(err?.name === "NotAllowedError" ? "permission" : "media");
    }
  }, [socket, user?.id, acquireMedia, createPeerConnection, cleanupMedia, endCallSilent, logCall, refreshAudioOutputs]);

  const acceptCall = useCallback(async () => {
    const c = callRef.current;
    if (!c || !socket) return;
    try {
      const stream = await acquireMedia(c.isVideo);
      refreshAudioOutputs();
      const pc = createPeerConnection(c.callId);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      setCall((prev) => (prev ? { ...prev, status: "connecting" } : prev));
      socket.emit("call:accept", { callId: c.callId });
    } catch (err) {
      console.error("acceptCall error:", err);
      setMediaError(err?.name === "NotAllowedError" ? "permission" : "media");
    }
  }, [socket, acquireMedia, createPeerConnection, refreshAudioOutputs]);

  const rejectCall = useCallback(() => {
    const c = callRef.current;
    if (c && socket) socket.emit("call:reject", { callId: c.callId });
    endCallSilent();
  }, [socket, endCallSilent]);

  const cancelOutgoing = useCallback(() => {
    const c = callRef.current;
    if (c && socket) socket.emit("call:cancel", { callId: c.callId });
    endCallSilent();
  }, [socket, endCallSilent]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
  }, []);

  // Chatga qo'ng'iroq tarixi yozuvi (o'tkazib yuborilgan / rad etilgan / yakunlangan)
  const logCall = useCallback((chatId, text) => {
    if (!chatId) return;
    try { sendMessage(chatId, text); } catch { /* noop */ }
  }, [sendMessage]);

  // Chiqish audio qurilmalari ro'yxati (karnay tugmasi shunga qarab chiqadi)
  const refreshAudioOutputs = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioOutputs(devices.filter((d) => d.kind === "audiooutput"));
    } catch { /* noop */ }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setSpeakerOn((prev) => !prev);
  }, []);

  // Old/orqa kamera almashtirish (telefonlarda) — jonli track almashtirish
  const switchCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    const pc = pcRef.current;
    const oldTrack = stream?.getVideoTracks()?.[0];
    if (!oldTrack || !pc) return;
    const currentMode = oldTrack.getSettings?.().facingMode || "user";
    const nextMode = currentMode === "environment" ? "user" : "environment";
    try {
      let newStream = null;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: nextMode } }, audio: false,
        });
      } catch {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode }, audio: false,
        });
      }
      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) return;
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(newTrack);
      oldTrack.stop();
      stream.removeTrack(oldTrack);
      stream.addTrack(newTrack);
      setLocalStream(new MediaStream(stream.getTracks()));
      setCameraOff(false);
    } catch (err) {
      console.error("switchCamera error:", err);
      setMediaError("media");
    }
  }, []);

  // ---- Ringtone: holatga qarab avtomatik ----
  const callStatus = call?.status;
  const callDirection = call?.direction;
  useEffect(() => {
    if (!call) { stopRingtone(); return; }
    if (callStatus === "calling" && callDirection === "outgoing") playRingtone("outgoing");
    else if (callStatus === "ringing") playRingtone("incoming");
    else stopRingtone();
    return () => stopRingtone();
  }, [call, callStatus, callDirection]);

  // ---- Socket signaling handlers ----
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data) => {
      // Band bo'lsa — avtomatik rad etish
      if (callRef.current) {
        socket.emit("call:reject", { callId: data.callId });
        return;
      }
      setMediaError(null);
      setCall({
        callId: data.callId,
        chatId: data.chatId,
        peerId: data.fromUserId,
        peerName: data.fromName,
        isVideo: data.isVideo !== false,
        direction: "incoming",
        status: "ringing",
      });
    };

    const onAccepted = async ({ callId }) => {
      const c = callRef.current;
      if (!c) return;
      // Server callId'si bilan sinxronlash
      const effectiveCallId = callId || c.callId;
      try {
        // Agar peer connection hali yaratilmagan bo'lsa (server callId farqli holat)
        let pc = pcRef.current;
        if (!pc) {
          const stream = localStreamRef.current || await acquireMedia(c.isVideo);
          pc = createPeerConnection(effectiveCallId);
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        }
        // Pending offer bo'lsa — yangilangan callId bilan yuboramiz
        const offer = c.pendingOffer || await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: c.isVideo }).then(async (o) => {
          await pc.setLocalDescription(o);
          return o;
        });
        if (!c.pendingOffer) {
          // offer endigina yaratildi — local description allaqachon set
        }
        socket.emit("call:offer", { callId: effectiveCallId, sdp: pc.localDescription || offer });
        setCall((prev) => (prev ? { ...prev, callId: effectiveCallId, pendingOffer: undefined, status: "connecting" } : prev));
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        timeoutRef.current = setTimeout(() => {
          const cur = callRef.current;
          if (cur && cur.status !== "connected") hangup();
        }, 30000);
      } catch (err) {
        console.error("onAccepted error:", err);
      }
    };

    const onOffer = async ({ callId, sdp }) => {
      const c = callRef.current;
      if (!c || c.callId !== callId) return;
      try {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call:answer", { callId, sdp: pc.localDescription });
        setCall((prev) => (prev ? { ...prev, status: "connecting" } : prev));
      } catch (err) {
        console.error("onOffer error:", err);
      }
    };

    const onAnswer = async ({ callId, sdp }) => {
      const c = callRef.current;
      if (!c || c.callId !== callId) return;
      try {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (err) {
        console.error("onAnswer error:", err);
      }
    };

    const onIce = async ({ callId, candidate }) => {
      const c = callRef.current;
      if (!c || c.callId !== callId || !candidate) return;
      try {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("onIce error:", err);
      }
    };

    const onRejected = () => {
      const c = callRef.current;
      if (c) logCall(c.chatId, `📞 ${c.isVideo ? "Video" : "Audio"} qo'ng'iroq rad etildi`);
      endCallSilent();
      setMediaError("rejected");
    };
    const onCancelled = () => {
      const c = callRef.current;
      if (c) logCall(c.chatId, `📞 O'tkazib yuborilgan ${c.isVideo ? "video" : "audio"} qo'ng'iroq`);
      endCallSilent();
      setMediaError("cancelled");
    };
    const onEnded = ({ callId } = {}) => {
      const c = callRef.current;
      if (callId && c && c.callId !== callId) return;
      endCallSilent();
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice", onIce);
    socket.on("call:rejected", onRejected);
    socket.on("call:cancelled", onCancelled);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice", onIce);
      socket.off("call:rejected", onRejected);
      socket.off("call:cancelled", onCancelled);
      socket.off("call:ended", onEnded);
    };
  }, [socket, acquireMedia, createPeerConnection, endCallSilent, hangup, logCall]);

  // Unmount'da tozalash
  useEffect(() => () => {
    stopRingtone();
    if (pcRef.current) { try { pcRef.current.close(); } catch { /* noop */ } }
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <VideoCallContext.Provider value={{
      call, localStream, remoteStream, muted, cameraOff, callDuration, mediaError,
      setMediaError, startCall, acceptCall, rejectCall, cancelOutgoing, hangup,
      toggleMute, toggleCamera, switchCamera, minimized, setMinimized,
      speakerOn, toggleSpeaker, audioOutputs, refreshAudioOutputs, inCall: !!call,
    }}>
      {children}
    </VideoCallContext.Provider>
  );
}

export const useVideoCall = () => useContext(VideoCallContext);
