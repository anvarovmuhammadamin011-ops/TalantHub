import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { apiUpload } from "../../lib/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE = 2 * 1024 * 1024;

export default function ImageUploadField({ value, onChange, shape = "square", size = "w-20 h-20" }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Faqat JPG yoki PNG rasm yuklash mumkin");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Rasm hajmi 2MB dan oshmasligi kerak");
      return;
    }

    setUploading(true);
    try {
      const { url } = await apiUpload("/upload", file);
      onChange(url);
    } catch (err) {
      setError(err.message || "Yuklashda xatolik");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className={`${size} ${shape === "round" ? "rounded-full" : "rounded-xl"} bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0`}>
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-5 h-5 text-ink-3" strokeWidth={1.5} />
          )}
        </div>
        <div>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="px-3.5 py-2 rounded-lg border border-border text-xs font-medium text-ink-2 hover:bg-surface transition-colors disabled:opacity-50 inline-flex items-center gap-1.5">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Yuklanmoqda..." : "Rasm yuklash"}
          </button>
          <p className="text-[11px] text-ink-3 mt-1">JPG yoki PNG, max 2MB</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
