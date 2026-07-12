import { useState, useEffect } from "react";
import { Send, Calendar, Search, MoreVertical, Phone, Video } from "lucide-react";
import { chats as mockChats } from "../data/mockData";

export default function Chat() {
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ date: "", time: "", note: "" });

  useEffect(() => {
    setChats(mockChats);
    if (mockChats[0]) setActiveChat(mockChats[0]);
    setChatsLoading(false);
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    setMessages(activeChat.messages || []);
  }, [activeChat]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChat || sending) return;
    setSending(true);
    try {
      const newMsg = {
        id: Date.now(),
        sender: "me",
        text: newMessage.trim(),
        time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-xl border border-border overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        <div className="flex h-full">
          {/* Chat list */}
          <div className="w-full md:w-80 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-ink text-sm mb-3">Xabarlar</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Suhbat qidirish..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chatsLoading && (
                <div className="p-4 text-sm text-ink-3">Yuklanmoqda...</div>
              )}
              {!chatsLoading && chats.length === 0 && (
                <div className="p-4 text-sm text-ink-3">Hozircha suhbatlar yo'q</div>
              )}
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-surface transition-colors border-b border-border-soft ${
                    activeChat?.id === chat.id ? "bg-surface border-l-2 border-l-ink" : ""
                  }`}
                >
                  <div className="w-11 h-11 bg-surface rounded-full flex items-center justify-center text-xl flex-shrink-0">
                    {chat.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink text-sm truncate">{chat.name}</span>
                    </div>
                    <p className="text-xs text-ink-3 truncate mt-0.5">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <span className="w-5 h-5 bg-ink text-white text-xs font-semibold rounded-full flex items-center justify-center flex-shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className="hidden md:flex flex-col flex-1">
            {activeChat ? (
              <>
                {/* Chat header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-xl">
                      {activeChat.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-ink text-sm">{activeChat.name}</div>
                      <div className="text-xs text-accent font-medium">Onlayn</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-3 hover:bg-surface transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-3 hover:bg-surface transition-colors">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-3 hover:bg-surface transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                        msg.sender === "me"
                          ? "bg-ink text-white rounded-br-md"
                          : "bg-surface text-ink rounded-bl-md"
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <div className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-white/50" : "text-ink-3"}`}>
                          {msg.created_at?.slice(11, 16) || msg.created_at}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSchedule(!showSchedule)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface text-ink-2 hover:bg-border-soft transition-colors"
                    >
                      <Calendar className="w-[18px] h-[18px]" />
                    </button>
                    <input
                      type="text"
                      placeholder="Xabar yozing..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-ink text-white hover:bg-ink/90 transition-colors disabled:opacity-60"
                    >
                      <Send className="w-[18px] h-[18px]" />
                    </button>
                  </div>

                  {/* Schedule panel */}
                  {showSchedule && (
                    <div className="mt-3 bg-surface rounded-xl p-4">
                      <h4 className="font-medium text-ink text-sm mb-3">Intervyu taklif qilish</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="date"
                          value={scheduleForm.date}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white"
                        />
                        <input
                          type="time"
                          value={scheduleForm.time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Izoh (ixtiyoriy)"
                        value={scheduleForm.note}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, note: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none mb-3 bg-white"
                      />
                      <button className="w-full py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
                        Taklif yuborish
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border text-2xl mb-5">💬</div>
                  <h3 className="font-semibold text-ink text-sm mb-1.5">Suhbatni tanlang</h3>
                  <p className="text-ink-3 text-sm">Chap tomondagi suhbatlar ro'yxatidan birini tanlang</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
