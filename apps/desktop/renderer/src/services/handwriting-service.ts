import { HANDWRITING_CONFIG } from '../config/handwriting';

export interface RecognitionResult {
  text: string;
  confidence: number;
}

export class HandwritingService {
  private static iinkTSAvailable = false;
  private static tesseractAvailable = false;
  
  static async initialize(): Promise<void> {
    try {
      const moduleName = '@myscript/iink';
      const iinkModule = await import(/* @vite-ignore */ moduleName).catch(() => null);
      if (iinkModule && iinkModule.Editor && typeof iinkModule.Editor === 'function') {
        this.iinkTSAvailable = true;
      }
    } catch (error) {
      console.warn('iinkTS not available:', error);
    }
    
    try {
      const { createWorker } = await import('tesseract.js');
      this.tesseractAvailable = true;
    } catch (error) {
      console.warn('Tesseract.js not available:', error);
    }
  }
  
  static async recognizeHandwriting(strokes: any[]): Promise<RecognitionResult | null> {
    if (this.iinkTSAvailable) {
      try {
        return await this.recognizeWithIinkTS(strokes);
      } catch (error) {
        console.error('iinkTS recognition failed:', error);
      }
    }
    
    if (this.tesseractAvailable) {
      try {
        return await this.recognizeWithTesseract(strokes);
      } catch (error) {
        console.error('Tesseract recognition failed:', error);
      }
    }
    
    return null;
  }
  
  private static async recognizeWithIinkTS(strokes: any[]): Promise<RecognitionResult> {
    try {
      const moduleName = '@myscript/iink';
      const iinkModule = await import(/* @vite-ignore */ moduleName).catch(() => null);
      if (!iinkModule || !iinkModule.Editor || typeof iinkModule.Editor !== 'function') {
        throw new Error('iinkTS module not available');
      }
      
      const { Editor } = iinkModule;
      const editor = new Editor({
        recognitionParams: {
          type: 'TEXT',
          protocol: 'WEBSOCKET',
          apiKey: process.env.MYSCRIPT_API_KEY || '',
          hmacKey: process.env.MYSCRIPT_HMAC_KEY || '',
          server: {
            scheme: 'https',
            host: 'cloud.myscript.com',
            applicationKey: process.env.MYSCRIPT_APPLICATION_KEY || '',
            hmacKey: process.env.MYSCRIPT_HMAC_KEY || '',
          },
        },
      });
      
      const result = await editor.recognize(strokes);
      return {
        text: result.text || '',
        confidence: result.confidence || 0,
      };
    } catch (error) {
      throw new Error(`iinkTS recognition failed: ${error}`);
    }
  }
  
  private static async recognizeWithTesseract(strokes: any[]): Promise<RecognitionResult> {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('kor');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    strokes.forEach((stroke, index) => {
      if (index > 0) ctx.moveTo(stroke.x, stroke.y);
      ctx.lineTo(stroke.x, stroke.y);
    });
    ctx.stroke();
    
    const { data } = await worker.recognize(canvas);
    await worker.terminate();
    
    return {
      text: data.text,
      confidence: data.confidence / 100,
    };
  }
  
  static shouldConvertToText(result: RecognitionResult | null): boolean {
    if (!result) return false;
    return result.confidence >= HANDWRITING_CONFIG.TEXT_CONVERSION_THRESHOLD;
  }
}
