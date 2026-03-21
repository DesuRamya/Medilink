import React, { useMemo, useRef, useState } from "react";
import { apiUrl } from "../lib/api";
import "../Styles/ChatBot.css";

const DEFAULT_MESSAGES = [
  {
    id: "welcome",
    role: "bot",
    text:
      "Hi! I can answer general medical questions and explain common lab terms. " +
      "I do not replace a doctor. If you have severe symptoms, seek urgent care.",
  },
];

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const pushMessage = (message) => {
    setMessages((prev) => {
      const next = [...prev, message];
      return next;
    });
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 0);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    pushMessage(userMessage);
    setInput("");

    try {
      setSending(true);
      const response = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to get response");
      }

      const botMessage = {
        id: `b_${Date.now()}`,
        role: "bot",
        text: data.reply || "I couldn't generate a response this time.",
      };
      pushMessage(botMessage);
    } catch (err) {
      const botMessage = {
        id: `b_${Date.now()}`,
        role: "bot",
        text:
          "Sorry, I'm having trouble right now. Please try again in a moment.",
      };
      pushMessage(botMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chatbot-root">
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="Medical chatbot">
          <div className="chatbot-header">
            <div>
              <div className="chatbot-title">Medilink Assistant</div>
              <div className="chatbot-subtitle">General medical questions</div>
            </div>
            <button
              type="button"
              className="chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <div className="chatbot-messages" ref={listRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-message chatbot-message--${msg.role}`}
              >
                <div className="chatbot-bubble">{msg.text}</div>
              </div>
            ))}
          </div>

          <form className="chatbot-input" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ask a medical question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!canSend || sending}>
              {sending ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chatbot-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          "×"
        ) : (
          <svg
            className="chatbot-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M12 3c-4.97 0-9 3.36-9 7.5 0 2.55 1.56 4.8 4 6.16V21l3.77-2.1c.4.05.81.1 1.23.1 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
