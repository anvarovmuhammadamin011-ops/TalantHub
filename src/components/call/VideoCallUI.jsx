import { useEffect, useRef, useState } from "react";
import {
  PhoneOff, Phone, Mic, MicOff, Video, VideoOff, Volume2, VolumeX,
  ChevronDown, RefreshCw, X,
} from "lucide-react";
import { useVideoCall } from "../../context/VideoCallContext";
import { useT } from "../../context/I18nContext";

function formatDuration(sec) {
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// Telegram uslubidagi gradient avatar rangi (ismga qarab barqaror)
const AVATAR_GRADIENTS = [
  "from-sky-500 to-blue-700",
  "from-emerald-500 to-teal-700",
  "from-orange-500 to-red-600",
  "from-violet-500 to-purple-700",
  "from-pink-500 to-rose-700",
  "from-cyan-500 to-sky-700",
  "from-amber-500 to-orange-700",
];
function avatarGradient(name) {
  let h = 0;
  for (const ch of String(name || "?")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

export default function VideoCallUI() {
  const {
    call, localStream, remoteStream, muted, cameraOff, callDuration,
    mediaError, setMediaError, acceptCall, rejectCall, cancelOutgoing,
    hangup, toggleMute, toggleCamera, switchCamera,
    minimized, setMinimized, speakerOn, toggleSpeaker, audioOutputs,
  } = useVideoCall();
  const { t } = useT();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Kichraytirilgan bubble pozitsiyasi (o'ng-pastdan siljish)
  const [bubbleOffset, setBubbleOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, call?.status, minimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, call?.status, minimized]);

  // Karnay tanlovi: bir nechta chiqish qurilmasi bo'lsa setSinkId orqali almashtirish
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el || typeof el.setSinkId !== "function" || audioOutputs.length < 2) return;
    const target = speakerOn ? audioOutputs[0].deviceId : (audioOutputs[1]?.deviceId || audioOutputs[0].deviceId);
    el.setSinkId(target).catch(() => {});
  }, [speakerOn, audioOutputs, call?.status]);

  if (!call) {
    if (!mediaError) return null;
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-ink text-white text-sm px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3">
        <span>{t(`pages.chat.call.${mediaError}`)}</span>
        <button onClick={() => setMediaError(null)} className="opacity-70 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const isVideo = call.isVideo;
  const connected = call.status === "connected" || call.status === "connecting";
  const grad = avatarGradient(call.peerName);
  const showSpeaker = audioOutputs.length > 1 && !isVideo;

  const statusText =
    call.status === "calling" ? t("pages.chat.call.calling")
    : call.status === "ringing" ? (isVideo ? t("pages.chat.call.incomingVideo") : t("pages.chat.call.incomingAudio"))
    : call.status === "connecting" ? t("pages.chat.call.connecting")
    : formatDuration(callDuration);

  const onBubblePointerDown = (e) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: bubbleOffset.x, baseY: bubbleOffset.y, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onBubblePointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = d.startX - e.clientX;
    const dy = d.startY - e.clientY;
    if (Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) > 6) d.moved = true;
    setBubbleOffset({ x: Math.max(0, d.baseX + dx), y: Math.max(0, d.baseY + dy) });
  };
  const onBubblePointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.moved) setMinimized(false);
  };

  // ---- Kichraytirilgan suzuvchi bubble (Telegram'dagidek) ----
  if (minimized) {
    return (
      <div
        className="fixed z-[65] select-none"
        style={{ right: 16 + bubbleOffset.x, bottom: 88 + bubbleOffset.y, touchAction: "none" }}
        onPointerDown={onBubblePointerDown}
        onPointerMove={onBubblePointerMove}
        onPointerUp={onBubblePointerUp}
      >
        <div className="flex items-center gap-2 bg-[#1c2733]/95 backdrop-blur rounded-2xl pl-1.5 pr-2 py-1.5 shadow-2xl border border-white/10 cursor-pointer">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden`}>
            {isVideo && connected && remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline muted={false} className="w-full h-full object-cover" />
            ) : initials(call.peerName)}
          </div>
          <div className="text-white min-w-0">
            <div className="text-xs font-medium truncate max-w-[110px]">{call.peerName}</div>
            <div className="text-[11px] text-white/60">{call.status === "connected" ? formatDuration(callDuration) : statusText}</div>
          </div>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); hangup(); }}
            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 flex-shrink-0"
            title={t("pages.chat.call.end")}
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
        <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
      </div>
    );
  }

  const controlBtn = "w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95";

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-[#0e1621] flex flex-col">
      {/* Fon: avatar rangidan xira glow (Telegram uslubi) */}
      <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-25 blur-3xl scale-150 pointer-events-none`} />

      {/* Yuqori panel */}
      <div className="relative flex items-center justify-between px-4 py-3 text-white">
        <button
          onClick={() => setMinimized(true)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          title={t("pages.chat.call.minimize")}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/80">
          {isVideo ? t("pages.chat.call.videoCall") : t("pages.chat.call.audioCall")}
        </span>
        <div className="w-9" />
      </div>

      {/* Markaziy qism */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-white min-h-0">
        {isVideo && connected ? (
          <div className="absolute inset-0 bg-black">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                {t("pages.chat.call.connecting")}
              </div>
            )}
            {/* Mahalliy PiP */}
            <div className="absolute bottom-4 right-4 w-28 h-36 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border border-white/25 bg-black shadow-xl">
              {cameraOff ? (
                <div className="w-full h-full flex items-center justify-center text-white/50 bg-[#1c2733]">
                  <VideoOff className="w-6 h-6" />
                </div>
              ) : (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
              )}
            </div>
            {call.status === "connected" && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-xs bg-black/50 px-3 py-1 rounded-full text-white/90">
                {call.peerName} · {formatDuration(callDuration)}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="relative mb-6">
              {(call.status === "ringing" || call.status === "calling") && (
                <>
                  <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
                  <div className="absolute -inset-4 rounded-full border border-white/10 animate-pulse" />
                </>
              )}
              <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-3xl font-semibold shadow-2xl`}>
                {initials(call.peerName)}
              </div>
            </div>
            <div className="text-xl font-semibold text-center">{call.peerName}</div>
            <div className="text-sm text-white/60 mt-1.5">{statusText}</div>
            {/* Chiquvchi video qo'ng'iroqda mahalliy preview */}
            {call.direction === "outgoing" && isVideo && localStream && (call.status === "calling" || call.status === "connecting") && (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-44 h-32 object-cover rounded-2xl border border-white/20 mt-5" style={{ transform: "scaleX(-1)" }} />
            )}
            {/* Audio qo'ng'iroq uchun yashirin media elementlar */}
            {!isVideo && (
              <>
                <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
                <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
              </>
            )}
          </>
        )}
      </div>

      {mediaError && ["permission", "media", "camera-missing"].includes(mediaError) && (
        <div className="relative px-5 pb-2 text-center text-xs text-red-300">
          {t(`pages.chat.call.${mediaError}`)}
        </div>
      )}

      {/* Pastki boshqaruv (Telegram uslubi) */}
      <div className="relative flex items-center justify-center gap-4 sm:gap-5 px-5 pb-8 pt-2">
        {call.status === "ringing" ? (
          <>
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={rejectCall} className={`${controlBtn} bg-[#e53935] text-white hover:bg-[#d32f2f] w-14 h-14`} title={t("pages.chat.call.reject")}>
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="text-[11px] text-white/60">{t("pages.chat.call.reject")}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={acceptCall} className={`${controlBtn} bg-[#31c453] text-white hover:bg-[#2aad4b] w-14 h-14 animate-pulse`} title={t("pages.chat.call.accept")}>
                <Phone className="w-6 h-6" />
              </button>
              <span className="text-[11px] text-white/60">{t("pages.chat.call.accept")}</span>
            </div>
          </>
        ) : call.status === "calling" ? (
          <button onClick={cancelOutgoing} className={`${controlBtn} bg-[#e53935] text-white hover:bg-[#d32f2f] w-14 h-14`} title={t("common.cancel")}>
            <PhoneOff className="w-6 h-6" />
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`${controlBtn} ${muted ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
              title={muted ? t("pages.chat.call.unmute") : t("pages.chat.call.mute")}
            >
              {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            {isVideo ? (
              <>
                <button
                  onClick={toggleCamera}
                  className={`${controlBtn} ${cameraOff ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
                  title={cameraOff ? t("pages.chat.call.cameraOn") : t("pages.chat.call.cameraOff")}
                >
                  {cameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
                <button
                  onClick={switchCamera}
                  className={`${controlBtn} bg-white/10 text-white hover:bg-white/20`}
                  title={t("pages.chat.call.switchCamera")}
                >
                  <RefreshCw className="w-6 h-6" />
                </button>
              </>
            ) : (
              showSpeaker && (
                <button
                  onClick={toggleSpeaker}
                  className={`${controlBtn} ${speakerOn ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
                  title={t("pages.chat.call.speaker")}
                >
                  {speakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
              )
            )}
            <button onClick={hangup} className={`${controlBtn} bg-[#e53935] text-white hover:bg-[#d32f2f] w-14 h-14`} title={t("pages.chat.call.end")}>
              <PhoneOff className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

    </div>
  );
}
