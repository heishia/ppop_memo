import React, { useEffect } from 'react';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

interface ModeToggleButtonProps {
  mode: 'text' | 'canvas';
  onToggle: (mode: 'text' | 'canvas') => void;
}

function ModeToggleButton({ mode, onToggle }: ModeToggleButtonProps) {
  useKeyboardShortcut('Control+t', () => {
    onToggle(mode === 'text' ? 'canvas' : 'text');
  });

  return (
    <button
      onClick={() => onToggle(mode === 'text' ? 'canvas' : 'text')}
      className="absolute bottom-3 right-3 px-3 py-1.5 bg-blue-500 text-white text-sm rounded shadow hover:bg-blue-600 transition-colors"
    >
      {mode === 'text' ? 'Canvas 모드' : 'Text 모드'}
    </button>
  );
}

export default ModeToggleButton;
