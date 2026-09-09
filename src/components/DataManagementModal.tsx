import React, { useState, useRef } from 'react';
import { TrackProject } from '../core/types';
import { formatFeetInches } from '../core/units';
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

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [
      ['Station (ft)', 'Laser Reading (in)', 'Laser Reading (ft/in)', 'Completed', 'Notes'],
      ...currentProject.stations.map(s => [
        s.distanceFt.toString(),
        s.readingInches !== null ? s.readingInches.toFixed(4) : '',
        s.readingInches !== null ? formatFeetInches(s.readingInches) : '',
        s.completed ? 'YES' : 'NO',
        s.notes || '',
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeName = currentProject.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `${safeName}_${currentProject.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import from CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) return;

      const newStations = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        const dist = parseFloat(parts[0]);
        const reading = parts[1] ? parseFloat(parts[1]) : null;
        if (!isNaN(dist)) {
          newStations.push({
            id: `station-${Date.now()}-${i}`,
            distanceFt: dist,
            readingInches: reading !== null && !isNaN(reading) ? reading : null,
            completed: parts[3]?.toUpperCase() === 'YES',
            notes: parts[4] || '',
          });
        }
      }

      if (newStations.length > 0) {
        onLoadProject({
          ...currentProject,
          stations: newStations,
        });
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800 text-white px-5 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">Track Profiles & Export</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm">
          {/* Save Current Track */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Save Active Track Profile
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Track Section Name"
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none"
              />
              <button
                onClick={handleSaveCurrent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 text-xs shadow"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Export / Import */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              CSV Export & Import (Sheets / Excel)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportCSV}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-800 dark:text-slate-200 transition active:scale-95 font-semibold text-xs"
              >
                <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Export to CSV</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-800 dark:text-slate-200 transition active:scale-95 font-semibold text-xs"
              >
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
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
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950/50 text-slate-700 dark:text-slate-300 hover:text-red-600 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1"
                title="Clear current track"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Saved Profiles List */}
          {savedProjects.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Saved Tracks ({savedProjects.length})
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {savedProjects.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.stations.length} stations • {p.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onLoadProject(p);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(p.name)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition"
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
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
