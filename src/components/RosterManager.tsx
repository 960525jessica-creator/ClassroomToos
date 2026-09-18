import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { parseStudentsFromCsv, parseStudentsFromText, SAMPLE_STUDENTS_LIST } from '../utils/csvParser';
import { 
  Users, 
  Upload, 
  FileSpreadsheet, 
  ClipboardList, 
  Plus, 
  Trash2, 
  X, 
  Search, 
  Sparkles, 
  Check, 
  AlertCircle
} from 'lucide-react';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'view'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [singleNameInput, setSingleNameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      showNotification('請上傳 .csv 或 .txt 格式的檔案', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        showNotification('檔案內容為空', 'error');
        return;
      }

      let parsed: { students: Student[]; detectedColumn?: string };
      if (file.name.endsWith('.csv')) {
        parsed = parseStudentsFromCsv(content);
      } else {
        parsed = parseStudentsFromText(content);
      }

      if (parsed.students.length === 0) {
        showNotification('未能自檔案中辨識出學生名單，請檢查檔案格式', 'error');
        return;
      }

      onUpdateStudents(parsed.students);
      const colNote = parsed.detectedColumn ? `（已自動選取「${parsed.detectedColumn}」欄）` : '';
      showNotification(`成功匯入 ${parsed.students.length} 位學生名單！${colNote}`, 'success');
      setActiveTab('view');
    };
    reader.onerror = () => {
      showNotification('讀取檔案發生錯誤，請重試', 'error');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      showNotification('請先貼上或輸入學生姓名', 'info');
      return;
    }

    const { students: newStudents, duplicates } = parseStudentsFromText(pasteText);
    if (newStudents.length === 0) {
      showNotification('未能辨識出任何學生姓名', 'error');
      return;
    }

    onUpdateStudents(newStudents);
    let msg = `成功匯入 ${newStudents.length} 位學生！`;
    if (duplicates.length > 0) {
      msg += `（已自動略過 ${duplicates.length} 個重複姓名）`;
    }
    showNotification(msg, 'success');
    setPasteText('');
    setActiveTab('view');
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = singleNameInput.trim();
    if (!trimmed) return;

    if (students.some((s) => s.name === trimmed)) {
      showNotification(`「${trimmed}」已在名單中囉！`, 'info');
      return;
    }

    const newStudent: Student = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
    };
    onUpdateStudents([...students, newStudent]);
    setSingleNameInput('');
    showNotification(`已新增學生「${trimmed}」`, 'success');
  };

  const handleRemoveStudent = (id: string, name: string) => {
    const updated = students.filter((s) => s.id !== id);
    onUpdateStudents(updated);
    showNotification(`已移除「${name}」`, 'info');
  };

  const handleClearAll = () => {
    if (students.length === 0) return;
    if (window.confirm('確定要清空整份學生名單嗎？此操作無法復原。')) {
      onUpdateStudents([]);
      showNotification('已清空學生名單', 'info');
    }
  };

  const handleLoadSample = (sample: typeof SAMPLE_STUDENTS_LIST[0]) => {
    const newStudents: Student[] = sample.data.map((name) => ({
      id: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
    }));
    onUpdateStudents(newStudents);
    showNotification(`已套用「${sample.label}」（共 ${newStudents.length} 人）`, 'success');
    setActiveTab('view');
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div 
        id="roster-manager-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">學生名單管理</h2>
              <p className="text-xs text-slate-300">
                目前名單共 <span className="text-indigo-300 font-semibold">{students.length}</span> 位學生
              </p>
            </div>
          </div>
          <button
            id="close-roster-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            id="tab-upload-csv"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            上傳 CSV 檔案
          </button>
          <button
            id="tab-paste-text"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'paste'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            貼上名單文字
          </button>
          <button
            id="tab-view-list"
            onClick={() => setActiveTab('view')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'view'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            檢視與編輯名單 ({students.length})
          </button>
        </div>

        {/* Notification banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-b border-rose-100'
                : 'bg-indigo-50 text-indigo-800 border-b border-indigo-100'
            }`}
          >
            {statusMessage.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {/* Tab 1: Upload CSV */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div
                id="csv-drop-zone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="csv-file-input"
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-base font-semibold text-slate-800 mb-1">
                  點擊選擇檔案，或直接拖曳 CSV / TXT 檔案至此
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  支援 Excel 匯出之 .csv 檔案，系統會自動辨識「姓名」欄位或以第一欄為名單
                </p>
              </div>

              {/* Sample presets */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  快速體驗示範名單
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SAMPLE_STUDENTS_LIST.map((sample, idx) => (
                    <button
                      key={idx}
                      id={`load-sample-btn-${idx}`}
                      type="button"
                      onClick={() => handleLoadSample(sample)}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs group"
                    >
                      <div className="font-semibold text-slate-800 group-hover:text-indigo-700">
                        {sample.label}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        點擊載入 {sample.count} 人
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Paste text */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  貼上或輸入學生名單
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  支援每行一個名字，或使用逗號（,）、分號（;）、空格分隔皆可。
                </p>
                <textarea
                  id="paste-roster-textarea"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`例如：\n王小明\n陳雅婷\n林志豪\n張美玲\n李家豪`}
                  rows={8}
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  id="submit-paste-btn"
                  type="button"
                  onClick={handlePasteSubmit}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  確認匯入名單
                </button>
                <button
                  type="button"
                  onClick={() => setPasteText('')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  清空輸入框
                </button>
              </div>

              {/* Sample presets here too */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-2">或直接載入預設範例：</div>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_STUDENTS_LIST.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLoadSample(sample)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: View and edit list */}
          {activeTab === 'view' && (
            <div className="space-y-4">
              {/* Quick Add Form */}
              <form onSubmit={handleAddSingleStudent} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="single-student-name-input"
                    type="text"
                    value={singleNameInput}
                    onChange={(e) => setSingleNameInput(e.target.value)}
                    placeholder="輸入學生姓名，按 Enter 或點擊新增"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  id="add-single-student-btn"
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  新增
                </button>
              </form>

              {/* Search and stats bar */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="search-students-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋學生姓名..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="clear-all-students-btn"
                    type="button"
                    onClick={handleClearAll}
                    disabled={students.length === 0}
                    className="text-xs text-rose-600 hover:text-rose-800 disabled:opacity-40 disabled:hover:text-rose-600 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    清空全部名單
                  </button>
                </div>
              </div>

              {/* Student Chips */}
              {students.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">目前名單尚無學生</p>
                  <p className="text-xs text-slate-400 mt-1">
                    您可以上傳 CSV 檔案、貼上名單，或載入示範名單快速開始！
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadSample(SAMPLE_STUDENTS_LIST[0])}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      載入 28 人示範班級
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredStudents.map((s, index) => (
                      <div
                        key={s.id}
                        className="group flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 transition-all text-sm"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="text-[11px] font-mono text-slate-400 w-5">
                            {index + 1}.
                          </span>
                          <span className="font-medium text-slate-800 truncate">{s.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(s.id, s.name)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all p-0.5 rounded-sm ml-1"
                          title="移除"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {filteredStudents.length === 0 && searchQuery && (
                    <div className="text-center py-6 text-xs text-slate-400">
                      找不到符合「{searchQuery}」的學生姓名
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            名單將自動儲存於本機瀏覽器，重新整理不會遺失
          </div>
          <button
            id="modal-done-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            完成設定
          </button>
        </div>
      </div>
    </div>
  );
};
