import { useEffect, useRef } from "react";
import { PhoneOff, Phone, Mic, MicOff, Video, VideoOff, X } from "lucide-react";
import { useVideoCall } from "../../context/VideoCallContext";
import { useT } from "../../context/I18nContext";

function formatDuration(sec) {
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function VideoCallUI() {
  const {
    call, localStream, remoteStream, muted, cameraOff, callDuration,
    mediaError, setMediaError, acceptCall, rejectCall, cancelOutgoing,
    hangup, toggleMute, toggleCamera,
  } = useVideoCall();
  const { t } = useT();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, call?.status]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, call?.status]);

  if (!call) {
    if (!mediaError) return null;
    // Vaqtinchalik xabar (rad etildi / javob yo'q / ruxsat)
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

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#111] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white/5">
          <div className="text-white">
            <div className="font-semibold text-sm">{call.peerName}</div>
            <div className="text-xs text-white/60">
              {call.status === "calling" && t("pages.chat.call.calling")}
              {call.status === "ringing" && (isVideo ? t("pages.chat.call.incomingVideo") : t("pages.chat.call.incomingAudio"))}
              {call.status === "connecting" && t("pages.chat.call.connecting")}
              {call.status === "connected" && formatDuration(callDuration)}
            </div>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 text-white/80">
            {isVideo ? t("pages.chat.call.videoCall") : t("pages.chat.call.audioCall")}
          </span>
        </div>

        {/* Videos */}
        {call.status === "connected" || call.status === "connecting" ? (
          <div className="relative bg-black aspect-video">
            {isVideo ? (
              <>
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                    {t("pages.chat.call.connecting")}
                  </div>
                )}
                {/* Local PiP */}
                <div className="absolute bottom-3 right-3 w-28 h-20 sm:w-40 sm:h-28 rounded-xl overflow-hidden border border-white/20 bg-black">
                  {cameraOff ? (
                    <div className="w-full h-full flex items-center justify-center text-white/50">
                      <VideoOff className="w-5 h-5" />
                    </div>
                  ) : (
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" style={{ transform: "scaleX(-1)" }} />
                  )}
                </div>
              </>
            ) : (
              <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center gap-3 text-white">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-semibold">
                  {call.peerName?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="text-sm text-white/70">
                  {call.status === "connected" ? formatDuration(callDuration) : t("pages.chat.call.connecting")}
                </div>
                <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
                <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
              </div>
            )}
          </div>
        ) : (
          /* Calling / Ringing ekrani */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-white">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-semibold">
                {call.peerName?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
            </div>
            <div className="font-semibold">{call.peerName}</div>
            <div className="text-sm text-white/60 mt-1 mb-2">
              {call.direction === "outgoing" ? t("pages.chat.call.calling") : (isVideo ? t("pages.chat.call.incomingVideo") : t("pages.chat.call.incomingAudio"))}
            </div>
            {/* Mahalliy preview (faqat chiquvchi video qo'ng'iroqda) */}
            {call.direction === "outgoing" && isVideo && localStream && (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-40 h-28 object-cover rounded-xl border border-white/20 mt-2" style={{ transform: "scaleX(-1)" }} />
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 px-5 py-4 bg-white/5">
          {call.status === "ringing" ? (
            <>
              <button
                onClick={rejectCall}
                className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                title={t("pages.chat.call.reject")}
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              <button
                onClick={acceptCall}
                className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors animate-pulse"
                title={t("pages.chat.call.accept")}
              >
                <Phone className="w-5 h-5" />
              </button>
            </>
          ) : call.status === "calling" ? (
            <button
              onClick={cancelOutgoing}
              className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              title={t("common.cancel")}
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                title={muted ? t("pages.chat.call.unmute") : t("pages.chat.call.mute")}
              >
                {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              {isVideo && (
                <button
                  onClick={toggleCamera}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${cameraOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                  title={cameraOff ? t("pages.chat.call.cameraOn") : t("pages.chat.call.cameraOff")}
                >
                  {cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}
              <button
                onClick={hangup}
                className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                title={t("pages.chat.call.end")}
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {mediaError && ["permission", "media", "camera-missing"].includes(mediaError) && (
          <div className="px-5 pb-4 text-center text-xs text-red-300">
            {t(`pages.chat.call.${mediaError}`)}
          </div>
        )}
      </div>
    </div>
  );
}
