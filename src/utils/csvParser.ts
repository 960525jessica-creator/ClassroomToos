import { Student } from '../types';

export const SAMPLE_STUDENTS_LIST: { label: string; count: number; data: string[] }[] = [
  {
    label: '示範班級（28人）',
    count: 28,
    data: [
      '王小明', '陳雅婷', '林志豪', '張美玲', '李家豪', '黃詩涵', '吳冠宇',
      '劉宇軒', '蔡佳穎', '楊承翰', '許思妤', '鄭文凱', '謝佩君', '洪銘澤',
      '曾怡婷', '邱立偉', '廖郁芳', '周建宏', '徐若瑄', '賴俊傑', '石佳芸',
      '葉冠志', '潘思嘉', '鍾少緯', '游佳蓉', '簡承恩', '彭曉君', '韓天宇'
    ]
  },
  {
    label: '分組小隊（15人）',
    count: 15,
    data: [
      '林宥廷', '陳品妍', '張哲豪', '黃芷晴', '李柏毅',
      '吳采婕', '趙育德', '孫雅晴', '江浩宇', '郭芝羽',
      '朱庭緯', '高嘉萱', '柯明彥', '蘇佩芳', '魏承德'
    ]
  },
  {
    label: '英文字母示範（12人）',
    count: 12,
    data: [
      'Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank',
      'Grace', 'Henry', 'Ivy', 'Jack', 'Kelly', 'Leo'
    ]
  }
];

/**
 * Parses raw text input into a unique student list
 */
export function parseStudentsFromText(text: string): { students: Student[]; duplicates: string[] } {
  if (!text || !text.trim()) {
    return { students: [], duplicates: [] };
  }

  // Split by newlines, commas (Chinese/English), semicolons, or tabs
  const tokens = text
    .split(/[\r\n,，;；\t]+/)
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter((s) => s.length > 0);

  const seen = new Set<string>();
  const duplicates: string[] = [];
  const students: Student[] = [];

  for (const name of tokens) {
    if (seen.has(name)) {
      duplicates.push(name);
    } else {
      seen.add(name);
      students.push({
        id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
      });
    }
  }

  return { students, duplicates };
}

/**
 * Parses a CSV string, automatically recognizing common column headers
 * like 姓名, 學生姓名, Name, Student Name, etc.
 */
export function parseStudentsFromCsv(csvContent: string): { students: Student[]; detectedColumn?: string } {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { students: [] };

  // Parse lines into tokens
  const rows: string[][] = lines.map((line) => {
    // Handle CSV quoting
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });

  if (rows.length === 0) return { students: [] };

  // If first row looks like a header
  const headerRow = rows[0];
  let targetColIndex = -1;
  let detectedColumn: string | undefined = undefined;

  const nameKeywords = ['姓名', '學生姓名', '名字', '學生', 'name', 'student', 'student name', 'fullname', 'full name'];

  for (let c = 0; c < headerRow.length; c++) {
    const headerVal = headerRow[c].toLowerCase().replace(/\s+/g, '');
    if (nameKeywords.some((kw) => headerVal.includes(kw.replace(/\s+/g, '')))) {
      targetColIndex = c;
      detectedColumn = headerRow[c];
      break;
    }
  }

  const rawNames: string[] = [];
  const startRow = targetColIndex !== -1 ? 1 : 0;
  const colToUse = targetColIndex !== -1 ? targetColIndex : 0;

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (row[colToUse] && row[colToUse].trim()) {
      const val = row[colToUse].trim();
      // Filter out if by accident it matches header again
      if (nameKeywords.includes(val.toLowerCase())) continue;
      rawNames.push(val);
    }
  }

  // Deduplicate and convert to Student[]
  const seen = new Set<string>();
  const students: Student[] = [];

  for (const name of rawNames) {
    if (!seen.has(name) && name.length > 0) {
      seen.add(name);
      students.push({
        id: `csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
      });
    }
  }

  return { students, detectedColumn };
}
