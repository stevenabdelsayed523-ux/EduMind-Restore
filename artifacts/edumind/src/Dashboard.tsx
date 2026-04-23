import { useEffect, useMemo, useState } from "react";
import { UserButton, useUser } from "@clerk/react";
import {
  Brain,
  Zap,
  FileText,
  Trophy,
  Calendar,
  Bookmark,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Send,
  Flame,
  Target,
  Clock,
  Home,
  Languages,
  Crown,
  Settings as SettingsIcon,
  Ticket,
  Sparkles,
} from "lucide-react";

type ViewKey =
  | "overview"
  | "ai"
  | "test"
  | "notes"
  | "flashcards"
  | "plan"
  | "stats"
  | "language"
  | "settings"
  | "codes";

const NAV: { key: ViewKey; label: string; icon: typeof Brain }[] = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "ai", label: "AI Helper", icon: Brain },
  { key: "language", label: "Language Tutor", icon: Languages },
  { key: "test", label: "Test Mode", icon: Zap },
  { key: "notes", label: "Smart Notes", icon: FileText },
  { key: "flashcards", label: "Flashcards", icon: Bookmark },
  { key: "plan", label: "Study Plan", icon: Calendar },
  { key: "stats", label: "Progress", icon: Trophy },
  { key: "codes", label: "Promo Codes", icon: Ticket },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

/* ---------------- Subscription ---------------- */
export type Tier = "free" | "pro" | "max";
export const TIER_LABELS: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  max: "Max Plus",
};
export const PROMO_CODES: { code: string; tier: Tier; desc: string }[] = [
  { code: "MAXPLUS2026", tier: "max", desc: "Unlocks Max Plus — every feature, unlimited usage." },
  { code: "EDUSTUDENT", tier: "pro", desc: "Student perk — upgrades you to Pro." },
  { code: "WELCOME", tier: "pro", desc: "Welcome gift — try Pro for free." },
];

function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

