import { useEffect } from 'react';

export function useKeyboardShortcut(key: string, callback: () => void): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyParts = key.toLowerCase().split('+');
      const modifiers = {
        control: keyParts.includes('control') || keyParts.includes('ctrl'),
        shift: keyParts.includes('shift'),
        alt: keyParts.includes('alt'),
        meta: keyParts.includes('meta'),
      };
      const mainKey = keyParts[keyParts.length - 1];

      if (
        modifiers.control === e.ctrlKey &&
        modifiers.shift === e.shiftKey &&
        modifiers.alt === e.altKey &&
        modifiers.meta === e.metaKey &&
        e.key.toLowerCase() === mainKey
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback]);
}
