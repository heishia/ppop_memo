import { MemoService } from './memo-service';

export class SearchService {
  static async searchMemos(query: string): Promise<any[]> {
    if (!query.trim()) {
      return await MemoService.list();
    }
    return await MemoService.search(query);
  }
  
  static highlightText(text: string, query: string): string {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
