"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  MessagesSquare, Search, Send, User, Paperclip, 
  Smile, MoreVertical, Shield, CheckCheck, RefreshCw, AlertCircle
} from "lucide-react";

import { 
  fetchFacultyStudents, 
  fetchFacultyChatHistory, 
  sendFacultyChatMessage 
} from "@/lib/api";

export default function MessagesPage() {
  const qc = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["faculty-students"],
    queryFn: fetchFacultyStudents,
    onSuccess: (data) => {
      if (data && data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(data[0].id);
      }
    }
  });

  const { data: chatHistory = [], isLoading: loadingChat } = useQuery({
    queryKey: ["chat-history", selectedStudentId],
    queryFn: () => fetchFacultyChatHistory(selectedStudentId!),
    enabled: !!selectedStudentId,
    refetchInterval: 4000 // Poll every 4s for simulated real-time messaging
  });

  // Send Mutation
  const sendMutation = useMutation({
    mutationFn: (payload: { receiver_id: string; content: string }) => sendFacultyChatMessage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-history", selectedStudentId] });
      setInputText("");
    }
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const activeStudent = students.find((s: any) => s.id === selectedStudentId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedStudentId) return;
    await sendMutation.mutateAsync({
      receiver_id: selectedStudentId,
      content: inputText
    });
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
          {loadingStudents ? (
            <div className="text-center py-6 text-slate-500 text-xs">Loading chats...</div>
          ) : (
            filteredStudents.map((s: any) => {
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{s.name}</div>
                    <span className="text-[10px] text-slate-500 truncate block mt-0.5">{s.roll_number}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT THREAD VIEW */}
      <div className="flex-1 glass border border-white/10 rounded-2xl bg-[#090e1a]/20 flex flex-col overflow-hidden">
        {activeStudent ? (
          <>
            {/* Chat Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {activeStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{activeStudent.name}</h3>
                  <span className="text-[10px] text-slate-500 block font-mono">{activeStudent.roll_number} • CSE Section {activeStudent.section}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Direct Encrypted Chat</span>
                </span>
              </div>
            </div>

            {/* Message History Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border border-purple-500 border-t-transparent rounded-full animate-spin mr-2" />
                  <span className="text-[10px] font-mono text-slate-500">Loading messages...</span>
                </div>
              ) : (
                chatHistory.map((m: any) => {
                  const isMe = m.sender_id === "faculty_demo";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs font-semibold leading-relaxed border ${
                          isMe 
                            ? "bg-purple-600/15 border-purple-500/20 text-white rounded-br-none" 
                            : "bg-[#090e1a] border-white/5 text-slate-300 rounded-bl-none"
                        }`}
                      >
                        <div>{m.content}</div>
                        <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500 font-mono mt-1.5">
                          <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center gap-3 shrink-0">
              <button type="button" className="p-2.5 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-all" aria-label="Mock attach files">
                <Paperclip className="w-4 h-4" />
              </button>
              
              <input
                type="text"
                placeholder="Type your message here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-slate-200 text-xs font-medium placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
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
