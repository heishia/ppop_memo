declare module 'fabric' {
  export namespace fabric {
    class Object {
      type?: string;
    }

    class Path extends Object {
      path: any[];
    }

    class Text extends Object {
      constructor(text: string, options?: Record<string, any>);
    }

    class Canvas {
      constructor(element: HTMLCanvasElement, options?: Record<string, any>);

      freeDrawingBrush: {
        color: string;
      };

      add(...objects: Object[]): Canvas;
      calcOffset(): void;
      clear(): void;
      dispose(): void;
      getHeight(): number;
      getObjects(): Object[];
      getWidth(): number;
      loadFromJSON(data: any, callback?: () => void): void;
      on(eventName: string, handler: (...args: any[]) => void): void;
      remove(object: Object): Canvas;
      renderAll(): void;
      requestRenderAll(): void;
      setActiveObject(object: Object): Canvas;
      setDimensions(dimensions: { width: number; height: number }): void;
      toJSON(): any;
    }
  }
}
