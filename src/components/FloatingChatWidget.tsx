import React, { useState, useEffect, useRef } from "react";
import { User, Campaign } from "../types";
import { getDbCampaigns, getDbUsers, db } from "../utils";
import { MessageSquare, Send, X, ChevronLeft, User as UserIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FloatingChatWidgetProps {
  currentUser: User;
}

export default function FloatingChatWidget({ currentUser }: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChatCampaignId, setSelectedChatCampaignId] = useState<string | null>(null);
  const [selectedChatPartnerId, setSelectedChatPartnerId] = useState<string | null>(null);
  const [selectedChatPartnerName, setSelectedChatPartnerName] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for global open-chat-thread events
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{
        campaignId: string;
        partnerId: string;
        partnerName: string;
      }>;
      if (customEvent.detail) {
        const { campaignId, partnerId, partnerName } = customEvent.detail;
        setSelectedChatCampaignId(campaignId);
        setSelectedChatPartnerId(partnerId);
        setSelectedChatPartnerName(partnerName);
        setIsOpen(true);
      }
    };

    window.addEventListener("open-chat-thread", handleOpenChat);
    return () => window.removeEventListener("open-chat-thread", handleOpenChat);
  }, []);

  // Poll for new messages and update unread count & threads
  useEffect(() => {
    const updateChatState = () => {
      // 1. Calculate unread count
      setUnreadCount(db.chats.unreadCount(currentUser.id));

      // 2. Resolve chat threads/matches based on role
      const allCampaigns = getDbCampaigns();
      const allUsers = getDbUsers();

      let resolvedThreads: any[] = [];

      if (currentUser.role === "umkm") {
        // UMKM looks for active collaborations in their campaigns
        const myCampaigns = allCampaigns.filter(c => c.umkmId === currentUser.id);
        resolvedThreads = myCampaigns.flatMap(camp => {
          return camp.influencers
            .filter(inf => inf.status !== "applied" && inf.status !== "invited")
            .map(inf => {
              const influencerDetail = allUsers.find(u => u.id === inf.influencerId);
              const unreads = db.chats.list().filter(m => m.campaignId === camp.id && m.senderId === inf.influencerId && !m.read).length;
              const campaignChats = db.chats.list().filter(m => m.campaignId === camp.id);
              const latestMsg = campaignChats.length > 0 ? campaignChats[campaignChats.length - 1] : null;

              return {
                campaignId: camp.id,
                campaignName: camp.name,
                partnerId: inf.influencerId,
                partnerName: inf.influencerName,
                partnerAvatar: influencerDetail?.avatarUrl,
                partnerHandle: influencerDetail?.handle || "@kreator_lokal",
                unreads,
                latestMsg
              };
            });
        });
      } else if (currentUser.role === "influencer") {
        // Influencer looks for campaigns they are active in
        resolvedThreads = allCampaigns.flatMap(camp => {
          const me = camp.influencers.find(i => i.influencerId === currentUser.id && i.status !== "applied" && i.status !== "invited");
          if (!me) return [];
          const umkmUser = allUsers.find(u => u.id === camp.umkmId);
          const unreads = db.chats.list().filter(m => m.campaignId === camp.id && m.senderId === camp.umkmId && !m.read).length;
          const campaignChats = db.chats.list().filter(m => m.campaignId === camp.id);
          const latestMsg = campaignChats.length > 0 ? campaignChats[campaignChats.length - 1] : null;

          return [{
            campaignId: camp.id,
            campaignName: camp.name,
            partnerId: camp.umkmId,
            partnerName: umkmUser?.brandName || umkmUser?.name || camp.umkmName,
            partnerAvatar: umkmUser?.avatarUrl,
            partnerHandle: umkmUser?.email ? `@${umkmUser.email.split("@")[0]}` : "@mitra_umkm",
            unreads,
            latestMsg
          }];
        });
      }

      // Sort by latest message timestamp
      resolvedThreads.sort((a, b) => {
        const timeA = a.latestMsg ? new Date(a.latestMsg.timestamp).getTime() : 0;
        const timeB = b.latestMsg ? new Date(b.latestMsg.timestamp).getTime() : 0;
        return timeB - timeA;
      });

      setThreads(resolvedThreads);

      // 3. Re-fetch active chat messages if a chat is open
      if (selectedChatCampaignId && selectedChatPartnerId) {
        db.chats.markAsRead(selectedChatCampaignId, currentUser.id);
        const activeMsgs = db.chats.list().filter(m => m.campaignId === selectedChatCampaignId);
        setChatMessages(activeMsgs);
      }
    };

    updateChatState();
    const interval = setInterval(updateChatState, 2000);
    return () => clearInterval(interval);
  }, [currentUser, selectedChatCampaignId, selectedChatPartnerId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedChatCampaignId || !selectedChatPartnerId) return;

    const newMsg = {
      id: "msg-" + Date.now(),
      campaignId: selectedChatCampaignId,
      senderId: currentUser.id,
      receiverId: selectedChatPartnerId,
      message: newMessageText.trim(),
      read: false,
      timestamp: new Date().toISOString()
    };

    db.chats.save(newMsg);
    setChatMessages(prev => [...prev, newMsg]);
    setNewMessageText("");

    // Manually refresh threads state immediately
    const updatedChats = db.chats.list().filter(m => m.campaignId === selectedChatCampaignId);
    setChatMessages(updatedChats);
  };

  if (currentUser.role === "admin") return null; // Admin doesn't participate in collab chats

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-4 rounded-full bg-brand-text text-brand-white shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-brand-sand/20 ${
            isOpen ? "bg-[#332a24]" : ""
          }`}
          title="Tanya & Diskusi Chat"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}

          {/* Unread count badge */}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-brand-white font-mono text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-brand-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Pop-up Chat Widget Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[400px] h-[500px] sm:h-[550px] bg-brand-white border border-brand-sand rounded-3xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden z-50 font-sans text-brand-text"
          >
            {/* Widget Header */}
            <div className="px-5 py-4 bg-brand-bg/60 border-b border-brand-sand/50 flex items-center justify-between">
              {selectedChatCampaignId ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedChatCampaignId(null);
                      setSelectedChatPartnerId(null);
                      setSelectedChatPartnerName("");
                    }}
                    className="p-1.5 hover:bg-brand-bg rounded-xl transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="overflow-hidden max-w-[240px]">
                    <h3 className="font-serif font-bold text-sm truncate">{selectedChatPartnerName}</h3>
                    <p className="text-[10px] text-brand-text-soft truncate font-medium">Campaign: {threads.find(t => t.campaignId === selectedChatCampaignId)?.campaignName || "Kolaborasi"}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-serif font-bold text-base flex items-center gap-1.5">
                    <span>Diskusi Chat</span>
                    <Sparkles className="w-4 h-4 text-brand-blush-dark shrink-0" />
                  </h3>
                  <p className="text-[10px] text-brand-text-soft mt-0.5">Pusat negosiasi & obrolan partner aktif</p>
                </div>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-brand-bg rounded-xl transition-colors text-brand-text-soft hover:text-brand-text cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Widget Main Body Area */}
            <div className="flex-1 overflow-hidden flex flex-col bg-brand-white relative">
              {selectedChatCampaignId && selectedChatPartnerId ? (
                /* Thread Message List View */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Messages container */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FCFAF7]/45 flex flex-col">
                    {chatMessages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-brand-text-soft space-y-2">
                        <span className="text-2xl">💬</span>
                        <p className="text-xs font-semibold">Mulai Percakapan Baru</p>
                        <p className="text-[10px] text-brand-text-light max-w-[220px]">
                          Kirim pesan draf, bahas timeline, draf postingan, atau tanyakan perincian kampanye secara langsung.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMe = msg.senderId === currentUser.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[80%] ${
                              isMe ? "self-end items-end" : "self-start items-start"
                            }`}
                          >
                            <div className="text-[8px] text-brand-text-light font-bold mb-0.5 px-1">
                              {isMe ? "Anda" : selectedChatPartnerName}
                            </div>
                            <div
                              className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm break-words w-full ${
                                isMe
                                  ? "bg-brand-text text-brand-white rounded-tr-none"
                                  : "bg-brand-bg border border-brand-sand/50 text-brand-text rounded-tl-none"
                              }`}
                            >
                              {msg.message}
                            </div>
                            <div className="text-[8px] text-brand-text-light font-mono mt-0.5 px-1 flex items-center gap-1">
                              {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                              {isMe && (
                                <span className={`font-sans font-bold ${msg.read ? "text-brand-sage-dark" : "text-brand-text-light"}`}>
                                  {msg.read ? "✓✓ Terbaca" : "✓ Terkirim"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Form */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 border-t border-brand-sand/50 bg-brand-white flex gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Tulis pesan obrolan..."
                      className="flex-1 border border-brand-sand bg-brand-bg/30 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-text text-brand-text"
                    />
                    <button
                      type="submit"
                      className="p-2.5 rounded-xl bg-brand-text text-brand-white hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                /* Thread Selection List View */
                <div className="flex-1 flex flex-col overflow-y-auto divide-y divide-brand-sand/30">
                  {threads.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-brand-text-soft my-auto">
                      <div className="w-14 h-14 rounded-full bg-brand-blush/30 flex items-center justify-center text-xl mb-3">
                        💬
                      </div>
                      <h4 className="font-serif text-sm font-bold">Belum Ada Kolaborasi Aktif</h4>
                      <p className="text-[10px] text-brand-text-light max-w-[240px] mt-1.5 leading-relaxed">
                        {currentUser.role === "umkm"
                          ? "Silakan setujui pengajuan influencer di tab 'Campaign' atau kirimkan undangan kerjasama terlebih dahulu."
                          : "Ajukan lamaran pada campaign yang tersedia di tab 'Cari Campaign' untuk memulai kolaborasi baru."}
                      </p>
                    </div>
                  ) : (
                    threads.map((thread) => {
                      return (
                        <div
                          key={`${thread.campaignId}-${thread.partnerId}`}
                          onClick={() => {
                            setSelectedChatCampaignId(thread.campaignId);
                            setSelectedChatPartnerId(thread.partnerId);
                            setSelectedChatPartnerName(thread.partnerName);
                            db.chats.markAsRead(thread.campaignId, currentUser.id);
                          }}
                          className="p-4 cursor-pointer hover:bg-brand-blush/10 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {thread.partnerAvatar && (thread.partnerAvatar.startsWith("http") || thread.partnerAvatar.startsWith("/") || thread.partnerAvatar.startsWith("data:")) ? (
                              <img
                                src={thread.partnerAvatar}
                                alt={thread.partnerName}
                                className="w-10 h-10 rounded-full object-cover border border-brand-sand shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-brand-blush text-brand-blush-dark font-bold text-xs flex items-center justify-center shrink-0">
                                {thread.partnerName.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="overflow-hidden">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold truncate leading-none">{thread.partnerName}</h4>
                                <span className="text-[9px] text-brand-text-light font-mono truncate leading-none">{thread.partnerHandle}</span>
                              </div>
                              <p className="text-[10px] text-brand-text-soft truncate font-serif font-semibold mt-1 leading-none">
                                Campaign: {thread.campaignName}
                              </p>
                              <p className="text-[10px] text-brand-text-light truncate mt-1 max-w-[200px]">
                                {thread.latestMsg
                                  ? `${thread.latestMsg.senderId === currentUser.id ? "Anda" : thread.partnerName}: ${thread.latestMsg.message}`
                                  : "Belum ada pesan."}
                              </p>
                            </div>
                          </div>

                          {thread.unreads > 0 && (
                            <span className="bg-red-500 text-brand-white text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold shrink-0">
                              {thread.unreads}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
