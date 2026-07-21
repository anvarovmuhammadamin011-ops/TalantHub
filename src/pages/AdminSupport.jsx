import { useState, useEffect } from "react";
import { LifeBuoy, MessageSquare, CheckCircle2, X } from "lucide-react";
import { api } from "../lib/api";
import { useT } from "../context/I18nContext";

const STATUS_FILTERS = ["", "Ochiq", "Yopiq"];

export default function AdminSupport() {
  const { t } = useT();
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replying, setReplying] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const data = await api(`/admin/support?${params.toString()}`);
      setTickets(data.tickets);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openReply = (ticket) => {
    setReplying(ticket);
    setResponseText(ticket.response || "");
  };

  const submitReply = async (close) => {
    setUpdatingId(replying.id);
    try {
      await api(`/admin/support/${replying.id}`, {
        method: "PATCH",
        body: { response: responseText.trim(), status: close ? "Yopiq" : "Ochiq" },
      });
      setReplying(null);
      setResponseText("");
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const reopen = async (ticket) => {
    setUpdatingId(ticket.id);
    try {
      await api(`/admin/support/${ticket.id}`, { method: "PATCH", body: { status: "Ochiq" } });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">{t("common.retry")}</button></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-6">{t("pages.adminSupport.title")}</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === f ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"
            }`}>{f ? t(`status.${f}`) : t("common.all")}</button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border mb-4">
            <LifeBuoy className="w-6 h-6 text-ink-3" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-ink-3">{t("pages.adminSupport.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl border border-border shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-ink text-sm">{ticket.subject}</div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                      ticket.status === "Yopiq" ? "bg-success-soft text-success" : "bg-[#FEF3C7] text-[#B45309]"
                    }`}>{t(`status.${ticket.status}`)}</span>
                  </div>
                  <div className="text-xs text-ink-3 mt-1">{ticket.user_name} · {ticket.user_email}</div>
                  {!!ticket.message && <p className="text-sm text-ink-2 mt-2">{ticket.message}</p>}
                  {!!ticket.response && (
                    <div className="mt-3 pt-3 border-t border-border-soft">
                      <div className="text-[10px] font-medium text-ink-3 uppercase tracking-wide mb-1">{t("pages.adminSupport.yourResponseLabel")}</div>
                      <p className="text-sm text-ink-2">{ticket.response}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button onClick={() => openReply(ticket)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface text-ink-2 hover:bg-border-soft transition-colors flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> {ticket.response ? t("pages.adminSupport.editResponse") : t("pages.adminSupport.reply")}
                </button>
                {ticket.status === "Yopiq" && (
                  <button onClick={() => reopen(ticket)} disabled={updatingId === ticket.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FEF3C7] text-[#B45309] hover:opacity-80 transition-colors disabled:opacity-50">
                    {t("pages.adminSupport.reopen")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReplying(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-ink text-base">{replying.subject}</h3>
              <button onClick={() => setReplying(null)} className="text-ink-3 hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-ink-3 mb-4">{replying.user_name}</p>
            <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} rows={4}
              placeholder={t("pages.adminSupport.responsePlaceholder")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => submitReply(false)} disabled={!responseText.trim() || updatingId === replying.id}
                className="flex-1 py-2.5 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors disabled:opacity-50">
                {t("common.save")}
              </button>
              <button onClick={() => submitReply(true)} disabled={!responseText.trim() || updatingId === replying.id}
                className="flex-1 py-2.5 rounded-lg bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("pages.adminSupport.replyAndClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
