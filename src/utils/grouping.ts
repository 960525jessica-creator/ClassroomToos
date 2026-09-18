import { Student, StudentGroup, GroupMode, RemainderStrategy } from '../types';

export const GROUP_COLOR_THEMES = [
  { bg: 'bg-indigo-50 border-indigo-200 text-indigo-900', badge: 'bg-indigo-600 text-white', ring: 'ring-indigo-300', dot: 'bg-indigo-500' },
  { bg: 'bg-emerald-50 border-emerald-200 text-emerald-900', badge: 'bg-emerald-600 text-white', ring: 'ring-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-50 border-amber-200 text-amber-900', badge: 'bg-amber-600 text-white', ring: 'ring-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-rose-50 border-rose-200 text-rose-900', badge: 'bg-rose-600 text-white', ring: 'ring-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-sky-50 border-sky-200 text-sky-900', badge: 'bg-sky-600 text-white', ring: 'ring-sky-300', dot: 'bg-sky-500' },
  { bg: 'bg-purple-50 border-purple-200 text-purple-900', badge: 'bg-purple-600 text-white', ring: 'ring-purple-300', dot: 'bg-purple-500' },
  { bg: 'bg-orange-50 border-orange-200 text-orange-900', badge: 'bg-orange-600 text-white', ring: 'ring-orange-300', dot: 'bg-orange-500' },
  { bg: 'bg-teal-50 border-teal-200 text-teal-900', badge: 'bg-teal-600 text-white', ring: 'ring-teal-300', dot: 'bg-teal-500' },
  { bg: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900', badge: 'bg-fuchsia-600 text-white', ring: 'ring-fuchsia-300', dot: 'bg-fuchsia-500' },
  { bg: 'bg-lime-50 border-lime-200 text-lime-900', badge: 'bg-lime-600 text-white', ring: 'ring-lime-300', dot: 'bg-lime-500' },
  { bg: 'bg-cyan-50 border-cyan-200 text-cyan-900', badge: 'bg-cyan-600 text-white', ring: 'ring-cyan-300', dot: 'bg-cyan-500' },
  { bg: 'bg-pink-50 border-pink-200 text-pink-900', badge: 'bg-pink-600 text-white', ring: 'ring-pink-300', dot: 'bg-pink-500' },
];

/**
 * Fisher-Yates array shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Creates groups based on mode (by size or by count)
 */
export function createGroups(
  students: Student[],
  mode: GroupMode,
  sizeOrCount: number,
  remainderStrategy: RemainderStrategy = 'distribute'
): StudentGroup[] {
  if (students.length === 0 || sizeOrCount <= 0) return [];

  const shuffled = shuffleArray(students);
  const total = shuffled.length;

  let groupBuckets: Student[][] = [];

  if (mode === 'by_size') {
    const size = Math.max(1, Math.min(sizeOrCount, total));
    const fullGroupsCount = Math.floor(total / size);
    const remainder = total % size;

    if (remainder === 0 || fullGroupsCount === 0) {
      // Clean split or fewer students than target size
      const count = Math.ceil(total / size);
      groupBuckets = Array.from({ length: count }, () => []);
      for (let i = 0; i < total; i++) {
        const gIdx = Math.floor(i / size);
        groupBuckets[gIdx].push(shuffled[i]);
      }
    } else if (remainderStrategy === 'distribute') {
      // Distribute the remaining students into existing groups
      groupBuckets = Array.from({ length: fullGroupsCount }, () => []);
      // Fill base
      let currentIdx = 0;
      for (let g = 0; g < fullGroupsCount; g++) {
        for (let s = 0; s < size; s++) {
          groupBuckets[g].push(shuffled[currentIdx++]);
        }
      }
      // Distribute leftover
      let targetG = 0;
      while (currentIdx < total) {
        groupBuckets[targetG % fullGroupsCount].push(shuffled[currentIdx++]);
        targetG++;
      }
    } else {
      // Remainder forms an extra standalone group
      const count = fullGroupsCount + 1;
      groupBuckets = Array.from({ length: count }, () => []);
      for (let i = 0; i < total; i++) {
        const gIdx = Math.floor(i / size);
        groupBuckets[gIdx].push(shuffled[i]);
      }
    }
  } else {
    // Mode: by_count (分成幾組)
    const numGroups = Math.max(1, Math.min(sizeOrCount, total));
    groupBuckets = Array.from({ length: numGroups }, () => []);

    // Evenly distribute in round-robin fashion for balanced sizes
    for (let i = 0; i < total; i++) {
      groupBuckets[i % numGroups].push(shuffled[i]);
    }
  }

  // Filter out any accidentally empty groups
  const nonEmptyBuckets = groupBuckets.filter((b) => b.length > 0);

  return nonEmptyBuckets.map((members, idx) => {
    const theme = GROUP_COLOR_THEMES[idx % GROUP_COLOR_THEMES.length];
    return {
      id: `group_${idx + 1}_${Date.now()}`,
      number: idx + 1,
      name: `第 ${idx + 1} 組`,
      members,
      color: theme.bg,
    };
  });
}

/**
 * Format grouping result as clean text for copying / export
 */
export function formatGroupsAsText(groups: StudentGroup[], totalStudents: number): string {
  const dateStr = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  let text = `📋 課堂分組名單（${dateStr}）\n共 ${totalStudents} 位學生，分成 ${groups.length} 組\n\n`;

  groups.forEach((g) => {
    const memberNames = g.members.map((m) => m.name).join('、');
    text += `【${g.name}】（共 ${g.members.length} 人）\n${memberNames}\n\n`;
  });

  return text.trim();
}
