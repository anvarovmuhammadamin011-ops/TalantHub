import { useState, useRef, useCallback } from "react";
import { FileUp, X, Loader2 } from "lucide-react";
import { useT } from "../../context/I18nContext";
import { compressImage } from "../../lib/image";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Manzil hujjati kabi hujjatlar uchun oddiy fayl yuklash:
// screenshot ham, galereya rasmi ham bo'ladi — kamera shart emas.
export default function DocumentUpload({ onSelect, initialPreview = null }) {
  const { t } = useT();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(initialPreview);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t("pages.register.kyc.cameraError.file-type"));
      return;
    }
    setBusy(true);
    try {
      const blob = await compressImage(file);
      const previewUrl = URL.createObjectURL(blob);
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      setPreview(previewUrl);
      onSelect?.({ blob, previewUrl });
    } catch {
      setError(t("pages.register.kyc.docProcessError"));
    } finally {
      setBusy(false);
    }
  }, [onSelect, preview, t]);

  const remove = () => {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setError("");
    onSelect?.(null);
  };

  if (preview) {
    return (
      <div>
        <div className="relative rounded-xl overflow-hidden border border-border bg-surface">
          <img src={preview} alt="document" className="w-full max-h-64 object-contain" />
          <button onClick={remove}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button onClick={() => fileRef.current?.click()}
          className="mt-2 w-full py-2 rounded-lg border border-border text-xs font-medium text-ink-2 hover:bg-surface transition-colors">
          {t("pages.register.kyc.docChange")}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
        className={`w-full rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 text-center transition-colors ${
          dragging ? "border-ink bg-surface" : "border-border hover:border-ink/30"
        }`}>
        {busy ? (
          <Loader2 className="w-8 h-8 text-ink-3 animate-spin" />
        ) : (
          <FileUp className="w-8 h-8 text-ink-3" strokeWidth={1.5} />
        )}
        <span className="text-sm font-medium text-ink">{t("pages.register.kyc.docDropTitle")}</span>
        <span className="text-xs text-ink-3">{t("pages.register.kyc.docDropHint")}</span>
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
}
