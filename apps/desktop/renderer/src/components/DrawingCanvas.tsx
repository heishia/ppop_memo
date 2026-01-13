import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { HandwritingService, RecognitionResult } from '../services/handwriting-service';
import { HANDWRITING_CONFIG } from '../config/handwriting';

interface DrawingCanvasProps {
  canvasData?: string;
  onCanvasChange: (data: string) => void;
  onTextRecognized?: (text: string) => void;
}

function DrawingCanvas({ canvasData, onCanvasChange, onTextRecognized }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  
  useEffect(() => {
    HandwritingService.initialize();
  }, []);
  
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
        });
      } catch (e) {
        console.error('Failed to load canvas data:', e);
      }
    }
    
    let recognitionTimeout: NodeJS.Timeout;
    
    canvas.on('path:created', () => {
      const json = JSON.stringify(canvas.toJSON());
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
    </div>
  );
}

export default DrawingCanvas;
