import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Chatbot from "../components/Chatbot";

vi.mock("../hooks/useChatVoice", () => ({
  useChatVoice: () => ({
    voiceInputSupported: false,
    speechOutputSupported: false,
    listening: false,
    interimTranscript: "",
    voiceError: "",
    speakingId: null,
    toggleListening: vi.fn(),
    cancelListening: vi.fn(),
    speak: vi.fn(),
    stopSpeaking: vi.fn(),
  }),
}));

describe("chatbot accessibility", () => {
  it("keeps the suggested questions and their decorative icons available", () => {
    render(
      <MemoryRouter>
        <Chatbot role="attendee" />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open chat assistant" }));
    const questions = [
      "Find conferences",
      "How do I register?",
      "Where can I see conference details?",
      "Conferences in South Africa",
    ];

    for (const question of questions) {
      const card = screen.getByRole("button", { name: question });
      const icon = card.querySelector(".cmt-chat-starter-icon > svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }

    expect(screen.getByRole("button", { name: "Close chat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Speak your question" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });
});
