import { useState, useRef } from 'react';
import axios from 'axios';

export const useJarvisAdvisor = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const requestJarvisReport = async (context?: string) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/v1/advisor/jarvis-report', 
        { context },
        { responseType: 'blob' } // Important to get the audio file
      );

      const audioBlob = response.data;
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Error playing audio');
      };

      await audio.play();
    } catch (err: any) {
      console.error('Jarvis Report Error:', err);
      setError(err.message || 'Unknown error');
      setIsPlaying(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const stopJarvisReport = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return {
    requestJarvisReport,
    stopJarvisReport,
    isPlaying,
    isGenerating,
    error,
  };
};
