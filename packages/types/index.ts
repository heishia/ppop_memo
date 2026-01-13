export interface Memo {
  id: number;
  title: string;
  content: string;
  canvas_data?: string;
  mode: 'text' | 'canvas';
  folder_id?: number;
  created_at: string;
  updated_at: string;
  window_state?: string;
}

export interface Folder {
  id: number;
  name: string;
  parent_id?: number;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  created_at: string;
}
