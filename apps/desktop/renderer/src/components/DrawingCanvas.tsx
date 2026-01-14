import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { HandwritingService, RecognitionResult } from '../services/handwriting-service';
import { HANDWRITING_CONFIG } from '../config/handwriting';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

interface DrawingCanvasProps {
  canvasData?: string;
  onCanvasChange: (data: string) => void;
  clearRef?: React.MutableRefObject<(() => void) | null>;
}

function DrawingCanvas({ canvasData, onCanvasChange, clearRef }: DrawingCanvasProps) {
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
    if (clearRef) {
      clearRef.current = clearCanvas;
    }
  }, [clearRef]);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const container = canvasRef.current.parentElement;
    const width = container?.clientWidth || 800;
    const height = container?.clientHeight || 600;
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: width,
      height: height,
      isDrawingMode: true,
    });
    canvas.freeDrawingBrush.color = '#ffffff';
    
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
      if (paths.length === 0) return;
      
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
        const bounds = {
          minX: Math.min(...strokes.map(s => s.x)),
          maxX: Math.max(...strokes.map(s => s.x)),
          minY: Math.min(...strokes.map(s => s.y)),
          maxY: Math.max(...strokes.map(s => s.y)),
        };
        
        const text = new fabric.Text(result.text, {
          left: bounds.minX,
          top: bounds.minY,
          fontSize: 20,
          fill: '#000000',
          selectable: true,
          editable: true,
        });
        
        paths.forEach(path => canvas.remove(path));
        
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
        
        const json = JSON.stringify(canvas.toJSON());
        saveHistory(canvas);
        onCanvasChange(json);
      }
    } catch (error) {
      console.error('Recognition error:', error);
    } finally {
      setIsRecognizing(false);
    }
  };
  
  return (
    <div className="w-full h-full border rounded relative overflow-hidden">
      <canvas ref={canvasRef} />
      {isRecognizing && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm">
          인식 중...
        </div>
      )}
    </div>
  );
}

export default DrawingCanvas;
