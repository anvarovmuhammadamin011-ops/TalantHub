import { useState, useEffect } from "react";
import { Wallet, TrendingUp, RotateCcw, CreditCard, Search } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";
import { useT } from "../context/I18nContext";

const STATUS_OPTIONS = ["", "Tasdiqlangan", "Kutilmoqda", "Qaytarildi"];

function formatUZS(n) {
  return `${Number(n || 0).toLocaleString("ru-RU")} so'm`;
}

export default function AdminFinance() {
  const { t } = useT();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const p = new URLSearchParams({ limit: "50" });
      if (search) p.set("search", search);
      if (statusFilter) p.set("status", statusFilter);
      const [statsData, txData] = await Promise.all([
        api("/admin/finance/stats"),
        api(`/admin/finance/transactions?${p.toString()}`),
      ]);
      setStats(statsData);
      setTransactions(txData.transactions);
      setTotal(txData.total);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const refund = async (tx) => {
    if (!confirm(t("pages.adminFinance.confirmRefund", { amount: formatUZS(tx.amount), description: tx.description }))) return;
    setRefundingId(tx.id);
    try {
      await api(`/admin/finance/transactions/${tx.id}/refund`, { method: "POST" });
      setTransactions((prev) => prev.map((row) => row.id === tx.id ? { ...row, status: "Qaytarildi", refund: row.amount } : row));
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setRefundingId(null);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  if (error && !stats) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">{t("common.retry")}</button></div>
      </div>
    );
  }

  const cards = [
    { label: t("pages.adminFinance.cardRevenue"), value: formatUZS(stats.revenue), icon: TrendingUp, color: "bg-success-soft text-success" },
    { label: t("pages.adminFinance.cardRefunded"), value: formatUZS(stats.refunded), icon: RotateCcw, color: "bg-danger-soft text-danger" },
    { label: t("pages.adminFinance.cardTopups"), value: formatUZS(stats.topups), icon: Wallet, color: "bg-accent-soft text-accent" },
    { label: t("pages.adminFinance.cardActiveTariffs"), value: stats.activeTariffs, icon: CreditCard, color: "bg-surface text-ink" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-6">{t("pages.adminFinance.title")}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-border shadow-sm p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-semibold text-ink">{c.value}</div>
            <div className="text-xs text-ink-3 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-ink text-sm mb-4">{t("pages.adminFinance.revenueChartTitle")}</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.revenue_30d_series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(d) => d.slice(5)} interval={4} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} formatter={(v) => formatUZS(v)} />
              <Line type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.tariffSales.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-5 mb-6">
          <h2 className="font-semibold text-ink text-sm mb-4">{t("pages.adminFinance.tariffSalesTitle")}</h2>
          <div className="space-y-2">
            {stats.tariffSales.map((ts) => (
              <div key={ts.name} className="flex items-center justify-between text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                <span className="text-ink-2">{ts.name}</span>
                <span className="text-ink-3">{t("pages.adminFinance.salesSummary", { count: ts.sales, revenue: formatUZS(ts.revenue) })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("pages.adminFinance.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none bg-white" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-accent outline-none">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? t(`status.${s}`) : t("pages.adminFinance.allStatuses")}</option>)}
        </select>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-16 text-ink-3 text-sm">{t("pages.adminFinance.noTransactions")}</div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">{t("pages.adminFinance.colUser")}</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">{t("pages.adminFinance.colDescription")}</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">{t("pages.adminFinance.colMethod")}</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">{t("common.status")}</th>
                  <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">{t("pages.adminFinance.colAmount")}</th>
                  <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 text-sm text-ink-2">
                      <div>{tx.user_name || "—"}</div>
                      <div className="text-xs text-ink-3">{timeAgo(tx.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-2">{tx.description || tx.type}</td>
                    <td className="px-4 py-3 text-sm text-ink-3 hidden sm:table-cell">{tx.method}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        tx.status === "Tasdiqlangan" ? "bg-success-soft text-success" : tx.status === "Qaytarildi" ? "bg-danger-soft text-danger" : "bg-[#FEF3C7] text-[#B45309]"
                      }`}>{t(`status.${tx.status}`)}</span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${tx.amount < 0 ? "text-danger" : "text-success"}`}>
                      {tx.amount > 0 ? "+" : ""}{formatUZS(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tx.status === "Tasdiqlangan" && tx.amount > 0 && (
                        <button onClick={() => refund(tx)} disabled={refundingId === tx.id}
                          className="text-xs font-medium text-danger hover:underline disabled:opacity-50">
                          {t("pages.adminFinance.refund")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border text-xs text-ink-3">{t("pages.adminFinance.transactionsCount", { count: total })}</div>
        </div>
      )}
    </div>
  );
}
