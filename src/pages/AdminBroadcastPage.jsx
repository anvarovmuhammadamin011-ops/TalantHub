import { useState } from "react";
import { api } from "../lib/api";
import AdminHeader from "../components/admin/AdminHeader";
import { useT } from "../context/I18nContext";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-accent outline-none";

export default function AdminBroadcastPage() {
  const { t } = useT();
  const [form, setForm] = useState({ title: "", description: "", link: "", audience: "" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const send = async () => {
    if (!form.title.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const d = await api("/admin/broadcast", { method: "POST", body: form });
      setResult({ success: true, recipients: d.recipients });
      setForm({ title: "", description: "", link: "", audience: "" });
    } catch (err) {
      setResult({ success: false, error: err.message || t("common.error") });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <AdminHeader title={t("admin.broadcast")} />
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-xl">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-ink mb-4">{t("pages.adminBroadcast.subtitle")}</h2>
          <div className="space-y-3">
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={inputCls}>
              <option value="">{t("pages.adminBroadcast.audienceAll")}</option>
              <option value="specialist">{t("pages.adminBroadcast.audienceSpecialists")}</option>
              <option value="employer">{t("pages.adminBroadcast.audienceEmployers")}</option>
            </select>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("pages.adminBroadcast.titlePlaceholder")} className={inputCls} />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("pages.adminBroadcast.textPlaceholder")} rows={4} className={inputCls} />
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder={t("pages.adminBroadcast.linkPlaceholder")} className={inputCls} />
          </div>
          {result && (
            <p className={`text-sm mt-3 ${result.success ? "text-success" : "text-danger"}`}>
              {result.success ? t("pages.adminBroadcast.sentResult", { count: result.recipients }) : result.error}
            </p>
          )}
          <button
            onClick={send}
            disabled={sending || !form.title.trim()}
            className="mt-4 px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {sending ? t("pages.adminBroadcast.sending") : t("common.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
