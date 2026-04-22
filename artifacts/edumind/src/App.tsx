import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/react";
import { Brain, Zap, FileText, Trophy, Calendar, Bookmark, Sparkles, ArrowRight } from "lucide-react";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "English",
  "Computer Science",
  "Economics",
];

const FEATURES = [
  { icon: Brain, title: "AI Helper", desc: "Ask questions and get instant explanations during quizzes, flashcards, and study sessions." },
  { icon: Zap, title: "Test Mode", desc: "Multiple-choice quizzes with scoring, streaks, and detailed performance breakdowns." },
  { icon: FileText, title: "Smart Notes", desc: "Generate concise study notes and summaries from any topic in seconds." },
  { icon: Bookmark, title: "Flashcards", desc: "Spaced-repetition decks that adapt to what you actually need to review." },
  { icon: Calendar, title: "Study Plans", desc: "Personalised plans built around your exam dates, subjects, and goals." },
  { icon: Trophy, title: "Progress Analytics", desc: "Mastery tracking, streaks, achievements, and subject-by-subject insights." },
];

const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#4a84f5",
    colorForeground: "#e8ecf8",
    colorMutedForeground: "#8892b0",
    colorBackground: "#0f1320",
    colorInput: "#161b2c",
    colorInputForeground: "#e8ecf8",
    colorNeutral: "#2a3147",
    colorDanger: "#ef4444",
    colorModalBackdrop: "rgba(5,7,12,0.75)",
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "bg-[#0f1320] border border-white/10 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white",
    headerSubtitle: "text-[#8892b0]",
    socialButtonsBlockButton: "border border-white/10 hover:bg-white/5",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-[#a8b0c8]",
    formFieldInput: "bg-[#161b2c] border border-white/10 text-white",
    formButtonPrimary: "bg-gradient-to-r from-[#4a84f5] to-[#6366f1] hover:opacity-90",
    footerActionText: "text-[#8892b0]",
    footerActionLink: "text-[#7ba8ff] hover:text-white",
    dividerLine: "bg-white/10",
    dividerText: "text-[#8892b0]",
  },
};

function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-[#e8ecf8] font-sans relative overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(74,132,245,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(99,102,241,0.06) 0%, transparent 55%)",
        }}
      />
      <div className="relative z-10">
        <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#4a84f5 0%,#6366f1 100%)", boxShadow: "0 0 20px rgba(74,132,245,0.35)" }}
            >
              <Brain className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <span className="font-serif text-2xl tracking-tight">
              Edu<span className="italic text-[#7ba8ff]">Mind</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="hidden sm:inline-flex px-4 py-2 text-sm text-[#a8b0c8] hover:text-white transition rounded-lg">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  className="px-4 py-2 text-sm font-medium rounded-lg text-white transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#4a84f5,#6366f1)", boxShadow: "0 2px 12px rgba(74,132,245,.3)" }}
                >
                  Get Started
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <a
                href="#dashboard"
                className="px-4 py-2 text-sm text-[#a8b0c8] hover:text-white transition rounded-lg"
              >
                Dashboard
              </a>
              <UserButton afterSignOutUrl={import.meta.env.BASE_URL} />
            </Show>
          </div>
        </nav>

        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs font-medium text-[#a8b0c8] mb-10">
            <Sparkles className="w-3.5 h-3.5 text-[#7ba8ff]" />
            AI-Powered Study Platform
          </div>

          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight mb-2">Study smarter,</h1>
          <h1 className="font-serif italic text-5xl md:text-7xl leading-[1.05] tracking-tight text-[#7ba8ff] mb-10">
            not harder.
          </h1>

          <p className="text-[#8892b0] text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            EduMind combines quizzes, flashcards, an AI helper, and progress analytics into one beautiful study
            platform — for every subject, every year level.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap mb-14">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button
                  className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-medium text-sm transition hover:translate-y-[-1px]"
                  style={{ background: "linear-gradient(135deg,#4a84f5,#6366f1)", boxShadow: "0 4px 24px rgba(74,132,245,.35)" }}
                >
                  Start studying free
                  <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="px-6 py-3.5 rounded-xl text-sm font-medium border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition">
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <a
                href="#dashboard"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-medium text-sm transition hover:translate-y-[-1px]"
                style={{ background: "linear-gradient(135deg,#4a84f5,#6366f1)", boxShadow: "0 4px 24px rgba(74,132,245,.35)" }}
              >
                Open dashboard
                <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
              </a>
            </Show>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5">
            {SUBJECTS.map((s) => (
              <span
                key={s}
                className="px-4 py-2 text-xs md:text-sm rounded-full border border-white/10 bg-white/[0.03] text-[#a8b0c8] hover:border-white/20 hover:text-white transition cursor-default"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        <section id="dashboard" className="max-w-6xl mx-auto px-6 pb-24 pt-10">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-3">
              Everything you need to ace your studies
            </h2>
            <p className="text-[#8892b0] text-sm md:text-base">
              Built for students from Year 1 through Postgraduate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-white/[0.15] hover:bg-white/[0.05] transition"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#7ba8ff]" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-semibold mb-2">{title}</h3>
                <p className="text-sm text-[#8892b0] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/[0.06] py-8 px-6 text-center text-xs text-[#4e576e]">
          © {new Date().getFullYear()} EduMind · AI Study Platform
        </footer>
      </div>
    </div>
  );
}

function App() {
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-white p-8 text-center">
        Missing VITE_CLERK_PUBLISHABLE_KEY
      </div>
    );
  }
  return (
    <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance}>
      <Landing />
    </ClerkProvider>
  );
}

export default App;
