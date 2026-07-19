import { useState, useEffect } from "react";
import { Wallet as WalletIcon, Check, X, Crown, TrendingUp } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";

const TOPUP_PRESETS = [50000, 100000, 300000, 500000, 1000000];

function formatUZS(n) {
  return `${Number(n || 0).toLocaleString("ru-RU")} so'm`;
}

const TARIFF_ICON = { "TOP e'lon": TrendingUp, "Premium e'lon": Crown };

export default function Wallet() {
  const [data, setData] = useState(null);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [error, setError] = useState("");
  const [showTopup, setShowTopup] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    setError("");
    try {
      const [wallet, tariffData] = await Promise.all([api("/wallet/me"), api("/wallet/tariffs")]);
      setData(wallet);
      setTariffs(tariffData.tariffs);
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const subscribe = async (tariffId) => {
    setSubscribing(tariffId);
    setError("");
    try {
      await api("/wallet/subscribe", { method: "POST", body: { tariff_id: tariffId } });
      await load();
      setToast("Tarif faollashtirildi");
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setSubscribing(null);
    }
  };

  const topup = async (amount) => {
    setToppingUp(true);
    try {
      await api("/wallet/demo-topup", { method: "POST", body: { amount } });
      await load();
      setShowTopup(false);
      setToast("Balans to'ldirildi (demo)");
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setToppingUp(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  if (error && !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">Qayta urinish</button></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-8">Hamyon</h1>

      <div className="rounded-2xl p-6 sm:p-8 mb-8 text-white" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
        <div className="flex items-center gap-2 mb-2 opacity-90">
          <WalletIcon className="w-4 h-4" strokeWidth={1.75} />
          <span className="text-xs font-medium uppercase tracking-wide">Balans</span>
        </div>
        <div className="text-3xl sm:text-4xl font-semibold tracking-tight mb-5">{formatUZS(data.balance)}</div>
        <button onClick={() => setShowTopup(true)}
          className="px-5 py-2.5 rounded-lg bg-white text-accent text-sm font-medium hover:bg-white/90 transition-colors">
          Balansni to'ldirish
        </button>
      </div>

      {data.active_tariff && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-5 mb-8 flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-3 uppercase tracking-wide mb-0.5">Faol tarif</div>
            <div className="text-base font-semibold text-ink">{data.active_tariff.name}</div>
          </div>
          <div className="text-xs text-ink-3">{new Date(data.active_tariff.expires_at + "Z").toLocaleDateString("uz-UZ")}gacha</div>
        </div>
      )}

      {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

      <div className="mb-4">
        <h2 className="font-semibold text-ink text-sm">Tariflar</h2>
        <p className="text-xs text-ink-3 mt-0.5">Standart joylashtirish har doim bepul. Balans faqat vakansiyangizni ro'yxat boshida chiqarish (TOP) yoki alohida ajratib ko'rsatish (Premium) uchun kerak bo'ladi.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {tariffs.map((t) => {
          const isActive = data.active_tariff?.tariff_id === t.id || data.active_tariff?.name === t.name;
          const Icon = TARIFF_ICON[t.name];
          const isPremium = t.name === "Premium e'lon";
          return (
            <div key={t.id} className={`bg-white rounded-xl border shadow-sm p-6 ${isActive ? "border-accent ring-2 ring-accent/10" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className={`w-4 h-4 ${isPremium ? "text-[#8B5CF6]" : "text-accent"}`} />}
                <div className="font-semibold text-ink text-base">{t.name}</div>
              </div>
              <div className="text-xl font-semibold text-ink mb-1">{t.price === 0 ? "Bepul" : formatUZS(t.price)}</div>
              <div className="text-xs text-ink-3 mb-4">{t.duration_days} kunlik</div>
              <ul className="space-y-2 mb-5">
                {t.features.map((f) => (
                  <li key={f} className="text-xs text-ink-2 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(t.id)}
                disabled={isActive || subscribing === t.id}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-surface text-ink-3 cursor-default" : "bg-accent text-white hover:bg-accent-hover disabled:opacity-60"
                }`}
              >
                {isActive ? "Faol" : subscribing === t.id ? "Faollashtirilmoqda..." : "Tanlash"}
              </button>
            </div>
          );
        })}
      </div>

      <h2 className="font-semibold text-ink text-sm mb-4">To'lovlar tarixi</h2>
      {data.transactions.length === 0 ? (
        <p className="text-sm text-ink-3">Hozircha tranzaksiyalar yo'q</p>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-5 py-3">Sana</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-5 py-3">Tavsif</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-5 py-3">Holat</th>
                <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-5 py-3">Summa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {data.transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-5 py-3 text-sm text-ink-3 whitespace-nowrap" title={new Date(tx.created_at + "Z").toLocaleString("uz-UZ")}>{timeAgo(tx.created_at)}</td>
                  <td className="px-5 py-3 text-sm text-ink">{tx.description || tx.type}</td>
                  <td className="px-5 py-3 text-sm text-ink-3">{tx.status}</td>
                  <td className={`px-5 py-3 text-sm font-medium text-right whitespace-nowrap ${tx.amount < 0 ? "text-danger" : "text-success"}`}>
                    {tx.amount > 0 ? "+" : ""}{formatUZS(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTopup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => !toppingUp && setShowTopup(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-ink text-base">Balansni to'ldirish</h3>
              <button onClick={() => !toppingUp && setShowTopup(false)} className="p-1 text-ink-3 hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-ink-3 mb-5">Demo rejim — real to'lov amalga oshirilmaydi.</p>
            <div className="grid grid-cols-2 gap-2">
              {TOPUP_PRESETS.map((amount) => (
                <button key={amount} onClick={() => topup(amount)} disabled={toppingUp}
                  className="py-3 rounded-lg border border-border text-sm font-medium text-ink-2 hover:border-accent hover:text-accent transition-colors disabled:opacity-50">
                  {formatUZS(amount)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-ink text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
