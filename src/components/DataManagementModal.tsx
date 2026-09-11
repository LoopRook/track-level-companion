import React, { useState, useRef } from 'react';
import { TrackProject, StationPoint, CalculatedStation } from '../core/types';
import { exportTrackToCSV, parseTrackFromCSV, appendStations, generateCSVTemplate, generateGoogleSheetsTSVTemplate } from '../core/csv';
import { formatMeasurement } from '../core/units';
import {
  X,
  Download,
  Upload,
  Trash2,
  FolderOpen,
  Save,
  FileSpreadsheet,
  RotateCcw,
  Copy,
  Check,
  FileText,
  Layers,
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useBodyScrollLock } from '../core/useBodyScrollLock';
import { triggerAppUpdateCheck } from './UpdatePrompt';
import { APP_VERSION_LABEL } from '../core/version';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: TrackProject;
  calculatedStations?: CalculatedStation[];
  onLoadProject: (project: TrackProject) => void;
  onResetProject: () => void;
  onLoadDemoTrack: () => void;
  onOpenNewTrack?: () => void;
}

const STORAGE_KEY = 'track_level_companion_projects';

// Feature flag: set to true if multi-crew CSV section merging is desired in the future.
// Deactivated for single-operator field workflow where live "Extend" buttons are used.
// See docs/MERGE_FEATURE.md for full architecture & documentation.
const ENABLE_MERGE_FEATURE = false;

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  calculatedStations,
  onLoadProject,
  onResetProject,
  onLoadDemoTrack,
  onOpenNewTrack,
}) => {
  useBodyScrollLock(isOpen);
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'saved'>('export');
  const [savedProjects, setSavedProjects] = useState<TrackProject[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [saveName, setSaveName] = useState(currentProject.name);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingCsvStations, setPendingCsvStations] = useState<{ stations: StationPoint[]; sourceName: string } | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [showRawCsv, setShowRawCsv] = useState(false);
  const [modalUpdateStatus, setModalUpdateStatus] = useState<'idle' | 'checking' | 'updated'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Save current project to browser localStorage
  const handleSaveCurrent = () => {
    const trimmedName = saveName.trim() || 'Untitled Track';
    const projectToSave: TrackProject = {
      ...currentProject,
      name: trimmedName,
      date: new Date().toISOString().split('T')[0],
    };

    const existingIdx = savedProjects.findIndex(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    let updated: TrackProject[];
    if (existingIdx >= 0) {
      updated = [...savedProjects];
      updated[existingIdx] = projectToSave;
    } else {
      updated = [projectToSave, ...savedProjects];
    }

    setSavedProjects(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      showNotification(`Saved "${trimmedName}" to browser storage.`);
    } catch (e) {
      console.error('Failed to save to localStorage', e);
      showNotification('Could not save to storage.', 'error');
    }
    onLoadProject(projectToSave);
  };

  // Delete saved profile
  const handleDeleteSaved = (name: string) => {
    if (!confirm(`Delete saved profile "${name}"?`)) return;
    const updated = savedProjects.filter(p => p.name !== name);
    setSavedProjects(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      showNotification(`Deleted "${name}".`);
    } catch (e) {
      console.error(e);
    }
  };

  // Export to CSV with native mobile share support & direct download
  const handleExportCSV = async (targetProj: TrackProject = currentProject) => {
    const csvContent = exportTrackToCSV(targetProj, targetProj.id === currentProject.id ? calculatedStations : undefined);
    const safeName = targetProj.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${safeName || 'track'}_${targetProj.date || new Date().toISOString().split('T')[0]}.csv`;

    // Attempt Native Share on mobile devices (iOS Safari / Android Chrome)
    if (typeof navigator !== 'undefined' && navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        const file = new File([csvContent], filename, { type: 'text/csv' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: targetProj.name,
          });
          showNotification(`Shared "${filename}".`);
          return;
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Standard download trigger
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500);
      showNotification(`Downloaded "${filename}".`);
    } catch {
      showNotification('Download failed. You can copy CSV text below.', 'error');
    }
  };

  // Copy CSV to clipboard
  const handleCopyCSV = async () => {
    const csvContent = exportTrackToCSV(currentProject, calculatedStations);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(csvContent);
        showNotification('Copied CSV data to clipboard.');
        return;
      }
      throw new Error('Clipboard API not available');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = csvContent;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showNotification('Copied CSV data to clipboard.');
    }
  };

  // Download blank CSV template
  const handleDownloadTemplate = () => {
    try {
      const template = generateCSVTemplate(50, currentProject.stationIntervalFt || 5);
      const filename = `track_level_template_${currentProject.stationIntervalFt || 5}ft.csv`;
      const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500);
      showNotification(`Downloaded "${filename}".`);
    } catch {
      showNotification('Failed to download template.', 'error');
    }
  };

  // Copy template directly formatted for Google Sheets paste
  const handleCopyGoogleSheetsTemplate = async () => {
    try {
      const tsv = generateGoogleSheetsTSVTemplate(50, currentProject.stationIntervalFt || 5);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(tsv);
        showNotification('Copied template to clipboard.');
        return;
      }
      throw new Error('Clipboard API not available');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = generateGoogleSheetsTSVTemplate(50, currentProject.stationIntervalFt || 5);
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showNotification('Copied template to clipboard.');
    }
  };

  // Handle file input selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        showNotification('File is empty.', 'error');
        return;
      }
      processIncomingCSV(text, file.name);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Process text from file or paste
  const processIncomingCSV = (text: string, sourceName: string) => {
    const stations = parseTrackFromCSV(text);
    if (stations.length === 0) {
      showNotification('Could not find any valid stations in this CSV. Please check formatting.', 'error');
      return;
    }

    if (currentProject.stations.length === 0 || (currentProject.stations.length === 1 && currentProject.stations[0].readingInches === null)) {
      // Direct load if current track is empty
      onLoadProject({
        ...currentProject,
        name: sourceName.replace(/\.[^/.]+$/, ''),
        stations,
      });
      showNotification(`Loaded ${stations.length} stations.`);
      onClose();
    } else {
      // Ask user to choose Replace or Merge
      setPendingCsvStations({ stations, sourceName });
    }
  };

  // Execute Replace with incoming
  const handleConfirmReplace = () => {
    if (!pendingCsvStations) return;
    onLoadProject({
      ...currentProject,
      stations: pendingCsvStations.stations,
    });
    showNotification(`Replaced track with ${pendingCsvStations.stations.length} stations.`);
    setPendingCsvStations(null);
    onClose();
  };

  // Execute Merge / Append with distance chain continuation
  const handleConfirmAppend = () => {
    if (!pendingCsvStations) return;
    const combined = appendStations(currentProject.stations, pendingCsvStations.stations, true);
    onLoadProject({
      ...currentProject,
      stations: combined,
    });
    showNotification(`Merged ${pendingCsvStations.stations.length} stations onto track (${combined.length} total).`);
    setPendingCsvStations(null);
    onClose();
  };

  // Append a saved project from localStorage
  const handleAppendSavedProject = (saved: TrackProject) => {
    const combined = appendStations(currentProject.stations, saved.stations, true);
    onLoadProject({
      ...currentProject,
      stations: combined,
    });
    showNotification(`Merged "${saved.name}" onto track (${combined.length} stations).`);
    onClose();
  };

  const lastDist = currentProject.stations.length > 0
    ? currentProject.stations[currentProject.stations.length - 1].distanceFt
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overscroll-none touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overscroll-contain touch-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold">Track Profiles & CSV</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 px-3 pt-2 gap-1 text-xs font-bold shrink-0">
          <button
            onClick={() => { setActiveTab('export'); setPendingCsvStations(null); }}
            className={`px-3 py-2 rounded-t-xl transition flex items-center gap-1.5 border-t border-x ${
              activeTab === 'export'
                ? 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 -mb-px'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-2 rounded-t-xl transition flex items-center gap-1.5 border-t border-x ${
              activeTab === 'import'
                ? 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 -mb-px'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => { setActiveTab('saved'); setPendingCsvStations(null); }}
            className={`px-3 py-2 rounded-t-xl transition flex items-center gap-1.5 border-t border-x ${
              activeTab === 'saved'
                ? 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 -mb-px'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Saved Tracks ({savedProjects.length})</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
            }`}
          >
            {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 modal-scroll-container flex-1 min-h-0 space-y-4 text-sm">
          {/* TAB 1: EXPORT CSV */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Active Profile Card */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Active Track Profile
                </span>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {currentProject.name}
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {currentProject.stations.length} stations • {lastDist} ft total length • Date: {currentProject.date}
                </p>
              </div>

              {/* Export Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleExportCSV(currentProject)}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-sm transition active:scale-95"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download .CSV File</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCSV}
                  className="p-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition active:scale-95"
                >
                  <Copy className="w-4 h-4 text-amber-500" />
                  <span>Copy CSV to Clipboard</span>
                </button>
              </div>

              {/* Raw CSV Text Toggle & Box */}
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowRawCsv(!showRawCsv)}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{showRawCsv ? 'Hide Raw CSV' : 'View / Copy Raw CSV Text'}</span>
                  </button>
                  {showRawCsv && (
                    <button
                      type="button"
                      onClick={handleCopyCSV}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Copy All
                    </button>
                  )}
                </div>

                {showRawCsv && (
                  <textarea
                    readOnly
                    value={exportTrackToCSV(currentProject, calculatedStations)}
                    rows={6}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 outline-none select-all"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT & MERGE */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Pending CSV Confirmation Card (Shows prominently when file/text parsed) */}
              {pendingCsvStations ? (
                <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        CSV Ready: {pendingCsvStations.stations.length} Stations Found
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingCsvStations(null)}
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Source: <strong>{pendingCsvStations.sourceName}</strong> ({pendingCsvStations.stations[0]?.distanceFt ?? 0} ft to {pendingCsvStations.stations[pendingCsvStations.stations.length - 1]?.distanceFt ?? 0} ft).
                    <br />
                    Your active track currently has <strong>{currentProject.stations.length} stations</strong> (ending at {lastDist} ft).
                  </p>

                  {/* Incoming Stations Preview */}
                  <div className="bg-white dark:bg-black p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono space-y-1 max-h-24 overflow-y-auto">
                    {pendingCsvStations.stations.slice(0, 4).map((s, idx) => (
                      <div key={idx} className="flex justify-between text-zinc-600 dark:text-zinc-400">
                        <span>Station {s.distanceFt} ft</span>
                        <span>{s.readingInches !== null ? formatMeasurement(s.readingInches, currentProject.unitFormat, currentProject.fractionResolution) : 'Need Reading'}</span>
                      </div>
                    ))}
                    {pendingCsvStations.stations.length > 4 && (
                      <div className="text-[10px] text-zinc-400 italic">
                        + {pendingCsvStations.stations.length - 4} more stations...
                      </div>
                    )}
                  </div>

                  {/* Action Choices */}
                  {ENABLE_MERGE_FEATURE ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleConfirmReplace}
                        className="p-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-black rounded-xl text-xs font-bold transition flex flex-col text-left shadow-sm active:scale-95"
                      >
                        <span className="font-extrabold text-sm flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Replace Active Track</span>
                        </span>
                        <span className="text-[10px] font-normal opacity-80 mt-0.5">
                          Overwrites active track with these {pendingCsvStations.stations.length} stations
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmAppend}
                        className="p-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition flex flex-col text-left shadow-sm active:scale-95"
                      >
                        <span className="font-extrabold text-sm flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Merge / Append to End</span>
                        </span>
                        <span className="text-[10px] font-semibold text-amber-950 mt-0.5">
                          Stitches after Station {lastDist} ft (+{lastDist} ft distance shift)
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPendingCsvStations(null)}
                        className="flex-1 py-2.5 px-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmReplace}
                        className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Load & Replace Track</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Upload Option */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-2.5">
                    <Upload className="w-8 h-8 text-amber-500 mx-auto" />
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        Upload CSV File from Device
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {ENABLE_MERGE_FEATURE
                          ? 'Choose a CSV to Replace your active track or Merge to extend it.'
                          : 'Supports standard CSVs from Track Level Companion, Excel, or Google Sheets.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-sm transition active:scale-95"
                    >
                      Choose .CSV File
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".csv,text/csv,text/plain"
                      className="hidden"
                    />
                  </div>

                  {/* Or Paste CSV Text Option */}
                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Or Paste CSV / Spreadsheet Text
                    </label>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste columns from Excel, Google Sheets, or CSV file here..."
                      rows={3}
                      className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!pastedText.trim()}
                        onClick={() => {
                          processIncomingCSV(pastedText, 'Pasted Track');
                          setPastedText('');
                        }}
                        className="px-3.5 py-1.5 bg-zinc-900 dark:bg-zinc-100 disabled:opacity-40 text-white dark:text-black font-bold text-xs rounded-lg transition"
                      >
                        Parse & Import Pasted Text
                      </button>
                    </div>
                  </div>

                  {/* Start Fresh / Blank Grid Option */}
                  {onOpenNewTrack && (
                    <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl border border-amber-500/20 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Start a new track section:
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Clear the current project and generate a blank field survey or custom grid.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenNewTrack();
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>+ New Track</span>
                      </button>
                    </div>
                  )}

                  {/* Standard CSV & Google Sheets Template Card */}
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 via-zinc-100 dark:via-zinc-900 to-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          Field Data Template (Excel / Google Drive)
                        </h4>
                        <p className="text-xs text-zinc-500">
                          Download a blank field sheet or copy directly into Google Sheets
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="py-2.5 px-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-4 h-4 text-amber-500" />
                        <span>Download CSV Template</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyGoogleSheetsTemplate}
                        className="py-2.5 px-3 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-4 h-4 text-amber-500" />
                        <span>Copy for Google Sheets</span>
                      </button>
                    </div>

                    <div className="p-3 bg-white/60 dark:bg-black/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                      <p className="font-bold text-zinc-900 dark:text-zinc-200">How to use with Google Drive / Google Sheets:</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-[11px] leading-relaxed">
                        <li>Click <strong>Copy for Google Sheets</strong> (or download CSV and upload to Google Drive).</li>
                        <li>Open a new sheet in Google Sheets and press <kbd className="px-1 py-0.2 bg-zinc-200 dark:bg-zinc-800 rounded font-mono">Ctrl+V</kbd> to paste columns.</li>
                        <li>Record laser measurements trackside in column B (e.g. <span className="font-mono">1' 4 3/8"</span>, <span className="font-mono">14.375</span>, or <span className="font-mono">365mm</span>).</li>
                        <li>Export as CSV from Google Sheets (or copy the table) and upload or paste it into this tab.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED PROFILES */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              {/* Save Current Track */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Save Active Track to Browser Storage
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Track Section Name"
                    className="flex-1 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCurrent}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl flex items-center gap-1.5 transition active:scale-95 text-xs shadow-sm"
                  >
                    <Save className="w-4 h-4 stroke-[2.5]" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Saved Profiles List */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Saved Track Profiles ({savedProjects.length})
                </label>

                {savedProjects.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center text-xs text-zinc-400">
                    No saved tracks in browser storage yet. Enter a name above and tap Save.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {savedProjects.map((p) => {
                      const pLen = p.stations.length > 0 ? p.stations[p.stations.length - 1].distanceFt : 0;
                      return (
                        <div
                          key={p.name}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-sm">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {p.stations.length} stations • {pLen} ft • {p.date}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            {ENABLE_MERGE_FEATURE && (
                              <button
                                type="button"
                                onClick={() => handleAppendSavedProject(p)}
                                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 font-bold rounded-lg transition text-[11px] flex items-center gap-1"
                                title="Merge / Append stations from this track onto active track"
                              >
                                <Layers className="w-3 h-3" />
                                <span>+ Merge</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                onLoadProject(p);
                                showNotification(`Loaded "${p.name}".`);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-extrabold rounded-lg transition text-[11px]"
                            >
                              Load
                            </button>

                            <button
                              type="button"
                              onClick={() => handleExportCSV(p)}
                              className="p-1.5 text-zinc-400 hover:text-emerald-500 rounded-lg border border-zinc-200 dark:border-zinc-800 transition"
                              title="Download CSV for this saved track"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSaved(p.name)}
                              className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg border border-zinc-200 dark:border-zinc-800 transition"
                              title="Delete saved track"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Presets & New Track */}
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Quick Presets & Track Reset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenNewTrack) {
                        onClose();
                        onOpenNewTrack();
                      } else {
                        onResetProject();
                        onClose();
                      }
                    }}
                    className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ New Track...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onLoadDemoTrack();
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Load Example 85ft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Clear all stations and start a new fresh track?')) {
                        onResetProject();
                        onClose();
                      }
                    }}
                    className="py-2.5 px-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-red-100 dark:hover:bg-red-950/50 text-zinc-700 dark:text-zinc-300 hover:text-red-500 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1"
                    title="Clear current track"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Clear Active</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={async () => {
              if (modalUpdateStatus === 'checking') return;
              setModalUpdateStatus('checking');
              try {
                const res = await triggerAppUpdateCheck();
                if (res === 'up_to_date') {
                  setModalUpdateStatus('updated');
                  setTimeout(() => setModalUpdateStatus('idle'), 3000);
                } else {
                  setModalUpdateStatus('idle');
                }
              } catch {
                setModalUpdateStatus('idle');
              }
            }}
            className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Check for application updates"
          >
            <RefreshCw className={`w-3 h-3 text-amber-500 ${modalUpdateStatus === 'checking' ? 'animate-spin' : ''}`} />
            <span>
              {modalUpdateStatus === 'checking'
                ? 'Checking for updates...'
                : modalUpdateStatus === 'updated'
                ? 'App is up to date ✓'
                : `Track Level Companion ${APP_VERSION_LABEL} • Check for Updates`}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-300 dark:hover:bg-zinc-800 transition ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
