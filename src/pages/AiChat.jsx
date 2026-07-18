import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, Sparkles, Bot, MapPin, Star, Briefcase } from "lucide-react";
import { generateGreeting } from "../lib/aiSearch";
import { api } from "../lib/api";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import StatusBadge from "../components/ui/StatusBadge";

const suggestions = [
  "React dasturchi kerak",
  "5 yillik tajribaga ega UI/UX dizayner",
  "Toshkentda ingliz tili o'qituvchisi",
  "Senior Python developer, masofaviy",
];

export default function AiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setMessages([{ id: 0, role: "ai", text: generateGreeting(), specialists: [] }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: msg }]);
    setIsTyping(true);
    try {
      const response = await api("/ai/search-specialists", { method: "POST", body: { query: msg } });
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: response.text, specialists: response.specialists || [] }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: "Kechirasiz, so'rovni qayta ishlashda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring.", specialists: [] }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100dvh-128px)] md:h-[calc(100dvh-96px)]">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
        <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-ink text-sm">AI Kadrlar yordamchisi</h1>
          <p className="text-xs text-ink-3">Qanday mutaxassis kerakligini yozing — men topib beraman</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pb-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="bg-ink text-white px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%] text-sm">{msg.text}</div>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-ink/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-ink" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink leading-relaxed whitespace-pre-line">{msg.text}</div>
                  {msg.specialists && msg.specialists.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {msg.specialists.map((s) => (
                        <Link key={s.id} to={`/specialists/${s.id}`} className="block bg-white rounded-xl border border-border p-4 hover:border-ink/20 hover:shadow-sm transition-all">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">{s.name.split(" ").map((n) => n[0]).join("")}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-semibold text-ink text-sm">{s.name}</h3>
                                {!!s.verified && <VerifiedBadge size="sm" />}
                              </div>
                              <p className="text-xs text-ink-2 mt-0.5">{s.category}</p>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-3">
                                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-ink fill-ink" /> {s.rating}</span>
                                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {s.experience}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.city}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                <StatusBadge status={s.experience_level} />
                                {(s.skills || []).slice(0, 3).map((tag) => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-surface text-ink-3 rounded text-[10px] font-medium">{tag}</span>
                                ))}
                              </div>
                              {s.matchReasons && s.matchReasons.length > 0 && (
                                <div className="mt-2 text-[11px] text-accent font-medium">✓ {s.matchReasons.slice(0, 3).join(" · ")}</div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-ink/10 rounded-lg flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-ink" /></div>
            <div className="bg-surface rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-ink-3 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-ink-3 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-ink-3 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s) => (
            <button key={s} onClick={() => handleSend(s)}
              className="px-3 py-1.5 bg-surface border border-border rounded-full text-xs text-ink-2 hover:border-ink/30 hover:text-ink transition-colors">{s}</button>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Qanday mutaxassis kerak?" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1 px-4 py-3 bg-surface rounded-xl border border-border focus:border-ink/30 outline-none transition-colors text-sm" />
          <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-ink text-white hover:bg-ink/90 transition-colors disabled:opacity-40">
            <Send className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
