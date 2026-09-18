export interface Student {
  id: string;
  name: string;
}

export type DrawMode = 'allow_repeat' | 'no_repeat';

export interface DrawHistoryItem {
  id: string;
  name: string;
  timestamp: number;
}

export type GroupMode = 'by_size' | 'by_count'; // 每組幾人 vs 共分幾組
export type RemainderStrategy = 'distribute' | 'new_group'; // 餘數平均分配 vs 獨立一組

export interface StudentGroup {
  id: string;
  number: number;
  name: string;
  members: Student[];
  color: string;
}
