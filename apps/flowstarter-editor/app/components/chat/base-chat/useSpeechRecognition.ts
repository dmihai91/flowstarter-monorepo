/**
 * BaseChat - Speech Recognition Hook
 *
 * Handles speech recognition for voice input.
 */

import { useEffect, useState } from 'react';

interface UseSpeechRecognitionOptions {
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  recognition: SpeechRecognition | null;
  startListening: () => void;
  stopListening: () => void;
  setTranscript: (transcript: string) => void;
  setIsListening: (listening: boolean) => void;
}

export function useSpeechRecognition({
  handleInputChange,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;

      recognitionInstance.onresult = (event) => {
        const newTranscript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');

        setTranscript(newTranscript);

        if (handleInputChange) {
          const syntheticEvent = {
            target: { value: newTranscript },
          } as React.ChangeEvent<HTMLTextAreaElement>;
          handleInputChange(syntheticEvent);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    recognition,
    startListening,
    stopListening,
    setTranscript,
    setIsListening,
  };
}

