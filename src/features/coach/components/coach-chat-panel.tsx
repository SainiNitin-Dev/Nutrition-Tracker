"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MessageCircle, Send } from "lucide-react";

type CoachChatPanelProps = {
  insights: string[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const starterPrompts = [
  "How am I doing today?",
  "Log my Greek yogurt bowl",
  "I drank 500ml water",
];

export function CoachChatPanel({ insights }: CoachChatPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const hasConversation = messages.length > 0;

  const visibleInsights = useMemo(() => insights.slice(0, 3), [insights]);

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
                    "I heard you, but I could not turn that into a reliable update. Try naming the food and meal, like: log oats shake as breakfast.",
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
    <section className="animate-rise-in rounded-[32px] border border-slate-900 bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
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

      <div className="mt-5 max-h-[380px] space-y-3 overflow-y-auto pr-1">
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
                    Thinking through your logs
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

      <div className="mt-4 flex flex-wrap gap-2">
        {starterPrompts.map((prompt) => (
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

      <form className="mt-4 flex items-center gap-2" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="coach-message">
          Ask the AI coach
        </label>
        <input
          className="h-12 min-w-0 flex-1 rounded-full border border-white/10 bg-white px-4 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-400/20"
          disabled={isStreaming}
          id="coach-message"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask or log something..."
          value={input}
        />
        <button
          className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isStreaming || !input.trim()}
          title="Send message"
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
          {'Try: "Log my Greek yogurt bowl" or "I drank 500ml water".'}
        </div>
      )}
    </section>
  );
}
