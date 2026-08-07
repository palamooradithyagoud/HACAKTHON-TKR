"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Bot,
  User,
  Send,
  Loader2,
  Award,
  CheckCircle2,
  Briefcase,
  Play,
  RotateCcw,
  Code,
  Layers,
  Users,
  ChevronRight,
  Zap,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Clock,
  Download,
  Cpu,
  BrainCircuit,
  Globe,
  Radio,
  Square,
  AlertTriangle,
  Flame,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";
import { sendMentorMessage, transcribeAudio, synthesizeSpeechSarvam } from "@/lib/api";

// ── Interview configuration data ─────────────────────────────────────────────
interface AIInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ROLES = [
  { id: "hr",        title: "Behavioral & HR Round",icon: Users,       desc: "STAR Method, Leadership Principles, Conflict & Culture Fit" },
  { id: "swe",       title: "Software Engineer",   icon: Code,        desc: "Data Structures, Algorithms & Problem Solving" },
  { id: "sys",       title: "System Design",        icon: Layers,      desc: "Scalability, Distributed Systems & Databases" },
  { id: "fullstack", title: "Full-Stack Developer", icon: Cpu,         desc: "React, Node, REST APIs, Databases & Architecture" },
  { id: "data",      title: "AI & Data Science",    icon: BrainCircuit,desc: "Machine Learning, LLMs, SQL & Data Pipelines" },
];

export type DifficultyLevelId = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  id: DifficultyLevelId;
  title: string;
  badge: string;
  icon: string;
  border: string;
  bg: string;
  accent: string;
  desc: string;
  questions: string[];
}

export const DIFFICULTY_LEVELS: Record<DifficultyLevelId, DifficultyConfig> = {
  easy: {
    id: "easy",
    title: "🟢 Easy (Beginner Level)",
    badge: "Personality & Communication",
    icon: "🟢",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    accent: "text-emerald-400",
    desc: "These are commonly asked to help the interviewer understand your personality, background, strengths, and communication skills.",
    questions: [
      "Tell me about yourself.",
      "Why do you want to work at our company?",
      "What are your greatest strengths?",
      "What is one weakness you're working to improve?",
      "Why should we hire you?"
    ]
  },
  medium: {
    id: "medium",
    title: "🟡 Medium (Experience-Based)",
    badge: "STAR Method & Real Examples",
    icon: "🟡",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    accent: "text-amber-400",
    desc: "These require real-life examples. Use the STAR method (Situation, Task, Action, Result) to structure your answers.",
    questions: [
      "Tell me about a time you worked successfully in a team.",
      "Describe a challenge you faced in a project and how you solved it.",
      "Tell me about a time you had to learn a new skill quickly.",
      "Describe a situation where you had to manage multiple tasks or deadlines.",
      "Tell me about a time you received constructive feedback. How did you respond?"
    ]
  },
  hard: {
    id: "hard",
    title: "🔴 Hard (Critical Thinking & Leadership)",
    badge: "High-Stakes Leadership & Decision Making",
    icon: "🔴",
    border: "border-rose-500/40",
    bg: "bg-rose-500/10",
    accent: "text-rose-400",
    desc: "These test your decision-making, leadership, conflict resolution, and adaptability under high-pressure scenarios.",
    questions: [
      "Tell me about a time you failed. What happened, and what did you learn?",
      "Describe a conflict you had with a teammate. How did you resolve it?",
      "Tell me about a time when you had to make an important decision with limited information.",
      "Describe a situation where you took initiative without being asked.",
      "Tell me about a time you had to convince someone to accept your idea despite initial disagreement."
    ]
  }
};

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

