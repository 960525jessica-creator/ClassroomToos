import React, { useState, useEffect } from 'react';
import { Student } from './types';
import { SAMPLE_STUDENTS_LIST } from './utils/csvParser';
import { RandomPicker } from './components/RandomPicker';
import { AutoGrouper } from './components/AutoGrouper';
import { RosterManager } from './components/RosterManager';
import { 
  Sparkles, 
  Users2, 
  Dice5, 
  FileSpreadsheet, 
  GraduationCap, 
  HelpCircle,
  Volume2,
  VolumeX,
  Plus
} from 'lucide-react';
import { soundEngine } from './utils/audio';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('classroom_students_roster');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // fallback
        }
      }
    }
    // Default initial demonstration roster so teacher can test right away
    return SAMPLE_STUDENTS_LIST[0].data.map((name, i) => ({
      id: `initial_${i}_${Date.now()}`,
      name,
    }));
  });

  const [activeTab, setActiveTab] = useState<'picker' | 'grouper'>('picker');
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());

  // Persist students to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('classroom_students_roster', JSON.stringify(students));
    }
  }, [students]);

  const handleUpdateStudents = (newList: Student[]) => {
    setStudents(newList);
  };

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Main Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                課堂抽籤與分組小幫手
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                支援 CSV 匯入、音效動畫隨機抽籤與視覺化分組
              </p>
            </div>
          </div>

          {/* Center Tabs */}
          <div className="flex items-center rounded-xl bg-slate-100/90 p-1 border border-slate-200/80">
            <button
              id="nav-tab-picker"
              type="button"
              onClick={() => setActiveTab('picker')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Dice5 className="w-4 h-4" />
              <span>隨機抽籤</span>
            </button>
            <button
              id="nav-tab-grouper"
              type="button"
              onClick={() => setActiveTab('grouper')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'grouper'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users2 className="w-4 h-4" />
              <span>自動分組</span>
            </button>
          </div>

          {/* Right Action: Roster Manager & Sound Toggle */}
          <div className="flex items-center gap-2">
            <button
              id="sound-toggle-btn-header"
              type="button"
              onClick={toggleSound}
              title={isMuted ? '音效已靜音' : '音效已開啟'}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              id="open-roster-manager-btn"
              type="button"
              onClick={() => setIsRosterOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>名單來源</span>
              <span className="bg-indigo-600 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                {students.length} 人
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Roster Quick Info Banner if low or demo list */}
      <div className="bg-white border-b border-slate-200/60 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              目前名單：<strong>{students.length}</strong> 位學生
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400 hidden sm:inline">
              支援 CSV 上傳或貼上姓名，自動記憶儲存於瀏覽器
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsRosterOpen(true)}
            className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            更新或匯入名單
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'picker' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  隨機抽籤
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  伴隨緊張滾動動畫與音效，可依教學需求自由切換「不重複抽取」或「允許重複抽取」
                </p>
              </div>
            </div>

            <RandomPicker
              students={students}
              onOpenRoster={() => setIsRosterOpen(true)}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  自動分組
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  設定每組人數或總組數，一鍵隨機洗牌，結果以生動卡片視覺化呈現，並支援成員微調與一鍵複製
                </p>
              </div>
            </div>

            <AutoGrouper
              students={students}
              onOpenRoster={() => setIsRosterOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>課堂隨機抽籤與自動分組小幫手 ‧ 專為教學設計</div>
          <div className="text-[11px] text-slate-400">
            純前端運作 ‧ 資料安全存放於您的瀏覽器本機 ‧ 免登入即可使用
          </div>
        </div>
      </footer>

      {/* Roster Management Modal */}
      <RosterManager
        students={students}
        onUpdateStudents={handleUpdateStudents}
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
      />
    </div>
  );
}
