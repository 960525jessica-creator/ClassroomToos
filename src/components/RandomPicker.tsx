import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Student, DrawMode, DrawHistoryItem } from '../types';
import { soundEngine } from '../utils/audio';
import { 
  Sparkles, 
  RotateCcw, 
  History, 
  Settings2, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  CheckCircle2, 
  HelpCircle,
  Trophy,
  UserCheck
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  onOpenRoster: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onOpenRoster,
}) => {
  const [drawMode, setDrawMode] = useState<DrawMode>('no_repeat');
  const [remainingStudentIds, setRemainingStudentIds] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDisplayWinner, setCurrentDisplayWinner] = useState<string | null>(null);
  const [tickerName, setTickerName] = useState<string>('等待抽籤');
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sync remaining students when student list changes
  useEffect(() => {
    const validIds = students.map((s) => s.id);
    setRemainingStudentIds((prev) => {
      // Filter previous ids that still exist in students
      const filtered = prev.filter((id) => validIds.includes(id));
      // If none left or fresh initialization, reset to all
      if (filtered.length === 0 && validIds.length > 0) {
        return validIds;
      }
      return filtered;
    });
  }, [students]);

  // Handle draw mode switch
  const handleModeChange = (mode: DrawMode) => {
    setDrawMode(mode);
    if (mode === 'no_repeat') {
      // Reset remaining pool to all students
      setRemainingStudentIds(students.map((s) => s.id));
    }
  };

  const handleResetPool = () => {
    setRemainingStudentIds(students.map((s) => s.id));
    setCurrentDisplayWinner(null);
    setTickerName('等待抽籤');
  };

  const toggleSound = () => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Main Draw Action with Animation & Sound
  const handleStartDraw = () => {
    if (students.length === 0) {
      onOpenRoster();
      return;
    }

    // Determine eligible pool
    let eligibleStudents: Student[] = [];
    if (drawMode === 'allow_repeat') {
      eligibleStudents = students;
    } else {
      eligibleStudents = students.filter((s) => remainingStudentIds.includes(s.id));
      if (eligibleStudents.length === 0) {
        // Pool is exhausted!
        if (window.confirm('所有學生皆已抽出過一輪！要重置名單重新開始抽籤嗎？')) {
          handleResetPool();
        }
        return;
      }
    }

    if (isDrawing) return;

    setIsDrawing(true);
    setCurrentDisplayWinner(null);

    // Pick winner immediately
    const winnerIndex = Math.floor(Math.random() * eligibleStudents.length);
    const chosenWinner = eligibleStudents[winnerIndex];

    // Animation settings
    const totalDuration = 3200; // 3.2 seconds
    const startTime = performance.now();
    let lastTickTime = 0;
    let tickInterval = 50; // starts fast (ms)

    // Optional drumroll sound in background
    soundEngine.playDrumroll(totalDuration);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDuration);

      // Deceleration curve (cubic ease out)
      // Interval between name switches increases smoothly: from 50ms up to 450ms
      tickInterval = 50 + Math.pow(progress, 3) * 380;

      if (now - lastTickTime > tickInterval) {
        lastTickTime = now;
        // Pick a random display name from all students during shuffle
        const randomName = students[Math.floor(Math.random() * students.length)].name;
        setTickerName(randomName);

        // Sound effect tick with rising tension pitch
        soundEngine.playTick(progress);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        // Finished! Reveal final winner!
        setTickerName(chosenWinner.name);
        setCurrentDisplayWinner(chosenWinner.name);
        setIsDrawing(false);

        // Sound effect victory fanfare
        soundEngine.playFanfare();

        // Celebration Confetti
        triggerCelebrationConfetti();

        // Update history
        setHistory((prev) => [
          {
            id: `h_${Date.now()}`,
            name: chosenWinner.name,
            timestamp: Date.now(),
          },
          ...prev,
        ]);

        // If no-repeat mode, remove winner from pool
        if (drawMode === 'no_repeat') {
          setRemainingStudentIds((prev) => prev.filter((id) => id !== chosenWinner.id));
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  const triggerCelebrationConfetti = () => {
    try {
      // Dual side cannons
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { x: 0.2, y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
      });
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { x: 0.8, y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
      });
    } catch {
      // Ignore if canvas confetti fails in iframe
    }
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: Spacebar or Enter to trigger draw
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleStartDraw();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [students, remainingStudentIds, drawMode, isDrawing]);

  const remainingCount = drawMode === 'no_repeat' ? remainingStudentIds.length : students.length;
  const isPoolExhausted = drawMode === 'no_repeat' && remainingStudentIds.length === 0 && students.length > 0;

  return (
    <div
      ref={containerRef}
      id="random-picker-container"
      className={`relative w-full rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white via-indigo-50/20 to-white shadow-xl overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen flex flex-col justify-between p-8 bg-slate-900 text-white' : 'p-6 sm:p-8'
      }`}
    >
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        {/* Draw Mode Switch */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Settings2 className="w-3.5 h-3.5" /> 抽籤規則：
          </span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
            <button
              id="mode-no-repeat-btn"
              type="button"
              onClick={() => handleModeChange('no_repeat')}
              disabled={isDrawing}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                drawMode === 'no_repeat'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              不重複抽取
            </button>
            <button
              id="mode-allow-repeat-btn"
              type="button"
              onClick={() => handleModeChange('allow_repeat')}
              disabled={isDrawing}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                drawMode === 'allow_repeat'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              允許重複抽取
            </button>
          </div>
        </div>

        {/* Action icons & stats */}
        <div className="flex items-center gap-2 sm:gap-3">
          {drawMode === 'no_repeat' && (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium">
                剩餘名額：<strong className="font-bold">{remainingCount}</strong> / {students.length} 人
              </span>
              <button
                id="reset-pool-btn"
                type="button"
                onClick={handleResetPool}
                disabled={isDrawing}
                title="重置剩餘抽籤名單"
                className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">重設名額</span>
              </button>
            </div>
          )}

          {/* Sound Mute Toggle */}
          <button
            id="toggle-sound-btn"
            type="button"
            onClick={toggleSound}
            title={isMuted ? '開啟音效' : '靜音'}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
                : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="toggle-fullscreen-btn"
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? '退出全螢幕' : '投影全螢幕模式'}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Spinning Stage */}
      <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center">
        {students.length === 0 ? (
          <div className="max-w-md mx-auto p-8 rounded-2xl border border-dashed border-slate-300 bg-white shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">尚未設定學生名單</h3>
            <p className="text-xs text-slate-500 mb-6">
              請先上傳 CSV 檔案或貼上學生姓名，即可開始進行隨機抽籤！
            </p>
            <button
              id="empty-roster-cta-btn"
              type="button"
              onClick={onOpenRoster}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-200"
            >
              立刻建立名單
            </button>
          </div>
        ) : isPoolExhausted ? (
          <div className="max-w-md mx-auto p-8 rounded-2xl border border-indigo-200 bg-indigo-50/50 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">太棒了！全班已抽完一輪</h3>
            <p className="text-xs text-slate-600 mb-6">
              所有 {students.length} 位學生皆已抽出過一次。您可以點擊下方按鈕重置名冊，展開新一輪抽籤！
            </p>
            <button
              id="exhausted-reset-btn"
              type="button"
              onClick={handleResetPool}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              重新開始新一輪
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xl mx-auto">
            {/* Stage Light & Display Card */}
            <div
              id="winner-display-card"
              className={`relative rounded-3xl p-8 sm:p-12 transition-all duration-300 ${
                currentDisplayWinner
                  ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-2xl shadow-indigo-500/25 ring-8 ring-indigo-100 transform scale-105'
                  : isDrawing
                  ? 'bg-slate-900 text-indigo-300 shadow-xl border-4 border-indigo-400/50'
                  : 'bg-white border-2 border-slate-200/90 text-slate-800 shadow-lg'
              }`}
            >
              {/* Winner Badge / Header Tag */}
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-xs">
                {currentDisplayWinner ? (
                  <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    <Trophy className="w-3.5 h-3.5" /> 幸運中獎者
                  </span>
                ) : isDrawing ? (
                  <span className="bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" /> 正在緊張抽出中...
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                    課堂隨機抽籤
                  </span>
                )}
              </div>

              {/* Big Student Name Display */}
              <div className="h-28 sm:h-36 flex items-center justify-center overflow-hidden">
                <div
                  id="drawn-student-name"
                  key={tickerName}
                  className={`font-black tracking-tight select-none transition-all ${
                    currentDisplayWinner
                      ? 'text-5xl sm:text-7xl text-white drop-shadow-md animate-bounce'
                      : isDrawing
                      ? 'text-4xl sm:text-6xl text-indigo-300 filter blur-0 scale-95 opacity-90'
                      : 'text-4xl sm:text-5xl text-slate-400 font-medium'
                  }`}
                >
                  {tickerName}
                </div>
              </div>

              {/* Status footer inside card */}
              <div className="mt-2 text-xs font-medium opacity-80">
                {currentDisplayWinner ? (
                  <span className="text-amber-200 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> 請恭喜這名同學回答問題或代表發言！
                  </span>
                ) : isDrawing ? (
                  <span className="text-slate-400 font-mono">命運輪盤旋轉中...</span>
                ) : (
                  <span className="text-slate-400">點擊下方按鈕啟動隨機抽籤</span>
                )}
              </div>
            </div>

            {/* Main Action Button */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="start-draw-button"
                type="button"
                onClick={handleStartDraw}
                disabled={isDrawing}
                className={`w-full sm:w-auto min-w-[220px] px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all flex items-center justify-center gap-2.5 ${
                  isDrawing
                    ? 'bg-slate-400 cursor-not-allowed opacity-80'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 shadow-indigo-500/25 hover:shadow-indigo-500/40 cursor-pointer'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isDrawing ? 'animate-spin' : ''}`} />
                <span>{isDrawing ? '抽籤進行中...' : currentDisplayWinner ? '再抽一位學生' : '開始隨機抽籤'}</span>
                <span className="hidden sm:inline-block text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/20 text-white/90 font-mono ml-1">
                  Space
                </span>
              </button>

              {currentDisplayWinner && (
                <button
                  id="quick-reset-view-btn"
                  type="button"
                  onClick={() => {
                    setCurrentDisplayWinner(null);
                    setTickerName('等待抽籤');
                  }}
                  className="px-5 py-4 rounded-2xl font-medium text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  返回準備
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Draw History Section */}
      {history.length > 0 && (
        <div className="pt-6 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <History className="w-4 h-4 text-indigo-600" />
              本日抽籤紀錄（已抽 {history.length} 次）
            </div>
            <button
              id="clear-draw-history-btn"
              type="button"
              onClick={() => setHistory([])}
              className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
            >
              清空紀錄
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
            {history.map((item, index) => (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800"
              >
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {history.length - index}
                </span>
                <span className="font-semibold">{item.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