// ── Deepgram Nova-2 STT helper ─────────────────────────────────────────
async function transcribeWithDeepgram(audioBlob: Blob): Promise<string> {
  const result = await transcribeAudio(audioBlob);
  if (!result.success) {
    throw new Error(result.error || "STT transcription failed");
  }
  return result.transcript;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIInterviewModal({ isOpen, onClose }: AIInterviewModalProps) {
  const [selectedRole, setSelectedRole]   = useState(ROLES[0].id);
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevelId>("easy");

  const [interviewStarted, setInterviewStarted]   = useState(false);
  const [messages, setMessages]                   = useState<Message[]>([]);
  const [inputMessage, setInputMessage]           = useState("");
  const [isLoading, setIsLoading]                 = useState(false);
  const [questionCount, setQuestionCount]         = useState(0);
  const [interviewFinished, setInterviewFinished] = useState(false);

  // Voice: TTS (AI reads questions via Sarvam AI Shubh Voice)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice: Deepgram STT (user speaks answers)
  const [isRecording, setIsRecording]           = useState(false);
  const [isTranscribing, setIsTranscribing]     = useState(false);
  const [sttError, setSttError]                 = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Evaluation results
  const [finalScore, setFinalScore]                       = useState<number | null>(null);
  const [hiringVerdict, setHiringVerdict]                 = useState<"STRONG HIRE" | "WEAK LEAN" | "NO HIRE">("NO HIRE");
  const [brutalFeedbackSummary, setBrutalFeedbackSummary] = useState<string>("");
  const [strengths, setStrengths]                         = useState<string[]>([]);
  const [redFlags, setRedFlags]                           = useState<string[]>([]);
  const [improvements, setImprovements]                   = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── helpers ──────────────────────────────────────────────────────────────
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // Fallback to browser Web Speech API if Sarvam TTS is unavailable or blocked
  const fallbackSpeechSynthesis = useCallback((cleanText: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate  = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend   = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  }, []);

  // TTS: speak AI text with Sarvam AI "shubh" voice
  const speakText = useCallback(async (text: string) => {
    if (!isVoiceEnabled) return;

    // Stop any ongoing speech or audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    let clean = text.replace(/[*_#`~]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").trim();
    if (!clean) return;

    // For ultra-fast Sarvam AI Voice TTS response (~200ms latency), extract the core question line or max ~120 chars
    let spokenText = clean;
    const qMatch = clean.match(/(Question\s*\d+:?[\s\S]*?)(?=\n|$|[.!?]\s+[A-Z])/i);
    if (qMatch && qMatch[1]) {
      spokenText = qMatch[1].trim();
    }
    if (spokenText.length > 120) {
      const parts = spokenText.split(/(?<=[.!?])\s+/);
      let shortText = "";
      for (const p of parts) {
        if ((shortText + " " + p).length <= 120) {
          shortText += (shortText ? " " : "") + p;
        } else {
          break;
        }
      }
      spokenText = shortText || spokenText.slice(0, 120);
    }

    try {
      setIsSpeaking(true);
      
      // Fast Promise.race with 1.5s timeout to guarantee instant zero-delay voice feedback
      const ttsPromise = synthesizeSpeechSarvam(spokenText, "shubh");
      const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ success: false, error: "Sarvam AI latency timeout" }), 1500)
      );

      const ttsRes = await Promise.race([ttsPromise, timeoutPromise]);
      if (ttsRes.success && ttsRes.audio_url) {
        const audio = new Audio(ttsRes.audio_url);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          audioRef.current = null;
          fallbackSpeechSynthesis(clean);
        };

        await audio.play().catch(() => {
          fallbackSpeechSynthesis(clean);
        });
      } else {
        // Instant fallback to high-speed Web Speech API if Sarvam takes > 1.5s or fails
        fallbackSpeechSynthesis(clean);
      }
    } catch (err) {
      console.warn("Sarvam TTS request failed, falling back to browser speech synthesis:", err);
      fallbackSpeechSynthesis(clean);
    }
  }, [isVoiceEnabled, fallbackSpeechSynthesis]);

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Interview timer
  useEffect(() => {
    if (interviewStarted && !interviewFinished) {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [interviewStarted, interviewFinished]);

  const formatTimer = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Deepgram STT: push-to-talk ──────────────────────────────────────────────
  const startRecording = async () => {
    setSttError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);

        if (audioChunksRef.current.length === 0) return;

        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        try {
          const transcript = await transcribeWithDeepgram(audioBlob);
          if (transcript.trim()) {
            setInputMessage(prev => prev ? `${prev} ${transcript.trim()}` : transcript.trim());
          } else {
            setSttError("No speech detected. Please try again.");
          }
        } catch (err: any) {
          console.error("Deepgram STT failed:", err);
          setSttError("Voice transcription failed. Please type your answer.");
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setSttError("Microphone permission denied. Please allow mic access.");
      } else {
        setSttError("Could not access microphone. Please type your answer.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    stopSpeaking();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ── Interview logic ───────────────────────────────────────────────────────
  const handleStartInterview = async () => {
    stopSpeaking();
    setInterviewStarted(true);
    setInterviewFinished(false);
    setQuestionCount(1);
    setElapsedSeconds(0);
    setFinalScore(null);
    setSttError(null);
    setIsLoading(true);

    const roleObj  = ROLES.find(r => r.id === selectedRole) || ROLES[0];
    const levelObj = DIFFICULTY_LEVELS[selectedLevel];
    const firstQ   = levelObj.questions[0];

    const prompt = `Act as the Lead Interviewer conducting a realistic ${levelObj.title} mock interview round (5 questions total) for a ${roleObj.title} candidate.
Introduce yourself briefly in 1-2 professional sentences and state Question 1 clearly: "${firstQ}".`;

    try {
      const res = await sendMentorMessage(prompt);
      const reply = res.reply || `Welcome to your ${levelObj.title} mock interview for ${roleObj.title}!\n\n**Question 1:** ${firstQ}`;
      setMessages([{ role: "assistant", content: reply, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      speakText(reply);
    } catch {
      const fallback = `Welcome to your ${levelObj.title} mock interview for ${roleObj.title}!\n\n**Question 1:** ${firstQ}`;
      setMessages([{ role: "assistant", content: fallback, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      speakText(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const parseScoreAndFeedback = (text: string) => {
    // Score
    const scoreMatch = text.match(/Score:\s*(\d{1,3})/i) || text.match(/(\d{1,3})\s*\/\s*100/i);
    let score = scoreMatch ? parseInt(scoreMatch[1], 10) : 50;
    if (score > 100) score = 100;
    setFinalScore(score);

    // Hiring Verdict based on strict Senior HR Rubric
    if (score >= 81) {
      setHiringVerdict("STRONG HIRE");
    } else if (score >= 61) {
      setHiringVerdict("WEAK LEAN");
    } else {
      setHiringVerdict("NO HIRE");
    }

    // HR Summary
    const summaryMatch = text.match(/HR HIRING BAR SUMMARY:?\s*([\s\S]*?)(?=KEY STRENGTHS|BRUTAL RED FLAGS|$)/i);
    if (summaryMatch && summaryMatch[1].trim()) {
      setBrutalFeedbackSummary(summaryMatch[1].trim());
    } else {
      setBrutalFeedbackSummary(
        score >= 81
          ? "Exceptional candidate demonstrating ownership, measurable impact, clear STAR responses, and excellent communication."
          : score >= 61
          ? "Strong candidate with clear STAR framework answers, metrics, and confidence, but with minor areas for refinement."
          : score >= 41
          ? "Average candidate with some acceptable responses, but lacks deep metrics and strong situational evidence."
          : score >= 21
          ? "Very weak answers with little evidence, clarity, or STAR structure. Significant interview prep required."
          : "No meaningful answers provided. Candidate answered 'I don't know' or provided generic/empty responses. Not interview-ready."
      );
    }

    // Strengths
    const strengthsMatch = text.match(/KEY STRENGTHS:?\s*([\s\S]*?)(?=BRUTAL RED FLAGS|RECOMMENDED GROWTH ACTIONS|$)/i);
    if (strengthsMatch) {
      const lines = strengthsMatch[1].split("\n").map(l => l.replace(/^[-*•\d.\s]+/, "").trim()).filter(Boolean);
      if (lines.length > 0) setStrengths(lines.slice(0, 3));
      else setStrengths(score < 40 ? ["Showed up for the interview session"] : ["Structured articulation of background", "Polite professional tone"]);
    } else {
      setStrengths(score < 40 ? ["Showed up for the interview session"] : ["Structured articulation of background", "Polite professional tone"]);
    }

    // Red Flags
    const redFlagsMatch = text.match(/BRUTAL RED FLAGS.*?:?\s*([\s\S]*?)(?=RECOMMENDED GROWTH ACTIONS|$)/i);
    if (redFlagsMatch) {
      const lines = redFlagsMatch[1].split("\n").map(l => l.replace(/^[-*•\d.\s]+/, "").trim()).filter(Boolean);
      if (lines.length > 0) setRedFlags(lines.slice(0, 3));
      else setRedFlags(["Failed to provide concrete STAR examples with metrics", "Gave generic or evasive responses"]);
    } else {
      setRedFlags(["Failed to provide concrete STAR examples with metrics", "Gave generic or evasive responses"]);
    }

    // Growth Actions
    const improvementsMatch = text.match(/RECOMMENDED GROWTH ACTIONS:?\s*([\s\S]*?)(?=$)/i);
    if (improvementsMatch) {
      const lines = improvementsMatch[1].split("\n").map(l => l.replace(/^[-*•\d.\s]+/, "").trim()).filter(Boolean);
      if (lines.length > 0) setImprovements(lines.slice(0, 3));
      else setImprovements(["Never answer 'I don't know'—use STAR framework to outline your problem-solving approach", "Quantify results with specific percentages, time saved, or team metrics"]);
    } else {
      setImprovements(["Never answer 'I don't know'—use STAR framework to outline your problem-solving approach", "Quantify results with specific percentages, time saved, or team metrics"]);
    }

    try {
      localStorage.setItem("skillscatalyst_interview_score", score.toString());
      localStorage.setItem("skillscatalyst_interview_status", score >= 81 ? "FAANG Ready" : "Completed");
    } catch {}
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    if (isRecording) stopRecording();
    stopSpeaking();
    setSttError(null);

    const userText = inputMessage.trim();
    setInputMessage("");

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userText, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    const nextCount = questionCount + 1;
    setQuestionCount(nextCount);

    const roleObj = ROLES.find(r => r.id === selectedRole) || ROLES[0];
    const levelObj = DIFFICULTY_LEVELS[selectedLevel];
    const isLastQuestion = nextCount > 5;

    if (isLastQuestion) setInterviewFinished(true);

    let prompt = "";
    if (isLastQuestion) {
      const transcriptSummary = newMessages.map(m => `${m.role === "assistant" ? "INTERVIEWER" : "CANDIDATE"}: ${m.content}`).join("\n\n");
      prompt = `You are a Senior HR Interview Evaluator. Be EXTREMELY STRICT.

If the candidate:
- answers "I don't know" or "idk"
- gives empty or near-empty answers
- skips questions or passes
- provides generic responses without evidence
- avoids the question

DEDUCT MARKS AGGRESSIVELY!

SCORING RULES & RUBRIC:
0–20: No meaningful answers. Candidate is not interview-ready.
21–40: Very weak answers with little evidence or clarity.
41–60: Average candidate with some acceptable responses.
61–80: Strong candidate with clear STAR answers, metrics, and confidence.
81–100: Exceptional candidate demonstrating ownership, measurable impact, and excellent communication.

CRITICAL DIRECTIVES:
- Never inflate scores.
- Never reward generic or missing answers.
- Strictly grade according to the 0-100 rubric above.

Candidate's Role: ${roleObj.title}
Interview Difficulty: ${levelObj.title}
Candidate's final answer to Question 5: "${userText}"

Full Session Transcript:
${transcriptSummary}

Format your response strictly as follows:
Score: [0-100]/100
Verdict: [STRONG HIRE | WEAK LEAN | NO HIRE]

HR HIRING BAR SUMMARY:
[2-3 brutally strict sentences detailing why candidate passed or failed under the Senior HR Evaluation Rules]

KEY STRENGTHS:
- [Strength 1]
- [Strength 2]

BRUTAL RED FLAGS & FAILURE POINTS:
- [Red Flag 1]
- [Red Flag 2]

RECOMMENDED GROWTH ACTIONS:
- [Action 1]
- [Action 2]`;
    } else {
      const nextQ = levelObj.questions[nextCount - 1];
      const prevQ = levelObj.questions[questionCount - 1];
      prompt = `You are a Senior HR Interview Evaluator conducting a ${levelObj.title} mock interview for a ${roleObj.title} position. Be EXTREMELY STRICT.
The candidate answered Question ${questionCount} ("${prevQ}") with: "${userText}".

If the candidate answered "I don't know", gave an empty/short answer, skipped, or gave a generic response, strictly point out the flaw and deduct marks!
1) Provide 1-2 sentences of strict Senior HR feedback.
2) State Question ${nextCount} clearly: "${nextQ}".`;
    }

    try {
      const res = await sendMentorMessage(prompt);
      const reply = res.reply || (isLastQuestion
        ? `Interview complete! **Score: 25/100.** Verdict: NO HIRE.\n\n**HR HIRING BAR SUMMARY:** Candidate provided weak or generic responses without concrete STAR examples, metrics, or evidence of ownership. Highly unready for real-world interviews.\n\n**KEY STRENGTHS:**\n- Showed up for session\n\n**BRUTAL RED FLAGS & FAILURE POINTS:**\n- Answers lacked substance and metrics\n- Evasive or generic responses\n\n**RECOMMENDED GROWTH ACTIONS:**\n- Use STAR framework (Situation, Task, Action, Result)\n- Quantify achievements with metrics`
        : `Answer noted. Please provide more specific STAR details in your responses.\n\n**Question ${nextCount}:** ${levelObj.questions[nextCount - 1]}`);

      setMessages(prev => [...prev, { role: "assistant", content: reply, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      speakText(reply);
      if (isLastQuestion) parseScoreAndFeedback(reply);
    } catch {
      const fallback = isLastQuestion
        ? `Interview complete! **Score: 20/100.** Verdict: NO HIRE.\n\n**HR HIRING BAR SUMMARY:** Candidate failed to provide meaningful answers. Candidate is not interview-ready.\n\n**KEY STRENGTHS:**\n- Session recorded\n\n**BRUTAL RED FLAGS & FAILURE POINTS:**\n- Generic/empty responses\n- No STAR evidence\n\n**RECOMMENDED GROWTH ACTIONS:**\n- Prepare structured STAR responses.`
        : `Thank you for your response.\n\n**Question ${nextCount}:** ${levelObj.questions[nextCount - 1]}`;

      setMessages(prev => [...prev, { role: "assistant", content: fallback, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      speakText(fallback);
      if (isLastQuestion) parseScoreAndFeedback(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    stopSpeaking();
    if (isRecording) stopRecording();
    setInterviewStarted(false);
    setInterviewFinished(false);
    setMessages([]);
    setQuestionCount(0);
    setElapsedSeconds(0);
    setFinalScore(null);
    setSttError(null);
    setInputMessage("");
  };

  const downloadTranscript = () => {
    let txt = `SKILLSCATALYST AI MOCK INTERVIEW TRANSCRIPT\n`;
    txt += `Role Track: ${ROLES.find(r => r.id === selectedRole)?.title}\n`;
    txt += `Difficulty Level: ${DIFFICULTY_LEVELS[selectedLevel].title}\n`;
    txt += `Duration: ${formatTimer(elapsedSeconds)}\n`;
    if (finalScore !== null) txt += `Final Score: ${finalScore}/100 | Hiring Verdict: ${hiringVerdict}\n`;
    txt += `---------------------------------------------------------\n\n`;

    messages.forEach(m => {
      txt += `[${m.timestamp}] ${m.role === "assistant" ? "AI INTERVIEWER" : "CANDIDATE"}:\n${m.content}\n\n`;
    });

    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toLocaleDateString();
    a.download = `AI_Interview_${selectedLevel}_${dateStr.replace(/\//g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  AI Technical & Behavioral Mock Interviewer
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                    Brutal HR Bar
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Sarvam AI TTS • Deepgram Nova-2 STT • Groq AI Hiring Evaluation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isVoiceEnabled) { stopSpeaking(); setIsVoiceEnabled(false); }
                  else { setIsVoiceEnabled(true); }
                }}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isVoiceEnabled
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden md:inline">{isVoiceEnabled ? "Voice ON" : "Voice OFF"}</span>
              </button>

              <button
                onClick={() => { stopSpeaking(); if (isRecording) stopRecording(); onClose(); }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Body ─────────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {!interviewStarted ? (
              /* ── Setup Screen ─────────────────────────────────────────────── */
              <div className="space-y-6">

                {/* 1. Track Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-rose-400" />1. Select Interview Track
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ROLES.map(role => {
                      const Icon = role.icon;
                      const sel  = selectedRole === role.id;
                      return (
                        <button key={role.id} onClick={() => setSelectedRole(role.id)}
                          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            sel ? "bg-rose-500/10 border-rose-500/40 text-white shadow-lg shadow-rose-500/10 scale-[1.01]"
                                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sel ? "bg-rose-500/20 text-rose-400" : "bg-slate-800/60 text-slate-400"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            {sel && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white mb-1">{role.title}</h4>
                            <p className="text-xs text-slate-400">{role.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Difficulty Selection (Easy / Medium / Hard) */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />2. Select Interview Difficulty & Question Bank
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.keys(DIFFICULTY_LEVELS) as DifficultyLevelId[]).map(key => {
                      const lvl = DIFFICULTY_LEVELS[key];
                      const sel = selectedLevel === key;
                      return (
                        <div
                          key={key}
                          onClick={() => setSelectedLevel(key)}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            sel
                              ? `${lvl.bg} ${lvl.border} text-white shadow-xl ring-1 ring-rose-500/30 scale-[1.01]`
                              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg">{lvl.icon}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                sel ? `${lvl.accent} bg-slate-950/60 ${lvl.border}` : "text-slate-500 bg-slate-900 border-slate-800"
                              }`}>
                                {lvl.badge}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1.5">{lvl.title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">{lvl.desc}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" /> 5 Questions
                            </span>
                            <span className={sel ? lvl.accent : "text-slate-500"}>
                              {sel ? "✓ Selected" : "Click to select"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Voice Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-cyan-500/10 border border-purple-500/20 flex items-start gap-3">
                  <Radio className="w-5 h-5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white">Live Voice Interview:</strong>{" "}
                    Press & release the <span className="text-purple-300 font-semibold">🎙 Record</span> button to speak your answer. <strong className="text-cyan-300">Deepgram Nova-2 high-speed STT</strong> will transcribe your voice in real-time. Questions are asked aloud via <strong className="text-purple-300">Sarvam AI Shubh Voice</strong>.
                  </div>
                </div>

                <button
                  onClick={handleStartInterview}
                  className="w-full bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2 text-sm group"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start {DIFFICULTY_LEVELS[selectedLevel].title} Interview</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              /* ── Live Interview Chat ────────────────────────────────────────── */
              <div className="flex flex-col h-[520px]">

                {/* Session info bar */}
                <div className="flex items-center justify-between px-1 mb-3 text-xs border-b border-slate-800/60 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-slate-400 flex-wrap">
                    <span className="font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-md">
                      Q{Math.min(questionCount, 5)} / 5
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-200">
                      {ROLES.find(r => r.id === selectedRole)?.title}
                    </span>
                    <span>•</span>
                    <span className={`font-semibold ${DIFFICULTY_LEVELS[selectedLevel].accent}`}>
                      {DIFFICULTY_LEVELS[selectedLevel].title}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-cyan-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" /> {formatTimer(elapsedSeconds)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        if (isVoiceEnabled) {
                          stopSpeaking();
                          setIsVoiceEnabled(false);
                        } else {
                          setIsVoiceEnabled(true);
                        }
                      }}
                      className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                        isVoiceEnabled 
                          ? "text-purple-300 bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30"
                          : "text-slate-400 bg-slate-800/80 border-slate-700 hover:text-slate-200"
                      }`}
                      title={isVoiceEnabled ? "Mute Sarvam AI Voice" : "Enable Sarvam AI Voice"}
                    >
                      {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                      <span className="hidden sm:inline">{isVoiceEnabled ? "Sarvam Voice ON" : "Voice Muted"}</span>
                    </button>
                    {messages.length > 1 && (
                      <button onClick={downloadTranscript}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                        title="Download Transcript"
                      >
                        <Download className="w-3.5 h-3.5 text-rose-400" />
                        <span className="hidden sm:inline">Transcript</span>
                      </button>
                    )}
                    <button onClick={handleReset}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors px-2 py-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /><span>Restart</span>
                    </button>
                  </div>
                </div>

                {/* Active Sarvam Voice Speaking Banner */}
                {isSpeaking && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs text-purple-200 mb-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-purple-400 shrink-0 animate-bounce" />
                      <span><strong>AI Interviewer Speaking:</strong> Powered by Sarvam AI Shubh Voice...</span>
                    </div>
                    <button 
                      onClick={stopSpeaking}
                      className="text-[10px] font-bold bg-purple-600/40 hover:bg-purple-600/60 text-white px-2.5 py-1 rounded-lg border border-purple-400/40 transition-colors"
                    >
                      Stop Audio
                    </button>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 no-scrollbar">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-tr-none shadow-md shadow-rose-500/10"
                          : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                      }`}>
                        <div>{msg.content}</div>
                        <span className="text-[9px] opacity-60 block mt-2 text-right">{msg.timestamp}</span>
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none p-3.5 text-xs flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                        <span>AI Interviewer is evaluating with Groq AI Brutal HR Bar…</span>
                      </div>
                    </div>
                  )}

                  {/* Final Brutal HR Report Card */}
                  {interviewFinished && finalScore !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d162d] to-purple-950/40 border border-slate-800 shadow-2xl space-y-4 my-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg ${
                            hiringVerdict === "STRONG HIRE" ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" :
                            hiringVerdict === "WEAK LEAN"   ? "bg-amber-500/20 border border-amber-500/40 text-amber-400" :
                            "bg-rose-500/20 border border-rose-500/40 text-rose-400"
                          }`}>
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              Brutal HR Hiring Bar Evaluation
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                hiringVerdict === "STRONG HIRE" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" :
                                hiringVerdict === "WEAK LEAN"   ? "bg-amber-500/20 border-amber-500/40 text-amber-400" :
                                "bg-rose-500/20 border-rose-500/40 text-rose-400"
                              }`}>
                                {hiringVerdict === "STRONG HIRE" ? "🟢 STRONG HIRE" : hiringVerdict === "WEAK LEAN" ? "🟡 WEAK LEAN / RE-INTERVIEW" : "🔴 NO HIRE (REJECTED)"}
                              </span>
                            </h4>
                            <p className="text-xs text-slate-400">
                              {DIFFICULTY_LEVELS[selectedLevel].title} • Powered by Groq AI Real-World HR Bar
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-3xl font-black tracking-tight ${
                            finalScore >= 85 ? "text-emerald-400" : finalScore >= 70 ? "text-amber-400" : "text-rose-400"
                          }`}>
                            {finalScore}/100
                          </span>
                        </div>
                      </div>

                      {/* Brutal HR Verdict Summary */}
                      {brutalFeedbackSummary && (
                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                          <span className="font-bold text-white block mb-1 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-rose-400" /> Real-World HR Hiring Bar Summary:
                          </span>
                          {brutalFeedbackSummary}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Strengths */}
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                            <CheckCircle className="w-3.5 h-3.5" /> Key Strengths
                          </span>
                          <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                            {strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>

                        {/* Brutal Red Flags */}
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                          <span className="font-bold text-rose-400 flex items-center gap-1.5 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5" /> Brutal Red Flags & Failure Points
                          </span>
                          <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                            {redFlags.map((rf, i) => <li key={i}>{rf}</li>)}
                          </ul>
                        </div>
                      </div>

                      {/* Growth Recommendations */}
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> Recommended Growth Actions
                        </span>
                        <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                          {improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
                        <button onClick={downloadTranscript}
                          className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Export Complete Transcript
                        </button>
                        <button onClick={handleReset}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold transition-colors"
                        >
                          Try Another Difficulty Level
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* ── Input controls ──────────────────────────────────────── */}
                {!interviewFinished ? (
                  <div className="space-y-2">
                    {/* STT status / error */}
                    {isTranscribing && (
                      <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-semibold px-1 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Deepgram Nova-2 is transcribing your voice…
                      </div>
                    )}
                    {isRecording && !isTranscribing && (
                      <div className="flex items-center gap-2 text-[11px] text-rose-400 font-semibold px-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                        Recording… Press stop when done speaking
                      </div>
                    )}
                    {sttError && (
                      <div className="text-[11px] text-amber-400 font-medium px-1">{sttError}</div>
                    )}

                    <div className="flex gap-2 items-center">
                      {/* Deepgram STT mic button */}
                      <button
                        onClick={toggleRecording}
                        disabled={isTranscribing || isLoading}
                        title={isRecording ? "Stop recording & transcribe" : "Record answer with Deepgram STT"}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                          isRecording
                            ? "bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-500/30 scale-105"
                            : isTranscribing
                            ? "bg-purple-600/30 border-purple-500/50 text-purple-300 cursor-wait"
                            : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-rose-500/50 hover:bg-rose-500/10"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isRecording ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : isTranscribing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </button>

                      <input
                        type="text"
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                        placeholder={
                          isRecording    ? "Recording… press ■ to stop" :
                          isTranscribing ? "Transcribing with Deepgram Nova-2…" :
                          "Type or record your answer…"
                        }
                        disabled={isLoading || isTranscribing}
                        className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-colors"
                      />

                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading || isTranscribing}
                        className="bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-medium px-4 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Deepgram & Sarvam attribution */}
                    <div className="flex items-center gap-1.5 px-1">
                      <Radio className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] text-slate-500">
                        Voice asked via <span className="text-purple-400 font-semibold">Sarvam AI (Shubh Voice)</span> • STT powered by <span className="text-cyan-400 font-semibold">Deepgram Nova-2</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="w-6 h-6 text-rose-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Interview Session Completed!</h4>
                        <p className="text-[11px] text-slate-400">Review your Groq AI Brutal HR Bar evaluation above.</p>
                      </div>
                    </div>
                    <button onClick={handleReset}
                      className="bg-gradient-to-r from-rose-600 to-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      New Session
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
