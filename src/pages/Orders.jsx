import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package, Clock, CheckCircle, AlertCircle, Filter, ChevronDown, MessageSquare,
  Calendar, ArrowUpRight, BarChart3, TrendingUp, Star, Loader2
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

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
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const isEmployer = user?.role === "employer";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Zakazlar</h1>
          <p className="text-ink-3 text-sm mt-1">
            {isEmployer ? "Berilgan zakazlaringiz" : "Kelib tushgan zakazlaringiz"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Jami", value: stats.total, icon: Package, color: "bg-ink/5 text-ink" },
          { label: "Yangi", value: stats.new, icon: AlertCircle, color: "bg-blue-50 text-blue-600" },
          { label: "Jarayonda", value: stats.active, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
          { label: "Tugatilgan", value: stats.completed, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
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

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "Yangi", "Qabul qilindi", "Jarayonda", "Tugatildi", "Bekor qilindi"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"
            }`}>
            {f === "all" ? "Barchasi" : f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="text-center py-20 text-ink-3">Yuklanmoqda...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="font-semibold text-ink mb-1">Zakazlar topilmadi</h3>
          <p className="text-ink-3 text-sm">Hozircha bu turdagi zakazlar yo'q</p>
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
                          {order.status}
                        </span>
                        {order.priority && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityConfig[order.priority] || ""}`}>
                            {order.priority}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-ink whitespace-nowrap">{order.price}</span>
                    </div>
                    <p className="text-sm text-ink-3 mb-3 line-clamp-2">{order.description}</p>
                    <div className="flex items-center gap-4 text-xs text-ink-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Muddat: {order.deadline || "Belgilanmagan"}</span>
                      </div>
                      <span>{isEmployer ? order.specialist_name : order.employer_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {order.status === "Yangi" && !isEmployer && (
                      <button onClick={() => updateStatus(order.id, "Qabul qilindi")} disabled={updatingId === order.id}
                        className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60">
                        Qabul qilish
                      </button>
                    )}
                    {order.status === "Yangi" && isEmployer && (
                      <button onClick={() => updateStatus(order.id, "Bekor qilindi")} disabled={updatingId === order.id}
                        className="px-4 py-2 bg-red-50 text-red-500 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60">
                        Bekor qilish
                      </button>
                    )}
                    {order.status === "Qabul qilindi" && (
                      <button onClick={() => updateStatus(order.id, "Jarayonda")} disabled={updatingId === order.id}
                        className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-60">
                        Boshlash
                      </button>
                    )}
                    {order.status === "Jarayonda" && !isEmployer && (
                      <button onClick={() => updateStatus(order.id, "Tugatildi")} disabled={updatingId === order.id}
                        className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60">
                        Tugatish
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
    </div>
  );
}
