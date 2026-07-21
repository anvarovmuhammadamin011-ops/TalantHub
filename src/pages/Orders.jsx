import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package, Clock, CheckCircle, AlertCircle, Filter, ChevronDown, MessageSquare,
  Calendar, ArrowUpRight, BarChart3, TrendingUp, Star, Loader2, Flag, X
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useT } from "../context/I18nContext";

const statusConfig = {
  "Yangi": { color: "bg-blue-50 text-blue-600", dot: "bg-blue-500", icon: AlertCircle },
  "Qabul qilindi": { color: "bg-amber-50 text-amber-600", dot: "bg-amber-500", icon: CheckCircle },
  "Jarayonda": { color: "bg-purple-50 text-purple-600", dot: "bg-purple-500", icon: Loader2 },
  "Tugatildi": { color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500", icon: CheckCircle },
  "Bekor qilindi": { color: "bg-red-50 text-red-600", dot: "bg-red-500", icon: AlertCircle },
};

const priorityConfig = {
  "Yuqori": "text-red-500 bg-red-50",
  "O'rta": "text-amber-600 bg-amber-50",
  "Past": "text-emerald-600 bg-emerald-50",
};

export default function Orders() {
  const { user } = useAuth();
  const showToast = useToast();
  const { t } = useT();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [ratingModal, setRatingModal] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingText, setRatingText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [disputeModal, setDisputeModal] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api("/orders");
      setOrders(data.orders);
      setStats(data.stats);
    } catch (err) {
      console.error(err);
      showToast(err.message || t("pages.orders.loadError"), "error");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api(`/orders/${id}/status`, { method: "PATCH", body: { status } });
      await loadOrders();
    } catch (err) {
      console.error(err);
      showToast(err.message || t("pages.orders.statusUpdateError"), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const submitRating = async () => {
    if (!ratingValue || !ratingModal) return;
    setSubmittingRating(true);
    try {
      await api(`/orders/${ratingModal.id}/rate`, {
        method: "PATCH",
        body: { rating: ratingValue, review: ratingText, role: isEmployer ? "employer" : "specialist" },
      });
      setRatingModal(null);
      setRatingValue(0);
      setRatingText("");
      await loadOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRating(false);
    }
  };

  const submitDispute = async () => {
    if (!disputeReason.trim() || !disputeModal) return;
    setSubmittingDispute(true);
    try {
      await api(`/orders/${disputeModal.id}/dispute`, { method: "POST", body: { reason: disputeReason.trim() } });
      setDisputeModal(null);
      setDisputeReason("");
      showToast(t("pages.orders.disputeOpened"), "success");
    } catch (err) {
      showToast(err.message || t("common.error"), "error");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const isEmployer = user?.role === "employer";

  const priorityLabels = {
    "Yuqori": t("pages.orders.priorityHigh"),
    "O'rta": t("pages.orders.priorityMedium"),
    "Past": t("pages.orders.priorityLow"),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{t("pages.orders.title")}</h1>
          <p className="text-ink-3 text-sm mt-1">
            {isEmployer ? t("pages.orders.subtitleEmployer") : t("pages.orders.subtitleSpecialist")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: t("pages.orders.statTotal"), value: stats.total, icon: Package, color: "bg-ink/5 text-ink" },
          { label: t("status.Yangi"), value: stats.new, icon: AlertCircle, color: "bg-blue-50 text-blue-600" },
          { label: t("status.Jarayonda"), value: stats.active, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
          { label: t("status.Tugatildi"), value: stats.completed, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-[18px] h-[18px]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-ink">{s.value || 0}</div>
            <div className="text-xs text-ink-3 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "Yangi", "Qabul qilindi", "Jarayonda", "Tugatildi", "Bekor qilindi"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"
            }`}>
            {f === "all" ? t("common.all") : t(`status.${f}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-ink-3">{t("common.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="font-semibold text-ink mb-1">{t("pages.orders.emptyTitle")}</h3>
          <p className="text-ink-3 text-sm">{t("pages.orders.emptyDesc")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const sc = statusConfig[order.status] || statusConfig["Yangi"];
            const StatusIcon = sc.icon;
            return (
              <div key={order.id} className="bg-white rounded-xl border border-border p-5 hover:border-ink/10 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-ink text-sm">{order.title}</h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.color}`}>
                          {t(`status.${order.status}`)}
                        </span>
                        {order.priority && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityConfig[order.priority] || ""}`}>
                            {priorityLabels[order.priority] || order.priority}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-ink whitespace-nowrap">{order.price}</span>
                    </div>
                    <p className="text-sm text-ink-3 mb-3 line-clamp-2">{order.description}</p>
                    <div className="flex items-center gap-4 text-xs text-ink-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{t("pages.orders.deadline", { deadline: order.deadline || t("pages.orders.notSet") })}</span>
                      </div>
                      <span>{isEmployer ? order.specialist_name : order.employer_name}</span>
                      {order.rating > 0 && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-500" /> {order.rating}
                        </span>
                      )}
                      {order.specialist_rating > 0 && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-500" /> {order.specialist_rating} {t("pages.orders.yourRating")}
                        </span>
                      )}
                    </div>
                    {order.review && (
                      <p className="text-xs text-ink-3 mt-2 italic">"{order.review}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {order.status === "Yangi" && !isEmployer && (
                      <button onClick={() => updateStatus(order.id, "Qabul qilindi")} disabled={updatingId === order.id}
                        className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60">
                        {t("pages.orders.accept")}
                      </button>
                    )}
                    {order.status === "Yangi" && isEmployer && (
                      <button onClick={() => updateStatus(order.id, "Bekor qilindi")} disabled={updatingId === order.id}
                        className="px-4 py-2 bg-red-50 text-red-500 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60">
                        {t("common.cancel")}
                      </button>
                    )}
                    {order.status === "Qabul qilindi" && (
                      <button onClick={() => updateStatus(order.id, "Jarayonda")} disabled={updatingId === order.id}
                        className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-60">
                        {t("pages.orders.start")}
                      </button>
                    )}
                    {order.status === "Jarayonda" && !isEmployer && (
                      <button onClick={() => updateStatus(order.id, "Tugatildi")} disabled={updatingId === order.id}
                        className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60">
                        {t("pages.orders.finish")}
                      </button>
                    )}
                    {order.status === "Tugatildi" && isEmployer && !order.rating && (
                      <button onClick={() => { setRatingModal(order); setRatingValue(0); setRatingText(""); }}
                        className="px-4 py-2 bg-amber-50 text-amber-600 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1">
                        <Star className="w-4 h-4" /> {t("pages.orders.rate")}
                      </button>
                    )}
                    {order.status === "Tugatildi" && !isEmployer && !order.specialist_rating && (
                      <button onClick={() => { setRatingModal(order); setRatingValue(0); setRatingText(""); }}
                        className="px-4 py-2 bg-amber-50 text-amber-600 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1">
                        <Star className="w-4 h-4" /> {t("pages.orders.rateEmployer")}
                      </button>
                    )}
                    {(order.status === "Qabul qilindi" || order.status === "Jarayonda") && (
                      <button onClick={() => { setDisputeModal(order); setDisputeReason(""); }}
                        title={t("pages.orders.disputeOpen")}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface text-ink-2 hover:bg-danger-soft hover:text-danger transition-colors">
                        <Flag className="w-4 h-4" />
                      </button>
                    )}
                    <Link to="/chat" className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface text-ink-2 hover:bg-border-soft transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ratingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setRatingModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-ink text-lg mb-1">{t("pages.orders.rate")}</h3>
            <p className="text-sm text-ink-3 mb-4">
              {isEmployer
                ? t("pages.orders.ratingDescEmployer", { title: ratingModal.title })
                : t("pages.orders.ratingDescSpecialist", { name: ratingModal.employer_name })}
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onMouseEnter={() => setRatingHover(star)} onMouseLeave={() => setRatingHover(0)}
                  onClick={() => setRatingValue(star)}
                  className="transition-transform hover:scale-110">
                  <Star className={`w-8 h-8 ${(ratingHover || ratingValue) >= star ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                </button>
              ))}
            </div>
            <textarea value={ratingText} onChange={(e) => setRatingText(e.target.value)}
              placeholder={t("pages.orders.commentPlaceholder")} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setRatingModal(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={submitRating} disabled={!ratingValue || submittingRating}
                className="flex-1 px-4 py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60">
                {submittingRating ? t("pages.orders.submitting") : t("common.submit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {disputeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDisputeModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-ink text-lg">{t("pages.orders.disputeOpen")}</h3>
              <button onClick={() => setDisputeModal(null)} className="text-ink-3 hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-ink-3 mb-4">{t("pages.orders.disputeDesc", { title: disputeModal.title })}</p>
            <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
              placeholder={t("pages.orders.disputeReasonPlaceholder")} rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-danger/40 outline-none resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setDisputeModal(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={submitDispute} disabled={!disputeReason.trim() || submittingDispute}
                className="flex-1 px-4 py-2.5 bg-danger text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-60">
                {submittingDispute ? t("pages.orders.submitting") : t("pages.orders.disputeOpen")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
