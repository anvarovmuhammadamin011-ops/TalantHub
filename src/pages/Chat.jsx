import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, Calendar, Search, MoreVertical, Phone, Video, ArrowLeft, CheckCheck, Flag, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useT } from "../context/I18nContext";
import AiChatPanel from "../components/chat/AiChatPanel";

async function reportMessage(messageId, t) {
  const reason = prompt(t("pages.chat.reportReasonPrompt"));
  if (!reason || !reason.trim()) return;
  try {
    await api("/reports", { method: "POST", body: { target_type: "chat", target_id: messageId, reason: reason.trim() } });
    alert(t("pages.chat.reportSuccess"));
  } catch (err) {
    alert(err.message || t("common.error"));
  }
}

export default function Chat() {
  const { user } = useAuth();
  const showToast = useToast();
  const { t } = useT();
  const { sendMessage, joinChat, leaveChat, startTyping, stopTyping, onlineUsers, typingUsers } = useSocket();
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState([]);
  const [allChats, setAllChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [aiActive, setAiActive] = useState(searchParams.get("ai") === "1");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ date: "", time: "", note: "" });
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket } = useSocket();

  useEffect(() => {
    async function loadChats() {
      try {
        const data = await api("/chats");
        setChats(data.chats);
        setAllChats(data.chats);
        if (data.chats.length > 0) {
          setActiveChat(data.chats[0]);
        }
      } catch (err) {
        console.error("Chats load error:", err);
        showToast(err.message || t("pages.chat.loadChatsError"), "error");
      } finally {
        setLoading(false);
      }
    }
    loadChats();
  }, []);

  useEffect(() => {
    if (!chatSearch.trim()) {
      setChats(allChats);
    } else {
      const q = chatSearch.toLowerCase();
      setChats(allChats.filter((c) => (c.other_name || "").toLowerCase().includes(q)));
    }
  }, [chatSearch, allChats]);

  useEffect(() => {
    if (!activeChat) return;
    async function loadMessages() {
      try {
        const data = await api(`/chats/${activeChat.id}/messages`);
        setMessages(data.messages);
        joinChat(activeChat.id);
      } catch (err) {
        console.error("Messages load error:", err);
        showToast(err.message || t("pages.chat.loadMessagesError"), "error");
      }
    }
    loadMessages();
    return () => { if (activeChat) leaveChat(activeChat.id); };
  }, [activeChat?.id]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if (msg.chat_id === activeChat?.id) {
        setMessages((prev) => [...prev, msg]);
      }
      setChats((prev) => prev.map((c) =>
        c.id === msg.chat_id ? { ...c, last_message: msg.text, last_message_at: msg.created_at } : c
      ));
    };
    socket.on("new_message", handler);
    return () => socket.off("new_message", handler);
  }, [socket, activeChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !activeChat || sending) return;
    setSending(true);
    sendMessage(activeChat.id, newMessage.trim());
    setNewMessage("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stopTyping(activeChat.id);
    setTimeout(() => setSending(false), 300);
  }, [newMessage, activeChat, sending]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!activeChat) return;
    startTyping(activeChat.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(activeChat.id), 2000);
  };

  const getOtherName = (chat) => {
    if (chat.other_name) return chat.other_name;
    return t("pages.chat.defaultUserName");
  };

  const isOnline = (chat) => onlineUsers.has(chat.other_id);

  const isTyping = (chat) => typingUsers[`${chat.id}_${chat.other_id}`];

  const formatTime = (t) => {
    if (!t) return "";
    return t.slice(11, 16);
  };

  const selectChat = (chat) => {
    setActiveChat(chat);
    setAiActive(false);
    setShowMobileChat(true);
  };

  const selectAI = () => {
    setAiActive(true);
    setShowMobileChat(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-xl border border-border overflow-hidden h-[calc(100dvh-244px)] md:h-[calc(100dvh-144px)] min-h-[500px]">
        <div className="flex h-full">
          {/* Chat list */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col ${showMobileChat ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-ink text-sm mb-3">{t("nav.chat")}</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder={t("pages.chat.searchPlaceholder")}
                  value={chatSearch} onChange={(e) => setChatSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none transition-colors" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <button onClick={selectAI}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-accent-soft/60 transition-colors border-b border-border-soft ${
                  aiActive ? "bg-accent-soft/60 border-l-2 border-l-accent" : ""
                }`}>
                <div className="w-11 h-11 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-ink text-sm">{t("pages.chat.aiAssistant")}</span>
                  <p className="text-xs text-ink-3 truncate mt-0.5">{t("pages.chat.aiAssistantDesc")}</p>
                </div>
              </button>
              {loading && <div className="p-4 text-sm text-ink-3">{t("common.loading")}</div>}
              {!loading && chats.length === 0 && (
                <div className="p-6 text-center">
                  <div className="text-3xl mb-3">💬</div>
                  <p className="text-sm text-ink-3">{t("pages.chat.emptyChats")}</p>
                </div>
              )}
              {chats.map((chat) => (
                <button key={chat.id} onClick={() => selectChat(chat)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-surface transition-colors border-b border-border-soft ${
                    activeChat?.id === chat.id ? "bg-surface border-l-2 border-l-ink" : ""
                  }`}>
                  <div className="relative">
                    <div className="w-11 h-11 bg-surface rounded-full flex items-center justify-center text-lg flex-shrink-0 font-medium text-ink-2">
                      {getOtherName(chat).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    {isOnline(chat) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink text-sm truncate">{getOtherName(chat)}</span>
                      <span className="text-[10px] text-ink-3 flex-shrink-0">{formatTime(chat.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-ink-3 truncate mt-0.5">
                      {isTyping(chat) ? <span className="text-accent italic">{t("pages.chat.typing")}</span> : (chat.last_message || t("pages.chat.startChat"))}
                    </p>
                  </div>
                  {chat.unread_count > 0 && (
                    <span className="w-5 h-5 bg-ink text-white text-xs font-semibold rounded-full flex items-center justify-center flex-shrink-0">
                      {chat.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className={`flex flex-col flex-1 min-h-0 ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
            {aiActive ? (
              <>
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <button onClick={() => setShowMobileChat(false)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:bg-surface">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-ink text-sm">{t("pages.chat.aiAssistant")}</div>
                    <div className="text-xs text-ink-3">{t("pages.chat.aiAssistantSubtitle")}</div>
                  </div>
                </div>
                <AiChatPanel />
              </>
            ) : activeChat ? (
              <>
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowMobileChat(false)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:bg-surface">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-sm font-medium text-ink-2">
                        {getOtherName(activeChat).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      {isOnline(activeChat) && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white" />}
                    </div>
                    <div>
                      <div className="font-medium text-ink text-sm">{getOtherName(activeChat)}</div>
                      <div className={`text-xs font-medium ${isOnline(activeChat) ? "text-accent" : "text-ink-3"}`}>
                        {isOnline(activeChat) ? t("pages.chat.online") : t("pages.chat.offline")}
                      </div>
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

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`group flex items-end gap-1 ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                      {msg.sender_id !== user?.id && (
                        <button onClick={() => reportMessage(msg.id, t)} title={t("pages.chat.reportTooltip")}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md text-ink-3 hover:text-red-500 hover:bg-red-50 flex-shrink-0">
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                        msg.sender_id === user?.id
                          ? "bg-ink text-white rounded-br-md"
                          : "bg-surface text-ink rounded-bl-md"
                      }`}>
                        {msg.sender_id !== user?.id && (
                          <div className="text-xs font-medium text-ink-3 mb-1">{msg.sender_name}</div>
                        )}
                        <p className="text-sm">{msg.text}</p>
                        <div className={`flex items-center gap-1 text-[10px] mt-1 ${msg.sender_id === user?.id ? "text-white/50 justify-end" : "text-ink-3"}`}>
                          <span>{formatTime(msg.created_at)}</span>
                          {msg.sender_id === user?.id && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowSchedule(!showSchedule)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface text-ink-2 hover:bg-border-soft transition-colors">
                      <Calendar className="w-[18px] h-[18px]" />
                    </button>
                    <input type="text" placeholder={t("pages.chat.messagePlaceholder")} value={newMessage} onChange={handleTyping}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm" />
                    <button onClick={handleSend} disabled={sending || !newMessage.trim()}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-ink text-white hover:bg-ink/90 transition-colors disabled:opacity-40">
                      <Send className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                  {showSchedule && (
                    <div className="mt-3 bg-surface rounded-xl p-4">
                      <h4 className="font-medium text-ink text-sm mb-3">{t("pages.chat.scheduleInterview")}</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
                        <input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
                      </div>
                      <input type="text" placeholder={t("pages.chat.notePlaceholder")} value={scheduleForm.note}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, note: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none mb-3 bg-white" />
                      <button className="w-full py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
                        {t("pages.chat.sendProposal")}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border text-2xl mb-5">💬</div>
                  <h3 className="font-semibold text-ink text-sm mb-1.5">{t("pages.chat.selectChatTitle")}</h3>
                  <p className="text-ink-3 text-sm">{t("pages.chat.selectChatDesc")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
