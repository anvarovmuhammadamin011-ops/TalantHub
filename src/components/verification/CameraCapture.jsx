import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, RefreshCw, Upload, AlertTriangle } from "lucide-react";
import { useT } from "../../context/I18nContext";

const MAX_SIDE = 1280;

// Jonli kameradan rasmga olish. Fayl input faqat kamera bo'lmaganda zaxira sifatida
// ko'rinadi va "upload" deb belgilanadi (admin tekshiruvida ko'rinadi).
// Screenshot'ni to'liq bloklab bo'lmaydi, lekin kamera-orqali olish majburiy bo'lgani
// uchun ekrandagi tayyor rasmni to'g'ridan-to'g'ri yuborib bo'lmaydi.
export default function CameraCapture({ facingMode = "user", onCapture, initialPreview = null, aspectClass = "aspect-[4/3]" }) {
  const { t } = useT();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(initialPreview);
  const [method, setMethod] = useState(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
  }, []);

  const startStream = useCallback(async () => {
    setError("");
    setStarting(true);
    stopStream();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("no-device");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Camera start error:", err);
      setError(err?.name === "NotAllowedError" ? "permission" : "no-device");
    } finally {
      setStarting(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (!preview) startStream();
    else setStarting(false);
    return () => stopStream();
  }, [preview, startStream, stopStream]);

  const emit = useCallback((blob, previewUrl, captureMethod) => {
    setPreview(previewUrl);
    setMethod(captureMethod);
    stopStream();
    onCapture?.({ blob, previewUrl, method: captureMethod });
  }, [onCapture, stopStream]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    // Old kamera (selfie) — ko'zgu aksini to'g'rilaymiz
    if (facingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob((blob) => {
      if (!blob) return;
      emit(blob, URL.createObjectURL(blob), "camera");
    }, "image/jpeg", 0.85);
  }, [emit, facingMode]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("file-type");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("file-size");
      return;
    }
    setError("");
    emit(file, URL.createObjectURL(file), "upload");
  };

  const retake = () => {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setMethod(null);
    onCapture?.(null);
  };

  return (
    <div>
      {preview ? (
        <div>
          <div className={`relative rounded-xl overflow-hidden border border-border bg-black ${aspectClass}`}>
            <img src={preview} alt="capture" className="w-full h-full object-cover" />
          </div>
          {method === "upload" && (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {t("pages.register.kyc.uploadFallbackNote")}
            </p>
          )}
          <button onClick={retake}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-medium text-ink-2 hover:bg-surface transition-colors">
            <RefreshCw className="w-4 h-4" /> {t("pages.register.kyc.retake")}
          </button>
        </div>
      ) : (
        <div>
          <div className={`relative rounded-xl overflow-hidden border border-border bg-black ${aspectClass}`}>
            {starting ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <Camera className="w-8 h-8 text-white/40" />
                <p className="text-xs text-white/70">{t(`pages.register.kyc.cameraError.${error}`)}</p>
              </div>
            ) : (
              <video
                ref={videoRef} autoPlay playsInline muted
                className="w-full h-full object-cover"
                style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
              />
            )}
            {/* Markaziy ramka yo'naltirgich */}
            {!error && !starting && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className={`border-2 border-dashed border-white/60 rounded-xl ${facingMode === "user" ? "w-40 h-52" : "w-56 h-40"}`} />
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button onClick={takePhoto} disabled={!!error || starting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-40">
              <Camera className="w-4 h-4" /> {t("pages.register.kyc.takePhoto")}
            </button>
            <button onClick={() => fileRef.current?.click()} title={t("pages.register.kyc.uploadFromDevice")}
              className="w-11 h-11 flex items-center justify-center rounded-lg border border-border text-ink-2 hover:bg-surface transition-colors flex-shrink-0">
              <Upload className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFile} />
          </div>
          {error && error.startsWith("file") && (
            <p className="text-xs text-red-500 mt-2">{t(`pages.register.kyc.cameraError.${error}`)}</p>
          )}
        </div>
      )}
    </div>
  );
}
