import { useState, useEffect } from "react";
import { Wallet as WalletIcon, CreditCard, Check } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";

function formatUZS(n) {
  return `${Number(n || 0).toLocaleString("ru-RU")} so'm`;
}

export default function Wallet() {
  const [data, setData] = useState(null);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [wallet, tariffData] = await Promise.all([api("/wallet/me"), api("/wallet/tariffs")]);
      setData(wallet);
      setTariffs(tariffData.tariffs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const subscribe = async (tariffId) => {
    setSubscribing(tariffId);
    setError("");
    try {
      await api("/wallet/subscribe", { method: "POST", body: { tariff_id: tariffId } });
      await load();
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-8">Hamyon</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-ink/5 rounded-xl flex items-center justify-center">
              <WalletIcon className="w-5 h-5 text-ink" strokeWidth={1.75} />
            </div>
            <span className="text-xs font-medium text-ink-3 uppercase tracking-wide">Balans</span>
          </div>
          <div className="text-2xl font-semibold text-ink mt-2">{formatUZS(data.balance)}</div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" strokeWidth={1.75} />
            </div>
            <span className="text-xs font-medium text-ink-3 uppercase tracking-wide">Faol tarif</span>
          </div>
          {data.active_tariff ? (
            <>
              <div className="text-lg font-semibold text-ink mt-2">{data.active_tariff.name}</div>
              <div className="text-xs text-ink-3 mt-0.5">Amal qilish muddati: {new Date(data.active_tariff.expires_at + "Z").toLocaleDateString("uz-UZ")}gacha</div>
            </>
          ) : (
            <div className="text-sm text-ink-3 mt-2">Faol tarif yo'q</div>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

      <h2 className="font-semibold text-ink text-sm mb-4">Tariflar</h2>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {tariffs.map((t) => {
          const isActive = data.active_tariff?.tariff_id === t.id || data.active_tariff?.name === t.name;
          return (
            <div key={t.id} className={`bg-white rounded-xl border p-6 ${isActive ? "border-ink" : "border-border"}`}>
              <div className="font-semibold text-ink text-base mb-1">{t.name}</div>
              <div className="text-xl font-semibold text-ink mb-1">{formatUZS(t.price)}</div>
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
                  isActive ? "bg-surface text-ink-3 cursor-default" : "bg-ink text-white hover:bg-ink/90 disabled:opacity-60"
                }`}
              >
                {isActive ? "Faol" : subscribing === t.id ? "Faollashtirilmoqda..." : "Faollashtirish"}
              </button>
            </div>
          );
        })}
      </div>

      <h2 className="font-semibold text-ink text-sm mb-4">To'lovlar tarixi</h2>
      {data.transactions.length === 0 ? (
        <p className="text-sm text-ink-3">Hozircha tranzaksiyalar yo'q</p>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-5 py-3">Tavsif</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-5 py-3">Usul</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-5 py-3">Sana</th>
                <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-5 py-3">Summa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {data.transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-5 py-3 text-sm text-ink">{tx.description || tx.type}</td>
                  <td className="px-5 py-3 text-sm text-ink-3">{tx.method}</td>
                  <td className="px-5 py-3 text-sm text-ink-3">{timeAgo(tx.created_at)}</td>
                  <td className={`px-5 py-3 text-sm font-medium text-right ${tx.amount < 0 ? "text-red-500" : "text-green-600"}`}>
                    {tx.amount > 0 ? "+" : ""}{formatUZS(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
