/**
 * useVoiceInput - Web Speech API hook
 * 
 * Handles voice recognition with live transcript
 */

import { useState, useEffect, useRef } from "react";

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  enabled?: boolean;
}

export function useVoiceInput({ onTranscript, onFinalTranscript, enabled = false }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check if Web Speech API is available
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Start listening
  const startListening = () => {
    if (!isSupported) {
      setError("Voice input not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // Can be made configurable

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      // Update live transcript (interim + final)
      const fullTranscript = finalTranscript + interimTranscript;
      setTranscript(fullTranscript.trim());
      onTranscript(fullTranscript.trim());

      // If we have final transcript, call callback
      if (finalTranscript) {
        onFinalTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "no-speech") {
        setError("No speech detected");
      } else if (event.error === "not-allowed") {
        setError("Microphone permission denied");
      } else {
        setError(`Error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (err) {
      setError("Failed to start voice recognition");
      setIsListening(false);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (enabled && isSupported && !isListening) {
      startListening();
    } else if (!enabled && isListening) {
      stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isSupported]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}

