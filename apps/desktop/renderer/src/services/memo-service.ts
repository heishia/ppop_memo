export class MemoService {
  static async create(): Promise<any> {
    return await window.electronAPI.memo.create();
  }
  
  static async get(id: number): Promise<any> {
    return await window.electronAPI.memo.get(id);
  }
  
  static async update(id: number, data: { title?: string; content?: string; canvas_data?: string; mode?: string }): Promise<any> {
    return await window.electronAPI.memo.update(id, data);
  }
  
  static async delete(id: number): Promise<any> {
    return await window.electronAPI.memo.delete(id);
  }
  
  static async list(): Promise<any[]> {
    return await window.electronAPI.memo.list();
  }
  
  static async search(query: string): Promise<any[]> {
    return await window.electronAPI.memo.search(query);
  }
}
