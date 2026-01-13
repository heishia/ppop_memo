import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { HandwritingService, RecognitionResult } from '../services/handwriting-service';
import { HANDWRITING_CONFIG } from '../config/handwriting';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

interface DrawingCanvasProps {
  canvasData?: string;
  onCanvasChange: (data: string) => void;
  onTextRecognized?: (text: string) => void;
}

function DrawingCanvas({ canvasData, onCanvasChange, onTextRecognized }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUndoRedoRef = useRef(false);
  
  useEffect(() => {
    HandwritingService.initialize();
  }, []);
  
  const saveHistory = (canvas: fabric.Canvas) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const json = JSON.stringify(canvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
  };

  const undo = () => {
    if (!fabricCanvasRef.current || historyIndexRef.current <= 0) return;

    isUndoRedoRef.current = true;
    historyIndexRef.current--;
    const previousState = historyRef.current[historyIndexRef.current];
    
    fabricCanvasRef.current.loadFromJSON(JSON.parse(previousState), () => {
      fabricCanvasRef.current?.renderAll();
      onCanvasChange(previousState);
    });
  };

  const redo = () => {
    if (!fabricCanvasRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;

    isUndoRedoRef.current = true;
    historyIndexRef.current++;
    const nextState = historyRef.current[historyIndexRef.current];
    
    fabricCanvasRef.current.loadFromJSON(JSON.parse(nextState), () => {
      fabricCanvasRef.current?.renderAll();
      onCanvasChange(nextState);
    });
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;

    fabricCanvasRef.current.clear();
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    saveHistory(fabricCanvasRef.current);
    onCanvasChange(json);
  };

  useKeyboardShortcut('ctrl+z', undo);
  useKeyboardShortcut('ctrl+shift+z', redo);
  useKeyboardShortcut('ctrl+y', redo);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      isDrawingMode: true,
    });
    
    fabricCanvasRef.current = canvas;
    
    if (canvasData) {
      try {
        const data = JSON.parse(canvasData);
        canvas.loadFromJSON(data, () => {
          canvas.renderAll();
          historyRef.current = [canvasData];
          historyIndexRef.current = 0;
        });
      } catch (e) {
        console.error('Failed to load canvas data:', e);
      }
    } else {
      const initialState = JSON.stringify(canvas.toJSON());
      historyRef.current = [initialState];
      historyIndexRef.current = 0;
    }
    
    let recognitionTimeout: NodeJS.Timeout;
    
    canvas.on('path:created', () => {
      const json = JSON.stringify(canvas.toJSON());
      saveHistory(canvas);
      onCanvasChange(json);
      
      if (HANDWRITING_CONFIG.AUTO_CONVERT_ENABLED) {
        if (recognitionTimeout) {
          clearTimeout(recognitionTimeout);
        }
        
        recognitionTimeout = setTimeout(async () => {
          await recognizeAndConvert(canvas);
        }, 1000);
      }
    });

    canvas.on('object:modified', () => {
      const json = JSON.stringify(canvas.toJSON());
      saveHistory(canvas);
      onCanvasChange(json);
    });
    
    return () => {
      if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
      }
      canvas.dispose();
    };
  }, []);
  
  const recognizeAndConvert = async (canvas: fabric.Canvas) => {
    setIsRecognizing(true);
    try {
      const paths = canvas.getObjects().filter(obj => obj.type === 'path') as fabric.Path[];
      const strokes = paths.map(path => {
        const pathData = path.path;
        return pathData.map((point: any[]) => ({
          x: point[1],
          y: point[2],
        }));
      }).flat();
      
      if (strokes.length === 0) return;
      
      const result = await HandwritingService.recognizeHandwriting(strokes);
      
      if (result && HandwritingService.shouldConvertToText(result)) {
        if (onTextRecognized) {
          onTextRecognized(result.text);
        }
      }
    } catch (error) {
      console.error('Recognition error:', error);
    } finally {
      setIsRecognizing(false);
    }
  };
  
  return (
    <div className="w-full h-full border rounded relative">
      <canvas ref={canvasRef} />
      {isRecognizing && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm">
          인식 중...
        </div>
      )}
      <button
        onClick={clearCanvas}
        className="absolute bottom-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg transition-colors duration-200 flex items-center gap-2"
        title="캔버스 초기화 (모두 지우기)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        초기화
      </button>
    </div>
  );
}

export default DrawingCanvas;
