"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ListPlus, Loader2, MessageCircle, Send } from "lucide-react";

type CoachChatPanelProps = {
  insights: string[];
  variant?: "card" | "conversation";
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type CoachMode = "chat" | "log";

const chatStarterPrompts = [
  "How am I doing today?",
  "Suggest a workout for tonight",
  "What should I improve tomorrow?",
];

const logStarterPrompts = [
  "Log mango shake as dinner",
  "I drank 500ml water",
  "Mark magnesium taken",
];

export function CoachChatPanel({ insights, variant = "card" }: CoachChatPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [coachMode, setCoachMode] = useState<CoachMode>("chat");
  const [isStreaming, setIsStreaming] = useState(false);
  const hasConversation = messages.length > 0;

  const visibleInsights = useMemo(() => insights.slice(0, 3), [insights]);
  const visibleStarterPrompts = coachMode === "log" ? logStarterPrompts : chatStarterPrompts;

  async function sendMessage(content: string) {
    const trimmed = content.trim();

    if (!trimmed || isStreaming) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    const nextMessages = [...messages, userMessage];

    setMessages([...nextMessages, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          mode: coachMode,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Coach request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const textChunk = decoder.decode(value, { stream: true });
        assistantContent += textChunk;
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: message.content + textChunk }
              : message,
          ),
        );
      }

      if (!assistantContent.trim()) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content:
                    coachMode === "log"
                      ? "I heard you, but I could not turn that into a reliable update. Try naming the food and meal, like: log oats shake as breakfast."
                      : "I am here. Ask me again in a little more detail and I will help you think it through.",
                }
              : message,
          ),
        );
      }

      router.refresh();
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content:
                  "I could not reach the coach service just now. Check the Groq key and try again.",
              }
            : message,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section
      className={`animate-rise-in flex flex-col bg-slate-950 text-white ${
        variant === "conversation"
          ? "min-h-0 flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4"
          : "rounded-[32px] border border-slate-900 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.25)]"
      }`}
    >
      {variant === "card" && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-200">AI coach</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Context-aware guidance
            </h2>
          </div>
          <div className="grid size-11 place-items-center rounded-2xl bg-white/10">
            <MessageCircle size={20} aria-hidden />
          </div>
        </div>
      )}

      <div
        className={`space-y-3 overflow-y-auto pr-1 ${
          variant === "conversation" ? "min-h-0 flex-1 pt-2" : "mt-5 max-h-[380px]"
        }`}
      >
        {hasConversation
          ? messages.map((message) => (
              <article
                className={`rounded-3xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-7 bg-white text-slate-950"
                    : "mr-7 border border-white/10 bg-white/[0.06] text-slate-200"
                }`}
                key={message.id}
              >
                {message.content || (
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <Loader2 className="animate-spin" size={14} aria-hidden />
                    {coachMode === "log" ? "Updating your log" : "Thinking with you"}
                  </span>
                )}
              </article>
            ))
          : visibleInsights.map((insight) => (
              <p
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-slate-200"
                key={insight}
              >
                {insight}
              </p>
            ))}
      </div>

      <div className="mt-4 grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.06] p-1 text-xs font-semibold">
        <button
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-full transition ${
            coachMode === "chat"
              ? "bg-white text-slate-950"
              : "text-slate-300 hover:bg-white/10"
          }`}
          disabled={isStreaming}
          onClick={() => setCoachMode("chat")}
          type="button"
        >
          <MessageCircle size={14} aria-hidden />
          Chat
        </button>
        <button
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-full transition ${
            coachMode === "log"
              ? "bg-white text-slate-950"
              : "text-slate-300 hover:bg-white/10"
          }`}
          disabled={isStreaming}
          onClick={() => setCoachMode("log")}
          type="button"
        >
          <ListPlus size={14} aria-hidden />
          Log
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {visibleStarterPrompts.map((prompt) => (
          <button
            className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            disabled={isStreaming}
            key={prompt}
            onClick={() => void sendMessage(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>
      <form
        className={`mt-4 flex items-center gap-2 ${
          variant === "conversation"
            ? "rounded-[28px] border border-white/10 bg-white/[0.06] p-2"
            : ""
        }`}
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="coach-message">
          Ask the AI coach
        </label>
        <input
          className="h-12 min-w-0 flex-1 rounded-full border border-white/10 bg-white px-4 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-400/20"
          disabled={isStreaming}
          id="coach-message"
          onChange={(event) => setInput(event.target.value)}
          placeholder={coachMode === "log" ? "Log food, water, or supplements..." : "Ask your coach anything..."}
          value={input}
        />
        <button
          className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isStreaming || !input.trim()}
          title={coachMode === "log" ? "Send log update" : "Send chat message"}
          type="submit"
        >
          {isStreaming ? (
            <Loader2 className="animate-spin" size={18} aria-hidden />
          ) : (
            <Send size={18} aria-hidden />
          )}
          <span className="sr-only">Send message</span>
        </button>
      </form>

      {!hasConversation && (
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-400">
          <ArrowRight size={14} aria-hidden />
          {coachMode === "log"
            ? 'Try: "Log mango shake as dinner" or "I drank 500ml water".'
            : 'Try: "How am I doing today?" or "Suggest a workout for tonight".'}
        </div>
      )}
    </section>
  );
}
