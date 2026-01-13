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
      className="fixed bottom-4 right-4 px-4 py-2 bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600"
    >
      {mode === 'text' ? 'Canvas 모드' : 'Text 모드'}
    </button>
  );
}

export default ModeToggleButton;
