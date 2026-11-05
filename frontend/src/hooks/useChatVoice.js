import { useCallback, useEffect, useRef, useState } from "react";

const recognitionAvailable = () =>
  typeof window !== "undefined" &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

const synthesisAvailable = () =>
  typeof window !== "undefined" &&
  Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);

function friendlySpeechError(code) {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied. Allow microphone access in your browser settings.";
    case "audio-capture":
      return "No microphone was found. Check your audio input device.";
    case "no-speech":
      return "I couldn't hear anything. Try again or type your question.";
    case "network":
      return "Speech recognition couldn't connect. Try again or type your question.";
    case "language-not-supported":
      return "Your browser doesn't support recognition in this language.";
    default:
      return "Voice input didn't work this time. You can still type your question.";
  }
}

function spokenText(text) {
  return String(text ?? "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function useChatVoice({ onTranscript, language = "en-ZA" }) {
  const onTranscriptRef = useRef(onTranscript);
  const recognitionRef = useRef(null);
  const speechSequenceRef = useRef(0);
  const [voiceInputSupported] = useState(recognitionAvailable);
  const [speechOutputSupported] = useState(synthesisAvailable);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [speakingId, setSpeakingId] = useState(null);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  // Discard any pending dictation (for closing, new conversation, and logout).
  const cancelListening = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.abort(); } catch { /* Browser may already have stopped. */ }
    }
    setListening(false);
    setInterimTranscript("");
  }, []);

  const stopSpeaking = useCallback(() => {
    speechSequenceRef.current += 1;
    if (synthesisAvailable()) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const toggleListening = useCallback(() => {
    if (!voiceInputSupported) {
      setVoiceError("Voice input is not supported by this browser. Please type instead.");
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { cancelListening(); }
      return;
    }
    stopSpeaking(); // Avoid the assistant listening to its own spoken reply.
    setVoiceError("");
    setInterimTranscript("");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const finalPieces = [];
      const interimPieces = [];
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i]?.[0]?.transcript?.trim();
        if (!text) continue;
        if (event.results[i].isFinal) finalPieces.push(text);
        else interimPieces.push(text);
      }
      setInterimTranscript(interimPieces.join(" "));
      if (finalPieces.length) onTranscriptRef.current?.(finalPieces.join(" "));
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setVoiceError(friendlySpeechError(event.error));
      setListening(false);
      setInterimTranscript("");
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setListening(false);
      setInterimTranscript("");
    };

    try { recognition.start(); }
    catch {
      recognitionRef.current = null;
      setListening(false);
      setVoiceError("Couldn't start microphone input. Check browser permissions.");
    }
  }, [voiceInputSupported, language, stopSpeaking, cancelListening]);

  const speak = useCallback((text, id) => {
    if (!speechOutputSupported) return;
    if (speakingId === id) {
      stopSpeaking();
      return;
    }
    cancelListening();
    stopSpeaking();
    const content = spokenText(text);
    if (!content) return;
    const sequence = ++speechSequenceRef.current;
    const utterance = new window.SpeechSynthesisUtterance(content);
    utterance.lang = language;
    utterance.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    const selected = voices.find((voice) => voice.lang.toLowerCase() === language.toLowerCase())
      || voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (selected) utterance.voice = selected;
    utterance.onend = () => {
      if (speechSequenceRef.current === sequence) setSpeakingId(null);
    };
    utterance.onerror = () => {
      if (speechSequenceRef.current === sequence) setSpeakingId(null);
    };
    setSpeakingId(id);
    try { window.speechSynthesis.speak(utterance); }
    catch { setSpeakingId(null); }
  }, [speechOutputSupported, speakingId, stopSpeaking, cancelListening, language]);

  useEffect(() => () => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.abort(); } catch { /* no-op */ }
    }
    speechSequenceRef.current += 1;
    if (synthesisAvailable()) window.speechSynthesis.cancel();
  }, []);

  return {
    voiceInputSupported, speechOutputSupported,
    listening, interimTranscript, voiceError,
    speakingId, toggleListening, cancelListening, speak, stopSpeaking,
  };
}
