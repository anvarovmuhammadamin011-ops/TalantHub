import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Briefcase, Award, Clock, Send, Package, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import VerifiedBadge from "../components/ui/VerifiedBadge";

export default function SpecialistDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [specialist, setSpecialist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({ title: "", description: "", price: "", deadline: "", priority: "O'rta" });
  const [orderSaving, setOrderSaving] = useState(false);

  const isEmployer = user?.role === "employer";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { specialist } = await api(`/specialists/${id}`);
        setSpecialist(specialist);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const startChat = async () => {
    setCreating(true);
    try {
      await api("/chats/create", { method: "POST", body: { user_id: Number(id) } });
      window.location.href = "/chat";
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const submitOrder = async () => {
    if (!orderForm.title.trim()) return;
    setOrderSaving(true);
    try {
      await api("/orders", {
        method: "POST",
        body: { specialist_id: Number(id), ...orderForm },
      });
      setShowOrderModal(false);
      setOrderForm({ title: "", description: "", price: "", deadline: "", priority: "O'rta" });
    } catch (err) {
      console.error(err);
    } finally {
      setOrderSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  if (!specialist) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Mutaxassis topilmadi</div>;
  }

  const initials = specialist.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/specialists" className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-6 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mutaxassislar
      </Link>

      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <div className="h-24 bg-gradient-to-r from-ink via-ink/80 to-ink/60" />
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-10 left-6">
            {specialist.avatar ? (
              <img src={specialist.avatar} alt={specialist.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-20 h-20 bg-ink rounded-2xl flex items-center justify-center border-4 border-white shadow-md">
                <span className="text-white text-xl font-bold">{initials}</span>
              </div>
            )}
          </div>
          <div className="pt-14 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-ink tracking-tight">{specialist.name}</h1>
                {!!specialist.verified && <VerifiedBadge />}
                {!!specialist.online && (
                  <span className="flex items-center gap-1 text-xs text-accent font-medium bg-accent-soft px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" /> Online
                  </span>
                )}
              </div>
              <p className="text-ink-2 font-medium mt-0.5 text-sm">{specialist.category}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-ink-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {specialist.city}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {specialist.experience}</span>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-ink fill-ink" /> {specialist.rating} ({specialist.reviews_count})</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={startChat} disabled={creating}
                className="h-9 px-4 flex items-center gap-1.5 rounded-lg bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60">
                <Send className="w-3.5 h-3.5" /> {creating ? "..." : "Xabar yozish"}
              </button>
              {isEmployer && (
                <button onClick={() => setShowOrderModal(true)}
                  className="h-9 px-4 flex items-center gap-1.5 rounded-lg border border-accent text-accent text-sm font-medium hover:bg-accent-soft transition-colors">
                  <Package className="w-3.5 h-3.5" /> Yollash
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-ink text-sm mb-3">O'zi haqida</h3>
            <p className="text-ink-2 text-sm leading-relaxed">{specialist.bio || "Ma'lumot kiritilmagan"}</p>
          </div>

          {specialist.skills?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-semibold text-ink text-sm mb-3">Ko'nikmalar</h3>
              <div className="flex flex-wrap gap-2">
                {specialist.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-surface text-ink rounded-lg text-sm font-medium border border-border">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {specialist.timeline?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-semibold text-ink text-sm mb-4">Tajriba</h3>
              {specialist.timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1 ${i === 0 ? "bg-accent ring-4 ring-accent/10" : "bg-border"}`} />
                    {i < specialist.timeline.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                  </div>
                  <div className="pb-6">
                    <div className="text-xs text-ink-3 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.period || item.year}</div>
                    <div className="font-semibold text-ink text-sm">{item.role || item.title}</div>
                    <div className="text-sm text-ink-2">{item.company || item.place}</div>
                    {item.description || item.desc ? (
                      <p className="text-xs text-ink-3 mt-2 leading-relaxed max-w-md">{item.description || item.desc}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Kutilayotgan maosh", value: specialist.salary || "—" },
                { label: "Soatlik to'lov", value: specialist.hourly_price || "—" },
                { label: "Tajriba darajasi", value: specialist.experience_level },
                { label: "Buyurtmalar", value: specialist.orders_count },
              ].map((item) => (
                <div key={item.label} className="bg-surface rounded-xl p-3">
                  <div className="text-xs text-ink-3 mb-1">{item.label}</div>
                  <div className="font-semibold text-ink text-sm">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {specialist.certificates?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-ink text-sm mb-3">Sertifikatlar</h3>
              <div className="space-y-3">
                {specialist.certificates.map((cert, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0"><Award className="w-4 h-4 text-ink-2" /></div>
                    <div><div className="text-sm font-medium text-ink">{cert.name}</div><div className="text-xs text-ink-3">{cert.year}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(specialist.social_telegram || specialist.social_instagram || specialist.social_github) && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-ink text-sm mb-3">Ijtimoiy tarmoqlar</h3>
              <div className="space-y-2 text-sm text-ink-2">
                {specialist.social_telegram && <div>{specialist.social_telegram}</div>}
                {specialist.social_instagram && <div>{specialist.social_instagram}</div>}
                {specialist.social_github && <div>{specialist.social_github}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowOrderModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink text-lg">Buyurtma berish</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-1 hover:bg-surface rounded-lg"><X className="w-5 h-5 text-ink-3" /></button>
            </div>
            <p className="text-sm text-ink-3 mb-4">{specialist.name} uchun buyurtma</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-3 mb-1">Sarlavha *</label>
                <input value={orderForm.title} onChange={(e) => setOrderForm({ ...orderForm, title: e.target.value })}
                  placeholder="Buyurtma nomi"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-3 mb-1">Tavsif</label>
                <textarea value={orderForm.description} onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })} rows={3}
                  placeholder="Batafsil..."
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-3 mb-1">Narx</label>
                  <input value={orderForm.price} onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                    placeholder="masalan: $200"
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-3 mb-1">Muddat</label>
                  <input type="date" value={orderForm.deadline} onChange={(e) => setOrderForm({ ...orderForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-3 mb-1">Muhimlik</label>
                <div className="flex gap-2">
                  {["Past", "O'rta", "Yuqori"].map((p) => (
                    <button key={p} onClick={() => setOrderForm({ ...orderForm, priority: p })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        orderForm.priority === p ? "bg-ink text-white border-ink" : "bg-white text-ink-2 border-border"
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowOrderModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
                Bekor qilish
              </button>
              <button onClick={submitOrder} disabled={orderSaving || !orderForm.title.trim()}
                className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60">
                {orderSaving ? "Yuborilmoqda..." : "Yuborish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
