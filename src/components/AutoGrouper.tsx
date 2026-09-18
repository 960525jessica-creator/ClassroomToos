import React, { useState, useEffect } from 'react';
import { Student, StudentGroup, GroupMode, RemainderStrategy } from '../types';
import { createGroups, formatGroupsAsText, GROUP_COLOR_THEMES } from '../utils/grouping';
import { soundEngine } from '../utils/audio';
import { 
  Users2, 
  Shuffle, 
  Copy, 
  Check, 
  Share2, 
  HelpCircle, 
  ChevronRight, 
  SlidersHorizontal,
  ArrowRightLeft,
  X
} from 'lucide-react';

interface AutoGrouperProps {
  students: Student[];
  onOpenRoster: () => void;
}

export const AutoGrouper: React.FC<AutoGrouperProps> = ({
  students,
  onOpenRoster,
}) => {
  const [groupMode, setGroupMode] = useState<GroupMode>('by_size');
  const [sizeValue, setSizeValue] = useState<number>(4); // default 4 per group
  const [countValue, setCountValue] = useState<number>(6); // default 6 groups
  const [remainderStrategy, setRemainderStrategy] = useState<RemainderStrategy>('distribute');
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [movingStudent, setMovingStudent] = useState<{ student: Student; fromGroupId: string } | null>(null);

  // Auto-generate or update default counts when student list loads
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      handleGenerateGroups();
    }
  }, [students.length]);

  const handleGenerateGroups = () => {
    if (students.length === 0) {
      onOpenRoster();
      return;
    }

    setIsShuffling(true);
    soundEngine.playShuffle();

    setTimeout(() => {
      const targetNumber = groupMode === 'by_size' ? sizeValue : countValue;
      const result = createGroups(students, groupMode, targetNumber, remainderStrategy);
      setGroups(result);
      setIsShuffling(false);
      setMovingStudent(null);
    }, 450);
  };

  const handleCopyText = () => {
    if (groups.length === 0) return;
    const formatted = formatGroupsAsText(groups, students.length);
    navigator.clipboard.writeText(formatted).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback
    });
  };

  // Move a student from one group to another
  const handleMoveStudent = (targetGroupId: string) => {
    if (!movingStudent || movingStudent.fromGroupId === targetGroupId) {
      setMovingStudent(null);
      return;
    }

    setGroups((prev) => {
      return prev.map((g) => {
        if (g.id === movingStudent.fromGroupId) {
          return {
            ...g,
            members: g.members.filter((m) => m.id !== movingStudent.student.id),
          };
        }
        if (g.id === targetGroupId) {
          return {
            ...g,
            members: [...g.members, movingStudent.student],
          };
        }
        return g;
      });
    });

    setMovingStudent(null);
  };

  // Quick stats calculation
  const total = students.length;
  const currentTargetNumber = groupMode === 'by_size' ? sizeValue : countValue;
  const expectedGroupsCount =
    groupMode === 'by_size'
      ? Math.ceil(total / Math.max(1, sizeValue))
      : Math.min(total, countValue);

  return (
    <div id="auto-grouper-container" className="space-y-6">
      {/* Configuration Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">分組設定</h3>
              <p className="text-xs text-slate-500">
                目前名單學生總數：<span className="font-semibold text-indigo-600">{total}</span> 人
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {groups.length > 0 && (
              <button
                id="copy-group-result-btn"
                type="button"
                onClick={handleCopyText}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已複製到剪貼簿！' : '複製分組名單'}
              </button>
            )}

            <button
              id="generate-groups-btn"
              type="button"
              onClick={handleGenerateGroups}
              disabled={isShuffling || students.length === 0}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-2 ${
                isShuffling || students.length === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-200 cursor-pointer'
              }`}
            >
              <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin' : ''}`} />
              {isShuffling ? '隨機分組中...' : groups.length > 0 ? '重新隨機洗牌分組' : '開始自動分組'}
            </button>
          </div>
        </div>

        {/* Setting Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          {/* Grouping Rule Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              分組方式
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="mode-by-size-btn"
                type="button"
                onClick={() => setGroupMode('by_size')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  groupMode === 'by_size'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                每組設定幾人
              </button>
              <button
                id="mode-by-count-btn"
                type="button"
                onClick={() => setGroupMode('by_count')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  groupMode === 'by_count'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                共分成幾組
              </button>
            </div>
          </div>

          {/* Number Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              {groupMode === 'by_size' ? '每組人數' : '分組數量'}
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    if (groupMode === 'by_size') setSizeValue((prev) => Math.max(2, prev - 1));
                    else setCountValue((prev) => Math.max(2, prev - 1));
                  }}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  -
                </button>
                <input
                  id="group-number-input"
                  type="number"
                  min={1}
                  max={Math.max(2, total)}
                  value={groupMode === 'by_size' ? sizeValue : countValue}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    if (groupMode === 'by_size') setSizeValue(val);
                    else setCountValue(val);
                  }}
                  className="w-16 text-center text-sm font-bold text-slate-800 border-x border-slate-200 py-1.5 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (groupMode === 'by_size') setSizeValue((prev) => Math.min(total || 50, prev + 1));
                    else setCountValue((prev) => Math.min(total || 50, prev + 1));
                  }}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-1">
                {(groupMode === 'by_size' ? [2, 3, 4, 5, 6] : [2, 3, 4, 6, 8]).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (groupMode === 'by_size') setSizeValue(num);
                      else setCountValue(num);
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                      (groupMode === 'by_size' ? sizeValue : countValue) === num
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Remainder Strategy */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              無法整除時的餘數處理
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="strategy-distribute-btn"
                type="button"
                onClick={() => setRemainderStrategy('distribute')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  remainderStrategy === 'distribute'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                平均分配到各組
              </button>
              <button
                id="strategy-new-group-btn"
                type="button"
                onClick={() => setRemainderStrategy('new_group')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  remainderStrategy === 'new_group'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                獨立為額外一組
              </button>
            </div>
          </div>
        </div>

        {/* Prediction info badge */}
        {total > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              預估將分為約 <strong className="text-slate-800 font-bold">{expectedGroupsCount}</strong> 組（
              {groupMode === 'by_size'
                ? `每組約 ${sizeValue} 人`
                : `每組約 ${Math.round(total / countValue)} 人`}
              ）
            </span>
            {movingStudent && (
              <span className="text-amber-600 font-semibold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 animate-pulse">
                <ArrowRightLeft className="w-3 h-3" />
                正在移動「{movingStudent.student.name}」，請點選要移入的目標組別
                <button
                  type="button"
                  onClick={() => setMovingStudent(null)}
                  className="ml-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Visual Groups Display Grid */}
      {students.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <Users2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 mb-1">尚未建立學生名單</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            請先透過上方名單管理按鈕上傳 CSV 或是直接貼上名單，即可為學生自動分組！
          </p>
          <button
            id="empty-roster-group-btn"
            type="button"
            onClick={onOpenRoster}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-xs"
          >
            建立名單
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200">
          <Shuffle className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 mb-1">準備好分組了嗎？</h4>
          <p className="text-xs text-slate-500 mb-4">
            點擊「開始自動分組」按鈕，系統將自動洗牌並視覺化展現分組結果。
          </p>
          <button
            type="button"
            onClick={handleGenerateGroups}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-md"
          >
            立即開始分組
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users2 className="w-4 h-4 text-indigo-600" />
              視覺化分組結果（共 {groups.length} 組）
            </div>
            <div className="text-xs text-slate-400">
              💡 提示：點擊學生旁邊的交換圖示，可自由調整移至其他組別
            </div>
          </div>

          <div
            id="groups-visual-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {groups.map((group, groupIdx) => {
              const theme = GROUP_COLOR_THEMES[groupIdx % GROUP_COLOR_THEMES.length];
              const isTargetMove = movingStudent && movingStudent.fromGroupId !== group.id;

              return (
                <div
                  key={group.id}
                  id={`group-card-${group.number}`}
                  className={`relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col bg-white shadow-xs ${
                    isTargetMove
                      ? 'border-indigo-400 ring-2 ring-indigo-400/40 bg-indigo-50/20 cursor-pointer hover:bg-indigo-50/40'
                      : 'border-slate-200/90 hover:shadow-md'
                  }`}
                  onClick={() => {
                    if (isTargetMove) {
                      handleMoveStudent(group.id);
                    }
                  }}
                >
                  {/* Group Header Banner */}
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${theme.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${theme.badge}`}>
                        {group.number}
                      </span>
                      <span className="font-bold text-sm tracking-tight">{group.name}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white/80 border border-current/20 shadow-2xs">
                      {group.members.length} 人
                    </span>
                  </div>

                  {/* Members list */}
                  <div className="p-3.5 flex-1 space-y-1.5 min-h-[140px]">
                    {group.members.map((member, mIdx) => {
                      const isBeingMoved = movingStudent?.student.id === member.id;
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs transition-all ${
                            isBeingMoved
                              ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold ring-2 ring-amber-300'
                              : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100/80 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px] font-mono text-slate-400 w-4">
                              {mIdx + 1}.
                            </span>
                            <span className="font-medium truncate">{member.name}</span>
                          </div>

                          <button
                            type="button"
                            title="移動至其他組別"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isBeingMoved) {
                                setMovingStudent(null);
                              } else {
                                setMovingStudent({ student: member, fromGroupId: group.id });
                              }
                            }}
                            className={`p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors ${
                              isBeingMoved ? 'text-amber-700 bg-amber-200/50' : ''
                            }`}
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {group.members.length === 0 && (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 py-6 border border-dashed border-slate-200 rounded-xl">
                        此組目前無成員
                      </div>
                    )}
                  </div>

                  {/* Move Target Action Overlay if currently in moving state */}
                  {isTargetMove && (
                    <div className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold text-center hover:bg-indigo-700 transition-colors">
                      點擊移至此組
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
