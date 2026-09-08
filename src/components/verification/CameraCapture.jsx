import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, RefreshCw, Upload, AlertTriangle, SwitchCamera } from "lucide-react";
import { useT } from "../../context/I18nContext";

const MAX_SIDE = 1280;

// Jonli kameradan rasmga olish: old (selfie) va orqa kamera o'rtasida
// almashtirish tugmasi bor + avtomatik fallback (so'ralgan kamera topilmasa
// ikkinchisi, u ham bo'lmasa istalgan kamera ishga tushadi).
// Fayl input faqat kamera umuman bo'lmaganda zaxira sifatida ko'rinadi va
// "upload" deb belgilanadi (admin tekshiruvida ko'rinadi).
export default function CameraCapture({ facingMode = "user", onCapture, initialPreview = null, aspectClass = "aspect-[4/3]", cropFace = false }) {
  const { t } = useT();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(initialPreview);
  const [method, setMethod] = useState(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const [facing, setFacing] = useState(facingMode);
  const [hasMultiple, setHasMultiple] = useState(false);
  const facingRef = useRef(facingMode);
  facingRef.current = facing;

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
  }, []);

  const countCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setHasMultiple(devices.filter((d) => d.kind === "videoinput").length > 1);
    } catch { /* ignore */ }
  }, []);

  const startStream = useCallback(async (wantedFacing) => {
    setError("");
    setStarting(true);
    stopStream();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error("no-device"), { code: "no-device" });
      }
      const base = { width: { ideal: 1280 }, height: { ideal: 960 } };
      const other = wantedFacing === "user" ? "environment" : "user";
      // 1) aniq so'ralgan kamera → 2) qarama-qarshi kamera → 3) yumshoq so'rov → 4) istalgan kamera
      const attempts = [
        { ...base, facingMode: { exact: wantedFacing } },
        { ...base, facingMode: { exact: other } },
        { ...base, facingMode: wantedFacing },
        { ...base },
      ];
      let stream = null;
      let fatal = null;
      for (const vc of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: vc });
          break;
        } catch (e) {
          if (e?.name === "NotAllowedError" || e?.name === "SecurityError") { fatal = e; break; }
          // OverconstrainedError / NotFoundError → keyingi urinish
        }
      }
      if (fatal) throw fatal;
      if (!stream) throw Object.assign(new Error("no-device"), { code: "no-device" });

      streamRef.current = stream;
      // Amalda qaysi kamera ochilganini aniqlab, ko'zgu aksini shunga moslaymiz
      try {
        const realFacing = stream.getVideoTracks()[0]?.getSettings()?.facingMode;
        if (realFacing === "user" || realFacing === "environment") {
          setFacing(realFacing);
          facingRef.current = realFacing;
        }
      } catch { /* ignore */ }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      countCameras();
    } catch (err) {
      console.error("Camera start error:", err);
      setError(err?.name === "NotAllowedError" ? "permission" : "no-device");
    } finally {
      setStarting(false);
    }
  }, [stopStream, countCameras]);

  useEffect(() => {
    if (!preview) startStream(facingRef.current);
    else setStarting(false);
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  const switchCamera = useCallback(() => {
    const next = facingRef.current === "user" ? "environment" : "user";
    setFacing(next);
    facingRef.current = next;
    startStream(next);
  }, [startStream]);

  const emit = useCallback((blob, previewUrl, captureMethod) => {
    setPreview(previewUrl);
    setMethod(captureMethod);
    stopStream();
    onCapture?.({ blob, previewUrl, method: captureMethod });
  }, [onCapture, stopStream]);

  const takePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    // 1) To'liq kadrni olamiz
    const full = document.createElement("canvas");
    full.width = video.videoWidth;
    full.height = video.videoHeight;
    full.getContext("2d").drawImage(video, 0, 0);

    // 2) cropFace yoqilgan bo'lsa (selfie) — yuzni to'liq ajratib kesib olamiz
    let sx = 0, sy = 0, sw = full.width, sh = full.height;
    if (cropFace) {
      try {
        if (typeof FaceDetector !== "undefined") {
          const detector = new FaceDetector({ fastMode: false, maxDetectedFaces: 3 });
          const faces = await detector.detect(full);
          if (faces && faces.length > 0) {
            let box = faces[0].boundingBox;
            let bestArea = box.width * box.height;
            for (const f of faces) {
              const b = f.boundingBox;
              const area = b.width * b.height;
              if (area > bestArea) { box = b; bestArea = area; }
            }
            const pad = 0.3;
            const pw = box.width * pad, ph = box.height * pad;
            sx = Math.max(0, Math.round(box.x - pw));
            sy = Math.max(0, Math.round(box.y - ph));
            sw = Math.min(full.width - sx, Math.round(box.width + pw * 2));
            sh = Math.min(full.height - sy, Math.round(box.height + ph * 2));
          }
        }
      } catch { /* yuz topilmasa — to'liq kadr saqlanadi */ }
    }

    // 3) Masshtab + ko'zgu tuzatish + JPEG
    const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * scale));
    const h = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    // Old kamera (selfie) — ko'zgu aksini to'g'rilaymiz
    if (facingRef.current === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(full, sx, sy, sw, sh, 0, 0, w, h);
    canvas.toBlob((blob) => {
      if (!blob) return;
      emit(blob, URL.createObjectURL(blob), "camera");
    }, "image/jpeg", 0.85);
  }, [emit, cropFace]);

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

  const isFront = facing === "user";

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
                style={isFront ? { transform: "scaleX(-1)" } : undefined}
              />
            )}
            {/* Markaziy yo'naltirgich: selfie uchun dumaloq, hujjat uchun to'rtburchak */}
            {!error && !starting && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {isFront ? (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-[3px] border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                ) : (
                  <div className="w-56 h-40 border-2 border-dashed border-white/60 rounded-xl" />
                )}
              </div>
            )}
            {/* Old/orqa kamera almashtirish */}
            {!error && !starting && hasMultiple && (
              <button onClick={switchCamera} title={t("pages.register.kyc.switchCamera")}
                className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors">
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button onClick={takePhoto} disabled={!!error || starting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-40">
              <Camera className="w-4 h-4" /> {t("pages.register.kyc.takePhoto")}
            </button>
            {hasMultiple && !error && (
              <button onClick={switchCamera} title={t("pages.register.kyc.switchCamera")}
                className="w-11 h-11 flex items-center justify-center rounded-lg border border-border text-ink-2 hover:bg-surface transition-colors flex-shrink-0">
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
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
