import { useState, useEffect } from 'react';

export function useModeToggle(initialMode: 'text' | 'canvas' = 'text') {
  const [mode, setMode] = useState<'text' | 'canvas'>(initialMode);
  
  const toggleMode = () => {
    setMode(prev => prev === 'text' ? 'canvas' : 'text');
  };
  
  return { mode, setMode, toggleMode };
}