function useTier() {
  return useLocal<Tier>("edumind:tier", "free");
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------------- AI Helper ---------------- */
type ChatMsg = { role: "user" | "assistant"; content: string };
function AIHelper() {
  const [messages, setMessages] = useLocal<ChatMsg[]>("edumind:chat", []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { content?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setMessages([
        ...next,
        { role: "assistant", content: data.content || "(no response)" },
      ]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-2xl">AI Helper</h2>
        <button
          onClick={() => {
            setMessages([]);
            setErr(null);
          }}
          disabled={messages.length === 0 || busy}
          className="text-xs px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-[#cbd2e0] hover:bg-white/[0.08] disabled:opacity-40 inline-flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear chat
        </button>
      </div>
      <Card className="flex-1 overflow-y-auto space-y-3">
        {messages.length === 0 && !busy && (
          <p className="text-[#8892b0] text-sm">
            Ask me anything about your studies — try "explain photosynthesis"
            or "summarise the causes of World War 1".
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] whitespace-pre-wrap px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-gradient-to-r from-[#4a84f5] to-[#6366f1] text-white"
                : "mr-auto bg-white/[0.05] border border-white/[0.08]"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="mr-auto bg-white/[0.05] border border-white/[0.08] px-4 py-3 rounded-2xl text-sm text-[#8892b0]">
            Thinking…
          </div>
        )}
        {err && (
          <div className="mr-auto bg-rose-500/10 border border-rose-500/30 px-4 py-3 rounded-2xl text-sm text-rose-300">
            {err}
          </div>
        )}
      </Card>
      <div className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
          placeholder="Ask a study question…"
          className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-[#5a6480] focus:outline-none focus:border-[#4a84f5] disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-5 py-3 rounded-xl text-white font-medium text-sm bg-gradient-to-r from-[#4a84f5] to-[#6366f1] hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Send className="w-4 h-4" /> Send
        </button>
      </div>
    </div>
  );
}

/* ---------------- Test Mode ---------------- */
type QuizItem = { q: string; options: string[]; answer: number };
type QuizSet = { id: string; title: string; subject: string; emoji: string; questions: QuizItem[] };

const QUIZZES: QuizSet[] = [
  {
    id: "general",
    title: "General Knowledge",
    subject: "Mixed",
    emoji: "🧠",
    questions: [
      { q: "What is the chemical symbol for gold?", options: ["Go", "Au", "Gd", "Ag"], answer: 1 },
      { q: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Mercury"], answer: 2 },
      { q: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Shakespeare", "Austen", "Hemingway"], answer: 1 },
      { q: "What is 12 × 12?", options: ["124", "144", "132", "164"], answer: 1 },
      { q: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi"], answer: 2 },
    ],
  },
  {
    id: "math",
    title: "Math Basics",
    subject: "Mathematics",
    emoji: "➗",
    questions: [
      { q: "What is 15% of 200?", options: ["20", "25", "30", "35"], answer: 2 },
      { q: "Solve: 7x = 49", options: ["6", "7", "8", "9"], answer: 1 },
      { q: "Area of a circle with radius 3? (use π≈3.14)", options: ["18.84", "28.26", "9.42", "31.4"], answer: 1 },
      { q: "What is the square root of 144?", options: ["10", "11", "12", "14"], answer: 2 },
      { q: "Derivative of x²?", options: ["x", "2x", "x²/2", "2"], answer: 1 },
    ],
  },
  {
    id: "physics",
    title: "Physics",
    subject: "Physics",
    emoji: "⚛️",
    questions: [
      { q: "Speed of light is approximately?", options: ["3×10⁵ m/s", "3×10⁸ m/s", "3×10⁶ m/s", "3×10¹⁰ m/s"], answer: 1 },
      { q: "Unit of electric current?", options: ["Volt", "Watt", "Ampere", "Ohm"], answer: 2 },
      { q: "Newton's second law: F = ?", options: ["mv", "ma", "mgh", "½mv²"], answer: 1 },
      { q: "What force keeps planets in orbit?", options: ["Magnetism", "Friction", "Gravity", "Tension"], answer: 2 },
      { q: "SI unit of energy?", options: ["Newton", "Joule", "Pascal", "Watt"], answer: 1 },
    ],
  },
  {
    id: "chemistry",
    title: "Chemistry",
    subject: "Chemistry",
    emoji: "🧪",
    questions: [
      { q: "Water's chemical formula?", options: ["HO", "H₂O", "OH₂", "H₂O₂"], answer: 1 },
      { q: "pH of a neutral solution?", options: ["0", "7", "10", "14"], answer: 1 },
      { q: "Which is a noble gas?", options: ["Oxygen", "Neon", "Nitrogen", "Chlorine"], answer: 1 },
      { q: "Atomic number of carbon?", options: ["4", "6", "8", "12"], answer: 1 },
      { q: "Salt's chemical name?", options: ["Sodium chloride", "Sodium nitrate", "Calcium chloride", "Potassium chloride"], answer: 0 },
    ],
  },
  {
    id: "biology",
    title: "Biology",
    subject: "Biology",
    emoji: "🧬",
    questions: [
      { q: "Powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi"], answer: 2 },
      { q: "Which gas do plants absorb for photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: 2 },
      { q: "How many chambers in the human heart?", options: ["2", "3", "4", "5"], answer: 2 },
      { q: "DNA stands for?", options: ["Deoxyribonucleic acid", "Dinucleic acid", "Diribonucleic acid", "Deoxyribose acid"], answer: 0 },
      { q: "Largest organ in the human body?", options: ["Liver", "Brain", "Skin", "Lungs"], answer: 2 },
    ],
  },
  {
    id: "history",
    title: "World History",
    subject: "History",
    emoji: "📜",
    questions: [
      { q: "Year World War 2 ended?", options: ["1943", "1944", "1945", "1946"], answer: 2 },
      { q: "Who was the first US President?", options: ["Jefferson", "Lincoln", "Washington", "Adams"], answer: 2 },
      { q: "The Great Wall is in which country?", options: ["Japan", "India", "China", "Korea"], answer: 2 },
      { q: "Which empire built the Colosseum?", options: ["Greek", "Roman", "Ottoman", "Persian"], answer: 1 },
      { q: "The French Revolution began in?", options: ["1689", "1789", "1799", "1815"], answer: 1 },
    ],
  },
  {
    id: "compsci",
    title: "Computer Science",
    subject: "Computer Science",
    emoji: "💻",
    questions: [
      { q: "What does CPU stand for?", options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Control Process Unit"], answer: 1 },
      { q: "Binary 1010 in decimal?", options: ["8", "10", "12", "20"], answer: 1 },
      { q: "Which is NOT a programming language?", options: ["Python", "HTML", "Java", "Rust"], answer: 1 },
      { q: "Big-O of binary search?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 1 },
      { q: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transmission Protocol", "Host Transfer Protocol"], answer: 0 },
    ],
  },
  {
    id: "economics",
    title: "Economics",
    subject: "Economics",
    emoji: "📈",
    questions: [
      { q: "GDP stands for?", options: ["Gross Domestic Product", "General Domestic Price", "Global Demand Product", "Gross Demand Price"], answer: 0 },
      { q: "Inflation means a general…", options: ["Fall in prices", "Rise in prices", "Rise in jobs", "Fall in jobs"], answer: 1 },
      { q: "Who wrote 'The Wealth of Nations'?", options: ["Marx", "Keynes", "Adam Smith", "Friedman"], answer: 2 },
      { q: "Demand curves typically slope…", options: ["Upward", "Downward", "Flat", "Vertical"], answer: 1 },
      { q: "Central bank of the USA?", options: ["World Bank", "IMF", "Federal Reserve", "Treasury"], answer: 2 },
    ],
  },
  {
    id: "english",
    title: "English & Literature",
    subject: "English",
    emoji: "📖",
    questions: [
      { q: "A 'metaphor' is a type of?", options: ["Punctuation", "Figure of speech", "Verb tense", "Genre"], answer: 1 },
      { q: "Who wrote '1984'?", options: ["Huxley", "Orwell", "Tolkien", "Salinger"], answer: 1 },
      { q: "Plural of 'mouse' (the animal)?", options: ["Mouses", "Mice", "Mices", "Meese"], answer: 1 },
      { q: "Which is a synonym of 'happy'?", options: ["Morose", "Joyful", "Weary", "Bitter"], answer: 1 },
      { q: "An onomatopoeia mimics?", options: ["Sights", "Smells", "Sounds", "Tastes"], answer: 2 },
    ],
  },
];

const YEAR_LEVELS = [
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
  "University",
  "Adult Learner",
];

function TestMode() {
  const [yearLevel, setYearLevel] = useLocal<string>("edumind:yearLevel", "Year 10");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const quiz = QUIZZES.find((q) => q.id === quizId) || null;

  if (!quiz) {
    return (
      <Card>
        <h3 className="font-serif text-3xl mb-2">Choose a test</h3>
        <p className="text-[#8892b0] text-sm mb-5">
          Pick your year level and a topic to get started.
        </p>
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-wide text-[#8892b0] mb-2">
            Year level
          </label>
          <div className="flex flex-wrap gap-2">
            {YEAR_LEVELS.map((y) => (
              <button
                key={y}
                onClick={() => setYearLevel(y)}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  yearLevel === y
                    ? "border-[#4a84f5] bg-[#4a84f5]/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-[#cbd2e0] hover:border-white/20"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {QUIZZES.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                setQuizId(q.id);
                setI(0);
                setPicked(null);
                setScore(0);
                setDone(false);
              }}
              className="text-left p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition"
            >
              <div className="text-3xl mb-2">{q.emoji}</div>
              <div className="font-semibold mb-1">{q.title}</div>
              <div className="text-xs text-[#8892b0]">
                {yearLevel} · {q.subject} · {q.questions.length} questions
              </div>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  const QUIZ = quiz.questions;
  const item = QUIZ[i];

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === item.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (i + 1 >= QUIZ.length) {
      setDone(true);
      const stats = JSON.parse(localStorage.getItem("edumind:stats") || "{}");
      stats.tests = (stats.tests || 0) + 1;
      stats.correct = (stats.correct || 0) + score + (picked === item.answer ? 1 : 0);
      stats.total = (stats.total || 0) + QUIZ.length;
      localStorage.setItem("edumind:stats", JSON.stringify(stats));
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };
  const reset = () => {
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done)
    return (
      <Card>
        <h3 className="font-serif text-3xl mb-2">Quiz complete!</h3>
        <p className="text-[#8892b0] mb-1">{quiz.title}</p>
        <p className="text-[#8892b0] mb-6">
          You scored {score} / {QUIZ.length}.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={reset}
            className="px-5 py-3 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-[#4a84f5] to-[#6366f1] inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
          <button
            onClick={() => setQuizId(null)}
            className="px-5 py-3 rounded-xl text-white text-sm font-medium border border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
          >
            ← Choose another test
          </button>
        </div>
      </Card>
    );

  return (
    <Card>
      <div className="flex justify-between items-center text-xs text-[#8892b0] mb-4">
        <button
          onClick={() => setQuizId(null)}
          className="hover:text-white transition"
        >
          ← {quiz.title}
        </button>
        <span>
          Question {i + 1} of {QUIZ.length} · Score: {score}
        </span>
      </div>
      <h3 className="text-lg font-semibold mb-5">{item.q}</h3>
      <div className="grid gap-2">
        {item.options.map((o, idx) => {
          const isPicked = picked === idx;
          const isAnswer = item.answer === idx;
          let tone = "border-white/10 bg-white/[0.03] hover:border-white/20";
          if (picked !== null && isAnswer)
            tone = "border-emerald-500/50 bg-emerald-500/10";
          else if (isPicked && !isAnswer)
            tone = "border-rose-500/50 bg-rose-500/10";
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`text-left px-4 py-3 rounded-xl border transition ${tone}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button
          onClick={next}
          className="mt-5 px-5 py-3 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-[#4a84f5] to-[#6366f1]"
        >
          {i + 1 >= QUIZ.length ? "Finish" : "Next →"}
        </button>
      )}
    </Card>
  );
}

/* ---------------- Smart Notes ---------------- */
type Note = { id: string; title: string; body: string; updatedAt: number };
function Notes() {
  const [notes, setNotes] = useLocal<Note[]>("edumind:notes", []);
  const [activeId, setActiveId] = useState<string | null>(notes[0]?.id ?? null);
  const active = notes.find((n) => n.id === activeId) || null;

  const add = () => {
    const id = crypto.randomUUID();
    setNotes([{ id, title: "Untitled", body: "", updatedAt: Date.now() }, ...notes]);
    setActiveId(id);
  };
  const update = (patch: Partial<Note>) =>
    active &&
    setNotes(
      notes.map((n) =>
        n.id === active.id ? { ...n, ...patch, updatedAt: Date.now() } : n,
      ),
    );
  const remove = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 h-[70vh]">
      <Card className="overflow-y-auto">
        <button
          onClick={add}
          className="w-full mb-3 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#4a84f5] to-[#6366f1] text-white inline-flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New note
        </button>
        {notes.length === 0 && (
          <p className="text-xs text-[#5a6480]">No notes yet.</p>
        )}
        <ul className="space-y-1">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setActiveId(n.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  n.id === activeId
                    ? "bg-white/[0.08] text-white"
                    : "text-[#a8b0c8] hover:bg-white/[0.04]"
                }`}
              >
                <div className="truncate">{n.title || "Untitled"}</div>
                <div className="text-[10px] text-[#5a6480]">
                  {new Date(n.updatedAt).toLocaleDateString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        {active ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <input
                value={active.title}
                onChange={(e) => update({ title: e.target.value })}
                className="flex-1 bg-transparent text-xl font-semibold text-white focus:outline-none"
                placeholder="Note title"
              />
              <button
                onClick={() => remove(active.id)}
                className="p-2 rounded-lg text-[#8892b0] hover:text-rose-400 hover:bg-white/[0.04]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={active.body}
              onChange={(e) => update({ body: e.target.value })}
              placeholder="Start writing…"
              className="flex-1 w-full bg-transparent text-sm text-[#e8ecf8] placeholder:text-[#5a6480] focus:outline-none resize-none leading-relaxed"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[#8892b0] text-sm">
            Create a note to get started.
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Flashcards ---------------- */
type Card_ = { id: string; front: string; back: string };
function Flashcards() {
  const [cards, setCards] = useLocal<Card_[]>("edumind:cards", []);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [reviewIdx, setReviewIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const add = () => {
    if (!front.trim() || !back.trim()) return;
    setCards([{ id: crypto.randomUUID(), front, back }, ...cards]);
    setFront("");
    setBack("");
  };
  const remove = (id: string) => setCards(cards.filter((c) => c.id !== id));

  const current = cards[reviewIdx % Math.max(cards.length, 1)];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <h3 className="font-semibold mb-4">Add a card</h3>
        <input
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Front (question)"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-[#5a6480] focus:outline-none focus:border-[#4a84f5] mb-3"
        />
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Back (answer)"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-[#5a6480] focus:outline-none focus:border-[#4a84f5] mb-3 resize-none"
        />
        <button
          onClick={add}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-[#4a84f5] to-[#6366f1] inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add card
        </button>

        {cards.length > 0 && (
          <ul className="mt-6 space-y-2 max-h-[260px] overflow-y-auto">
            {cards.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm"
              >
                <span className="truncate text-[#a8b0c8]">{c.front}</span>
                <button
                  onClick={() => remove(c.id)}
                  className="p-1 text-[#5a6480] hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Review</h3>
        {cards.length === 0 ? (
          <p className="text-sm text-[#8892b0]">
            Add a card to start reviewing.
          </p>
        ) : (
          <>
            <div
              onClick={() => setFlipped((f) => !f)}
              className="cursor-pointer min-h-[220px] rounded-2xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-center px-6 py-8 mb-4 hover:border-white/[0.15]"
            >
              <p className="text-lg font-medium">
                {flipped ? current.back : current.front}
              </p>
            </div>
            <div className="flex justify-between text-xs text-[#5a6480] mb-3">
              <span>
                Card {(reviewIdx % cards.length) + 1} of {cards.length}
              </span>
              <span>{flipped ? "Answer" : "Question"} — tap to flip</span>
            </div>
            <button
              onClick={() => {
                setReviewIdx(reviewIdx + 1);
                setFlipped(false);
              }}
              className="w-full px-5 py-3 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-[#4a84f5] to-[#6366f1]"
            >
              Next card
            </button>
          </>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Study Plan ---------------- */
type Task = { id: string; title: string; due: string; done: boolean };
function StudyPlan() {
  const [tasks, setTasks] = useLocal<Task[]>("edumind:plan", []);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const add = () => {
    if (!title.trim()) return;
    setTasks([
      { id: crypto.randomUUID(), title, due, done: false },
      ...tasks,
    ]);
    setTitle("");
    setDue("");
  };
  const toggle = (id: string) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  return (
    <Card>
      <h3 className="font-semibold mb-4">Study tasks</h3>
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Revise quadratic equations"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-[#5a6480] focus:outline-none focus:border-[#4a84f5]"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-[#4a84f5]"
        />
        <button
          onClick={add}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-[#4a84f5] to-[#6366f1] inline-flex items-center gap-2 justify-center"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-[#8892b0]">No tasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02]"
            >
              <button
                onClick={() => toggle(t.id)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                  t.done
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-white/20"
                }`}
              >
                {t.done && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <div className="flex-1">
                <div
                  className={`text-sm ${
                    t.done ? "line-through text-[#5a6480]" : "text-white"
                  }`}
                >
                  {t.title}
                </div>
                {t.due && (
                  <div className="text-[11px] text-[#5a6480]">
                    Due {new Date(t.due).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="p-1 text-[#5a6480] hover:text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------------- Progress ---------------- */
function Stats() {
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setRefresh((r) => r + 1), 1500);
    return () => clearInterval(i);
  }, []);

  const data = useMemo(() => {
    const stats = JSON.parse(localStorage.getItem("edumind:stats") || "{}");
    const notes = JSON.parse(localStorage.getItem("edumind:notes") || "[]");
    const cards = JSON.parse(localStorage.getItem("edumind:cards") || "[]");
    const plan = JSON.parse(localStorage.getItem("edumind:plan") || "[]");
    const completed = (plan as Task[]).filter((t) => t.done).length;
    const acc = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    return {
      tests: stats.tests || 0,
      acc,
      notes: notes.length,
      cards: cards.length,
      completed,
      planTotal: plan.length,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _r: refresh,
    };
  }, [refresh]);

  const tiles = [
    { icon: Zap, label: "Quizzes taken", value: data.tests },
    { icon: Target, label: "Accuracy", value: `${data.acc}%` },
    { icon: FileText, label: "Notes", value: data.notes },
    { icon: Bookmark, label: "Flashcards", value: data.cards },
    {
      icon: Check,
      label: "Tasks done",
      value: `${data.completed}/${data.planTotal}`,
    },
    { icon: Flame, label: "Streak", value: "1 day" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {tiles.map((t) => (
        <Card key={t.label}>
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
            <t.icon className="w-5 h-5 text-[#7ba8ff]" />
          </div>
          <div className="text-2xl font-semibold">{t.value}</div>
          <div className="text-xs text-[#8892b0] mt-1">{t.label}</div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ go }: { go: (k: ViewKey) => void }) {
  const { user } = useUser();
  const tiles = NAV.filter((n) => n.key !== "overview");
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-4xl tracking-tight">
          Welcome back
          {user?.firstName ? `, ${user.firstName}` : ""} 👋
        </h2>
        <p className="text-[#8892b0] mt-2">
          Pick a tool below to keep your study going.
        </p>
      </div>
      <Stats />
      <h3 className="font-serif text-2xl mt-12 mb-4">Tools</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => go(key)}
            className="text-left rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-white/[0.15] hover:bg-white/[0.05] transition"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-[#7ba8ff]" />
            </div>
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-[#8892b0] mt-1">Open →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Language Tutor ---------------- */
const LANGUAGES = [
  { code: "es", label: "Spanish", emoji: "🇪🇸" },
  { code: "fr", label: "French", emoji: "🇫🇷" },
  { code: "de", label: "German", emoji: "🇩🇪" },
  { code: "it", label: "Italian", emoji: "🇮🇹" },
  { code: "ja", label: "Japanese", emoji: "🇯🇵" },
  { code: "zh", label: "Mandarin", emoji: "🇨🇳" },
  { code: "ko", label: "Korean", emoji: "🇰🇷" },
  { code: "pt", label: "Portuguese", emoji: "🇵🇹" },
];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function LanguageTutor() {
  const [lang, setLang] = useLocal<string>("edumind:lang", "Spanish");
  const [level, setLevel] = useLocal<string>("edumind:langLevel", "Beginner");
  const [messages, setMessages] = useLocal<ChatMsg[]>("edumind:langChat", []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const system = `You are a warm, patient ${lang} language tutor for a ${level.toLowerCase()} learner.
Reply in ${lang} first, then give an English translation in italics on a new line, then briefly explain any new vocabulary or grammar in English.
Ask one short follow-up question in ${lang} to keep the conversation going. Keep responses under 200 words.`;

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, system }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { content?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setMessages([
        ...next,
        { role: "assistant", content: data.content || "(no response)" },
      ]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh]">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <h2 className="font-serif text-2xl">Language Tutor</h2>
        <button
          onClick={() => {
            setMessages([]);
            setErr(null);
          }}
          disabled={messages.length === 0 || busy}
          className="text-xs px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-[#cbd2e0] hover:bg-white/[0.08] disabled:opacity-40 inline-flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear chat
        </button>
      </div>
      <Card className="mb-3 space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-[#8892b0] mb-2">
            Language
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.label)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  lang === l.label
                    ? "border-[#4a84f5] bg-[#4a84f5]/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-[#cbd2e0] hover:border-white/20"
                }`}
              >
                {l.emoji} {l.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-[#8892b0] mb-2">
            Level
          </div>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  level === lv
                    ? "border-[#4a84f5] bg-[#4a84f5]/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-[#cbd2e0] hover:border-white/20"
                }`}
              >
                {lv}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Card className="flex-1 overflow-y-auto space-y-3">
        {messages.length === 0 && !busy && (
          <p className="text-[#8892b0] text-sm">
            Say "hola" or ask "how do I introduce myself in {lang}?" to start
            practising.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] whitespace-pre-wrap px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-gradient-to-r from-[#4a84f5] to-[#6366f1] text-white"
                : "mr-auto bg-white/[0.05] border border-white/[0.08]"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="mr-auto bg-white/[0.05] border border-white/[0.08] px-4 py-3 rounded-2xl text-sm text-[#8892b0]">
            Thinking…
          </div>
        )}
        {err && (
          <div className="mr-auto bg-rose-500/10 border border-rose-500/30 px-4 py-3 rounded-2xl text-sm text-rose-300">
            {err}
          </div>
        )}
      </Card>
      <div className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
          placeholder={`Practise your ${lang}…`}
          className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-[#5a6480] focus:outline-none focus:border-[#4a84f5] disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-5 py-3 rounded-xl text-white font-medium text-sm bg-gradient-to-r from-[#4a84f5] to-[#6366f1] hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Send className="w-4 h-4" /> Send
        </button>
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function Settings({ go }: { go: (k: ViewKey) => void }) {
  const [tier, setTier] = useTier();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const apply = () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    const found = PROMO_CODES.find((p) => p.code === c);
    if (!found) {
      setMsg({ kind: "err", text: "That code didn't work. Check the Promo Codes page." });
      return;
    }
    setTier(found.tier);
    setMsg({ kind: "ok", text: `Success! ${TIER_LABELS[found.tier]} unlocked.` });
    setCode("");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-serif text-3xl mb-1">Settings</h2>
        <p className="text-[#8892b0] text-sm">Manage your plan and access.</p>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-[#8892b0]">Current plan</div>
            <div className="text-xl font-semibold">{TIER_LABELS[tier]}</div>
          </div>
        </div>
        {tier === "free" && (
          <p className="text-sm text-[#8892b0]">
            You're on the Free plan. Enter a promo code below to upgrade.
          </p>
        )}
        {tier === "pro" && (
          <p className="text-sm text-[#8892b0]">
            Pro unlocked — extra quizzes and longer chats. Enter a Max Plus
            code to go further.
          </p>
        )}
        {tier === "max" && (
          <p className="text-sm text-[#8892b0]">
            Max Plus is active — every feature, unlimited usage. Enjoy!
          </p>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold mb-3 inline-flex items-center gap-2">
          <Ticket className="w-4 h-4 text-[#7ba8ff]" /> Redeem a code
        </h3>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Enter promo code"
            className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-[#5a6480] focus:outline-none focus:border-[#4a84f5] uppercase tracking-wide"
          />
          <button
            onClick={apply}
            className="px-5 py-3 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-[#4a84f5] to-[#6366f1] hover:opacity-90"
          >
            Apply
          </button>
        </div>
        {msg && (
          <div
            className={`mt-3 text-sm px-3 py-2 rounded-lg ${
              msg.kind === "ok"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
            }`}
          >
            {msg.text}
          </div>
        )}
        <button
          onClick={() => go("codes")}
          className="mt-4 text-xs text-[#7ba8ff] hover:underline"
        >
          See available codes →
        </button>
      </Card>

      {tier !== "free" && (
        <Card>
          <h3 className="font-semibold mb-2">Reset plan</h3>
          <p className="text-sm text-[#8892b0] mb-3">
            Go back to the Free plan.
          </p>
          <button
            onClick={() => {
              setTier("free");
              setMsg({ kind: "ok", text: "Plan reset to Free." });
            }}
            className="px-4 py-2 rounded-lg text-sm border border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
          >
            Reset to Free
          </button>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Promo Codes page ---------------- */
function Codes({ go }: { go: (k: ViewKey) => void }) {
  const [tier] = useTier();
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-serif text-3xl mb-1 inline-flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-amber-300" /> Promo Codes
        </h2>
        <p className="text-[#8892b0] text-sm">
          Use any of these codes in Settings → Redeem a code. Currently on{" "}
          <span className="text-white font-medium">{TIER_LABELS[tier]}</span>.
        </p>
      </div>

      <div className="grid gap-3">
        {PROMO_CODES.map((p) => (
          <Card key={p.code}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono text-lg font-semibold tracking-wider text-white">
                  {p.code}
                </div>
                <div className="text-sm text-[#8892b0] mt-1">{p.desc}</div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  p.tier === "max"
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                    : "border-[#4a84f5]/40 bg-[#4a84f5]/10 text-[#7ba8ff]"
                }`}
              >
                Unlocks {TIER_LABELS[p.tier]}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={() => go("settings")}
        className="px-5 py-3 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-[#4a84f5] to-[#6366f1] inline-flex items-center gap-2"
      >
        <Ticket className="w-4 h-4" /> Go to Settings to redeem
      </button>
    </div>
  );
}

/* ---------------- Shell ---------------- */
export default function Dashboard({ onExit }: { onExit: () => void }) {
  const [view, setView] = useState<ViewKey>("overview");

  const Body = () => {
    switch (view) {
      case "overview":
        return <Overview go={setView} />;
      case "ai":
        return <AIHelper />;
      case "test":
        return <TestMode />;
      case "notes":
        return <Notes />;
      case "flashcards":
        return <Flashcards />;
      case "plan":
        return <StudyPlan />;
      case "stats":
        return <Stats />;
      case "language":
        return <LanguageTutor />;
      case "settings":
        return <Settings go={setView} />;
      case "codes":
        return <Codes go={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-[#e8ecf8] font-sans">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(74,132,245,0.10) 0%, transparent 60%)",
        }}
      />
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-screen">
        <aside className="border-r border-white/5 px-4 py-6 md:sticky md:top-0 md:h-screen">
          <button
            onClick={onExit}
            className="flex items-center gap-3 mb-8 px-2"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#4a84f5,#6366f1)",
                boxShadow: "0 0 16px rgba(74,132,245,0.35)",
              }}
            >
              <Brain className="w-4 h-4 text-white" strokeWidth={2.4} />
            </div>
            <span className="font-serif text-xl">
              Edu<span className="italic text-[#7ba8ff]">Mind</span>
            </span>
          </button>
          <nav className="space-y-1">
            {NAV.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition ${
                  view === key
                    ? "bg-white/[0.08] text-white"
                    : "text-[#a8b0c8] hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-8 pt-6 border-t border-white/5 px-2 flex items-center gap-3">
            <UserButton />
            <div className="text-xs text-[#8892b0]">Account</div>
          </div>
        </aside>

        <main className="px-6 md:px-10 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-xs text-[#8892b0]">
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <button
              onClick={onExit}
              className="text-xs text-[#8892b0] hover:text-white"
            >
              ← Back to home
            </button>
          </div>
          <Body />
        </main>
      </div>
    </div>
  );
}
