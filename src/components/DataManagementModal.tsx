import React, { useState, useRef } from 'react';
import { TrackProject, StationPoint } from '../core/types';
import { exportTrackToCSV, parseTrackFromCSV, appendStations } from '../core/csv';
import { X, Download, Upload, Trash2, FolderOpen, Save, FileSpreadsheet, RotateCcw } from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: TrackProject;
  onLoadProject: (project: TrackProject) => void;
  onResetProject: () => void;
  onLoadDemoTrack: () => void;
}

const STORAGE_KEY = 'track_level_companion_projects';

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  onResetProject,
  onLoadDemoTrack,
}) => {
  const [savedProjects, setSavedProjects] = useState<TrackProject[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [saveName, setSaveName] = useState(currentProject.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    const projectToSave: TrackProject = {
      ...currentProject,
      name: saveName.trim() || 'Untitled Track',
      date: new Date().toISOString().split('T')[0],
    };

    const existingIdx = savedProjects.findIndex(p => p.name === projectToSave.name);
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
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    onLoadProject(projectToSave);
  };

  const handleDeleteSaved = (name: string) => {
    const updated = savedProjects.filter(p => p.name !== name);
    setSavedProjects(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const [pendingCsvStations, setPendingCsvStations] = useState<StationPoint[] | null>(null);

  // Export to CSV using robust core utility
  const handleExportCSV = () => {
    const csvContent = exportTrackToCSV(currentProject);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeName = currentProject.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `${safeName}_${currentProject.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import from CSV using robust parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const newStations = parseTrackFromCSV(text);

      if (newStations.length > 0) {
        if (currentProject.stations.length > 0) {
          // Ask user: Replace or Append?
          setPendingCsvStations(newStations);
        } else {
          onLoadProject({
            ...currentProject,
            stations: newStations,
          });
          onClose();
        }
      }
    };
    reader.readAsText(file);
    // Reset file input so user can re-upload same file if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Execute Replace
  const handleConfirmReplace = () => {
    if (!pendingCsvStations) return;
    onLoadProject({
      ...currentProject,
      stations: pendingCsvStations,
    });
    setPendingCsvStations(null);
    onClose();
  };

  // Execute Append (Shift distances so imported track continues after current track)
  const handleConfirmAppend = (shiftDistances: boolean) => {
    if (!pendingCsvStations) return;
    const combined = appendStations(currentProject.stations, pendingCsvStations, shiftDistances);

    onLoadProject({
      ...currentProject,
      stations: combined,
    });
    setPendingCsvStations(null);
    onClose();
  };

  // Append a saved project from localStorage to active project
  const handleAppendSavedProject = (saved: TrackProject) => {
    const combined = appendStations(currentProject.stations, saved.stations, true);

    onLoadProject({
      ...currentProject,
      stations: combined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white px-5 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold">Track Profiles & Export</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Save Current Track */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Save Active Track Profile
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Track Section Name"
                className="flex-1 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none"
              />
              <button
                onClick={handleSaveCurrent}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl flex items-center gap-1.5 transition active:scale-95 text-xs shadow-sm"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Export / Import */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              CSV Export & Import (Sheets / Excel)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportCSV}
                className="p-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-1 text-zinc-800 dark:text-zinc-200 transition active:scale-95 font-semibold text-xs"
              >
                <Download className="w-5 h-5 text-emerald-500" />
                <span>Export to CSV</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-1 text-zinc-800 dark:text-zinc-200 transition active:scale-95 font-semibold text-xs"
              >
                <Upload className="w-5 h-5 text-amber-500" />
                <span>Import CSV File</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
            </div>
          </div>

          {/* Quick Presets / Demo Track */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Presets & Quick Start
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onLoadDemoTrack();
                  onClose();
                }}
                className="flex-1 py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Load Sample 50ft Track (with Dip)</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Clear all stations and start fresh?')) {
                    onResetProject();
                    onClose();
                  }
                }}
                className="py-2 px-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-red-100 dark:hover:bg-red-950/50 text-zinc-700 dark:text-zinc-300 hover:text-red-500 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-xs transition flex items-center gap-1"
                title="Clear current track"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Pending CSV Import Resolution Card */}
          {pendingCsvStations && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  CSV Ready: {pendingCsvStations.length} Stations Found
                </span>
                <button
                  onClick={() => setPendingCsvStations(null)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-xs"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                Your current active track has {currentProject.stations.length} stations (ending at{' '}
                {currentProject.stations[currentProject.stations.length - 1]?.distanceFt ?? 0} ft).
                How would you like to apply this CSV?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleConfirmReplace}
                  className="py-2 px-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-xs font-bold transition text-left flex flex-col"
                >
                  <span>Replace Track</span>
                  <span className="text-[10px] font-normal text-zinc-500">
                    Overwrites all current stations
                  </span>
                </button>
                <button
                  onClick={() => handleConfirmAppend(true)}
                  className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold transition text-left flex flex-col shadow-sm"
                >
                  <span>Append to End</span>
                  <span className="text-[10px] font-normal text-amber-950">
                    Continue distances (+{currentProject.stations[currentProject.stations.length - 1]?.distanceFt ?? 0} ft)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Saved Profiles List */}
          {savedProjects.length > 0 && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Saved Tracks ({savedProjects.length})
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {savedProjects.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {p.stations.length} stations • {p.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAppendSavedProject(p)}
                        className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-bold rounded-lg transition text-[11px]"
                        title="Append stations from this track to current track"
                      >
                        + Append
                      </button>
                      <button
                        onClick={() => {
                          onLoadProject(p);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-extrabold rounded-lg transition"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(p.name)}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded transition"
                        title="Delete saved track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-300 dark:hover:bg-zinc-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
