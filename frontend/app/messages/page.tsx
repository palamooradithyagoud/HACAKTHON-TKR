"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessagesSquare, Search, Send, Paperclip,
  Shield, CheckCheck, Loader2, AlertCircle, RefreshCw
} from "lucide-react";

import { getSharedMockStudents } from "@/lib/mockData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  id: string | number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

export default function MessagesPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const students = getSharedMockStudents();

  // Select first student on mount
  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Fetch chat history from backend whenever selected student changes
  const fetchChat = useCallback(async (studentId: string) => {
    setLoadingChat(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/faculty/messages/${studentId}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: Message[] = await res.json();
      setChatHistory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
      setChatHistory([]);
    } finally {
      setLoadingChat(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchChat(selectedStudentId);
    }
  }, [selectedStudentId, fetchChat]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const activeStudent = students.find((s: any) => s.id === selectedStudentId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedStudentId || sending) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);
    setError(null);

    // Optimistic UI — add message immediately
    const optimisticMsg: Message = {
      id: `opt-${Date.now()}`,
      sender_id: "faculty_demo",
      receiver_id: selectedStudentId,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setChatHistory((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`${API_BASE}/api/faculty/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: selectedStudentId, content }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const saved: Message = await res.json();

      // Replace optimistic message with the real saved one
      setChatHistory((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? saved : m))
      );
    } catch (err: any) {
      // Roll back optimistic message on failure
      setChatHistory((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const filteredStudents = students.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex gap-4 overflow-hidden -mt-2">

      {/* SIDEBAR: Student List */}
      <div className="w-80 glass border border-white/10 rounded-2xl bg-[#090e1a]/40 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <MessagesSquare className="w-4 h-4 text-purple-400" />
            <span>Student Chats</span>
          </h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredStudents.map((s: any) => {
            const isActive = s.id === selectedStudentId;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600/25 to-purple-600/15 border border-blue-500/20 text-white"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold font-mono shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{s.name}</div>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">{s.roll_number}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT THREAD VIEW */}
      <div className="flex-1 glass border border-white/10 rounded-2xl bg-[#090e1a]/20 flex flex-col overflow-hidden">
        {activeStudent ? (
          <>
            {/* Chat Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {activeStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{activeStudent.name}</h3>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {activeStudent.roll_number} • CSE Section {activeStudent.section}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedStudentId && fetchChat(selectedStudentId)}
                  title="Refresh chat"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Direct Encrypted Chat</span>
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Message History Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin mr-2" />
                  <span className="text-[10px] font-mono text-slate-500">Loading messages...</span>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessagesSquare className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatHistory.map((m: Message) => {
                  const isMe = m.sender_id === "faculty_demo";
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold mr-2 shrink-0 self-end">
                          {activeStudent.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs font-semibold leading-relaxed border ${
                          isMe
                            ? "bg-purple-600/15 border-purple-500/20 text-white rounded-br-none"
                            : "bg-[#090e1a] border-white/5 text-slate-300 rounded-bl-none"
                        }`}
                      >
                        <div>{m.content}</div>
                        <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500 font-mono mt-1.5">
                          <span>
                            {m.created_at
                              ? new Date(m.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </span>
                          {isMe && (
                            <CheckCheck
                              className={`w-3.5 h-3.5 ${m.is_read ? "text-blue-400" : "text-indigo-400/50"}`}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center gap-3 shrink-0"
            >
              <button
                type="button"
                className="p-2.5 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                aria-label="Attach files"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder="Type your message here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-200 text-xs font-medium placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg disabled:opacity-50 transition-all"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{sending ? "Sending..." : "Send"}</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <MessagesSquare className="w-10 h-10 text-slate-600 mb-2" />
            <h3 className="text-white font-bold mb-1">No Active Chat Thread</h3>
            <p className="text-xs text-slate-500">Select a student from the sidebar to open a conversation thread.</p>
          </div>
        )}
      </div>

    </div>
  );
}
