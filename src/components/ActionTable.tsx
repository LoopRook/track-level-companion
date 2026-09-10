import React, { useState } from 'react';
import { CalculatedStation, UnitFormat } from '../core/types';
import { formatMeasurement, parseMeasurement } from '../core/units';
import { CheckCircle2, Circle, Edit3, Trash2, Plus, ArrowUpCircle, ArrowDownCircle, Layers, Flag, Lock, Unlock } from 'lucide-react';

interface ActionTableProps {
  stations: CalculatedStation[];
  unitFormat: UnitFormat;
  fractionResolution: 16 | 8 | 32;
  onEditStation: (station: CalculatedStation) => void;
  onToggleComplete: (stationId: string) => void;
  onToggleLock?: (stationId: string) => void;
  onDeleteStation: (stationId: string) => void;
  onAddNextStation: () => void;
  onInsertCustomStation: () => void;
  onExtendTrack?: (lengthFt: number, intervalFt: number, direction?: 'forward' | 'backward') => void;
  onSetTurningPoint?: (stationId: string, newReadingInches: number) => void;
  onResetDatum?: () => void;
  selectedStationId?: string | null;
}

export type TableDisplayMode = 'target_reading' | 'relative_elev' | 'both';

export const ActionTable: React.FC<ActionTableProps> = ({
  stations,
  unitFormat,
  fractionResolution,
  onEditStation,
  onToggleComplete,
  onToggleLock,
  onDeleteStation,
  onAddNextStation,
  onInsertCustomStation,
  onExtendTrack,
  onSetTurningPoint,
  onResetDatum,
  selectedStationId,
}) => {
  const [displayMode, setDisplayMode] = useState<TableDisplayMode>(() => {
    try {
      const saved = localStorage.getItem('track_level_table_display_mode');
      if (saved === 'target_reading' || saved === 'relative_elev' || saved === 'both') {
        return saved;
      }
      return 'target_reading';
    } catch {
      return 'target_reading';
    }
  });

  const handleSetDisplayMode = (mode: TableDisplayMode) => {
    setDisplayMode(mode);
    try {
      localStorage.setItem('track_level_table_display_mode', mode);
    } catch {
      // ignore
    }
  };

  const handleCycleDisplayMode = () => {
    const next: TableDisplayMode =
      displayMode === 'target_reading' ? 'relative_elev' : displayMode === 'relative_elev' ? 'both' : 'target_reading';
    handleSetDisplayMode(next);
  };

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendLength, setExtendLength] = useState(50);
  const [extendInterval, setExtendInterval] = useState(5);
  const [extendDirection, setExtendDirection] = useState<'forward' | 'backward'>('forward');

  const [turningPointStation, setTurningPointStation] = useState<CalculatedStation | null>(null);
  const [tpNewReadingStr, setTpNewReadingStr] = useState('');
  const [tpError, setTpError] = useState<string | null>(null);

  const lastDist = stations.length > 0 ? stations[stations.length - 1].distanceFt : 0;
  const firstDist = stations.length > 0 ? stations[0].distanceFt : 0;

  const handleApplyTurningPoint = () => {
    if (!turningPointStation || !onSetTurningPoint) return;
    if (turningPointStation.readingInches === null) {
      setTpError('The benchmark tie must have a recorded reading from your old laser setup first.');
      return;
    }
    const parsed = parseMeasurement(tpNewReadingStr);
    if (parsed === null || isNaN(parsed) || parsed <= 0) {
      setTpError('Please enter a valid positive reading (e.g. 1\' 4 3/8" or 16.5)');
      return;
    }
    setTpError(null);
    onSetTurningPoint(turningPointStation.id, parsed);
    setTurningPointStation(null);
  };

  return (
    <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors">
      {/* Header Toolbar */}
      <div className="px-3 sm:px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-zinc-50 dark:bg-zinc-950">
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
            Trackside Leveling Checklist
          </h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Tap row to record reading or adjust shims
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {onSetTurningPoint && (
            <button
              type="button"
              onClick={() => {
                const measured = stations.filter(s => s.readingInches !== null);
                const target = (measured.length > 0 ? measured[measured.length - 1] : stations[0]) || null;
                if (target) {
                  setTurningPointStation(target);
                  setTpNewReadingStr(target.readingInches !== null ? formatMeasurement(target.readingInches, unitFormat, fractionResolution) : '');
                  setTpError(null);
                }
              }}
              className="text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition flex items-center gap-1"
              title="Pick up rotary laser and relocate forward: set turning point benchmark"
            >
              <Flag className="w-3.5 h-3.5 text-purple-500" />
              <span>Move Laser (Datum)</span>
            </button>
          )}
          {onExtendTrack && (
            <button
              onClick={() => setIsExtendModalOpen(true)}
              className="text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1"
              title="Add a 50ft or 100ft section of stations in one click"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>+ Extend</span>
            </button>
          )}
          <button
            onClick={onInsertCustomStation}
            className="text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            + Custom Pt
          </button>
          <button
            onClick={onAddNextStation}
            className="text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition flex items-center gap-1 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Next</span>
          </button>
        </div>
      </div>

      {/* View Mode & Column Selector Toolbar */}
      <div className="px-3 sm:px-4 py-2 bg-zinc-100/70 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Display:</span>
          <div className="flex rounded-lg bg-zinc-200/80 dark:bg-zinc-900 p-0.5 border border-zinc-300 dark:border-zinc-800 h-7 items-center">
            <button
              type="button"
              onClick={() => handleSetDisplayMode('target_reading')}
              className={`h-full px-2.5 rounded-md font-bold text-xs flex items-center gap-1 transition ${
                displayMode === 'target_reading'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Show target laser rod measurement to aim for when leveling track"
            >
              <span>🎯 Target Rod</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetDisplayMode('relative_elev')}
              className={`h-full px-2.5 rounded-md font-bold text-xs flex items-center gap-1 transition ${
                displayMode === 'relative_elev'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Show physical relative elevation above/below laser datum"
            >
              <span>📐 Rel. Elev</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetDisplayMode('both')}
              className={`h-full px-2.5 rounded-md font-bold text-xs flex items-center gap-1 transition ${
                displayMode === 'both'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Show both Target Rod Reading and Relative Elevation side-by-side"
            >
              <span>Both</span>
            </button>
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 hidden sm:block">
          {displayMode === 'target_reading' && 'Target Rod: measurement on tape/rod when leveled'}
          {displayMode === 'relative_elev' && 'Relative Elevation: height relative to datum reference'}
          {displayMode === 'both' && 'Showing Target Rod & Relative Elevation'}
        </div>
      </div>

      {/* Active Laser Relocation / Datum Shift Banner */}
      {stations.some(s => s.isTurningPoint) && (
        <div className="px-3 sm:px-4 py-2 bg-purple-500/10 border-b border-purple-500/20 text-xs flex items-center justify-between gap-2 text-purple-700 dark:text-purple-300">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Flag className="w-3.5 h-3.5 shrink-0 text-purple-500" />
            <span>
              <strong>Laser Relocation Active:</strong>{' '}
              {(() => {
                const tpList = stations.filter(s => s.isTurningPoint);
                return (
                  <>
                    Turning Point benchmark at Station {tpList.map(t => `${t.distanceFt} ft`).join(', ')}. All readings converted to active laser scale.
                  </>
                );
              })()}
            </span>
          </div>
          {onResetDatum && (
            <button
              type="button"
              onClick={onResetDatum}
              className="text-[11px] font-bold underline hover:text-purple-900 dark:hover:text-purple-100 shrink-0"
              title="Revert all stations back to original Laser 1 readings"
            >
              Revert Laser Move
            </button>
          )}
        </div>
      )}

      {/* MOBILE LIST VIEW (md:hidden): ZERO horizontal scrolling, stacked field-friendly cards */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80 md:hidden">
        {stations.map((s) => {
          const isSelected = selectedStationId === s.id;
          const isCompleted = !!s.completed;
          const isLocked = !!s.isLocked;

          return (
            <div
              key={s.id}
              onClick={() => onEditStation(s)}
              className={`p-3 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/10 dark:bg-amber-500/15'
                  : isCompleted
                  ? 'bg-zinc-50/50 dark:bg-zinc-950/40 opacity-75'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
              }`}
            >
              {/* Top Header Row: Completed Check, Station Distance & Badges, Quick Action Buttons */}
              <div className="flex items-center justify-between gap-2 mb-2">
                {/* Left: Complete Checkbox + Distance + Status Badges */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(s.id);
                    }}
                    className="p-1 -m-1 text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition"
                    title={isCompleted ? 'Mark uncompleted' : 'Mark leveled'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <span className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {s.distanceFt} ft
                  </span>

                  {isLocked && (
                    <span
                      className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1"
                      title="Locked Tie / Control Point"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>LOCKED</span>
                    </span>
                  )}

                  {s.isTurningPoint && (
                    <span
                      className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-500/30 flex items-center gap-0.5"
                      title="Laser Relocation Benchmark (Turning Point)"
                    >
                      <Flag className="w-2.5 h-2.5" />
                      <span>TP</span>
                    </span>
                  )}
                </div>

                {/* Right: Quick Action Buttons (Lock, TP, Edit, Delete) */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {onToggleLock && (
                    <button
                      type="button"
                      onClick={() => onToggleLock(s.id)}
                      className={`p-1.5 rounded-lg border transition ${
                        isLocked
                          ? 'text-amber-500 bg-amber-500/15 border-amber-500/40'
                          : 'text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                      title={isLocked ? 'Unlock tie (allow normal lift/cut)' : 'Lock tie (fixed over root/structure)'}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {onSetTurningPoint && (
                    <button
                      type="button"
                      onClick={() => {
                        setTurningPointStation(s);
                        setTpNewReadingStr(s.readingInches !== null ? formatMeasurement(s.readingInches, unitFormat, fractionResolution) : '');
                        setTpError(null);
                      }}
                      className={`p-1.5 rounded-lg border transition ${
                        s.isTurningPoint
                          ? 'text-purple-500 bg-purple-500/15 border-purple-500/40'
                          : 'text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-purple-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                      title="Relocate Laser: Set Turning Point on this tie"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onEditStation(s)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    title="Edit measurement"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteStation(s.id)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    title="Delete station"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Middle Row: Readings & Target/Elevation */}
              <div className="grid grid-cols-2 gap-2 py-1.5 px-2.5 bg-zinc-100/60 dark:bg-zinc-900/60 rounded-xl mb-2 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-semibold">
                    {s.isTurningPoint ? 'Laser Reading (TP)' : 'Laser Reading'}
                  </span>
                  {s.isTurningPoint ? (
                    <div className="font-mono text-xs">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span>{s.readingInches !== null ? formatMeasurement(s.readingInches, unitFormat, fractionResolution) : '—'}</span>
                        <span className="text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1 py-0.2 rounded font-sans font-semibold">
                          Active Laser backsight
                        </span>
                      </div>
                      {s.tpOldReadingInches !== undefined && (
                        <div className="text-[11px] text-zinc-500 font-sans mt-0.5">
                          Laser 1 was: {formatMeasurement(s.tpOldReadingInches, unitFormat, fractionResolution)}{' '}
                          <span className="font-mono">
                            ({(s.datumOffsetInches ?? 0) >= 0 ? '+' : ''}{formatMeasurement(s.datumOffsetInches ?? 0, unitFormat, fractionResolution)} shift)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : s.readingInches !== null ? (
                    <div>
                      <div className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {formatMeasurement(s.readingInches, unitFormat, fractionResolution)}
                      </div>
                      {s.datumOffsetInches !== undefined && s.datumOffsetInches !== 0 && (
                        <div className="text-[11px] font-sans text-purple-600 dark:text-purple-400 mt-0.5">
                          Was: <strong>{formatMeasurement(s.readingInches - s.datumOffsetInches, unitFormat, fractionResolution)}</strong>{' '}
                          <span className="text-[10px] text-purple-500/80">
                            ({s.datumOffsetInches >= 0 ? '+' : ''}{formatMeasurement(s.datumOffsetInches, unitFormat, fractionResolution)} laser shift)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-amber-500 italic text-xs">Tap to Enter</span>
                  )}
                </div>

                {/* Right Column: Target Rod and/or Relative Elevation based on displayMode */}
                <div className="text-right">
                  {displayMode === 'target_reading' && (
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Target Rod</span>
                      <div className="font-mono font-bold text-sm text-sky-600 dark:text-sky-400 flex items-center justify-end gap-1">
                        <span className="text-xs">🎯</span>
                        <span>
                          {s.targetReadingInches !== null && s.targetReadingInches !== undefined
                            ? formatMeasurement(s.targetReadingInches, unitFormat, fractionResolution)
                            : '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {displayMode === 'relative_elev' && (
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Rel. Elevation</span>
                      <div className="font-mono font-bold text-sm text-zinc-700 dark:text-zinc-300">
                        {s.elevationInches !== null
                          ? formatMeasurement(s.elevationInches, unitFormat, fractionResolution)
                          : '—'}
                      </div>
                    </div>
                  )}

                  {displayMode === 'both' && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Target:</span>
                        <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400">
                          {s.targetReadingInches !== null && s.targetReadingInches !== undefined
                            ? formatMeasurement(s.targetReadingInches, unitFormat, fractionResolution)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Elev:</span>
                        <span className="font-mono font-bold text-xs text-zinc-700 dark:text-zinc-300">
                          {s.elevationInches !== null
                            ? formatMeasurement(s.elevationInches, unitFormat, fractionResolution)
                            : '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Full-width Track Action Banner */}
              <div>
                {isLocked ? (
                  <div className="w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>LOCKED</span>
                  </div>
                ) : (
                  <>
                    {s.action === 'ok' && (
                      <div className="w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ON GRADE ✓</span>
                      </div>
                    )}
                    {s.action === 'lift' && (
                      <div className="w-full py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                        <ArrowUpCircle className="w-4 h-4 text-sky-500" />
                        <span>{s.actionText}</span>
                      </div>
                    )}
                    {s.action === 'lower' && (
                      <div className="w-full py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        <ArrowDownCircle className="w-4 h-4 text-amber-500" />
                        <span>{s.actionText}</span>
                      </div>
                    )}
                    {s.action === 'none' && (
                      <div className="w-full py-1 px-3 rounded-xl text-xs text-center text-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/50">
                        Awaiting reading
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW (hidden md:block): full table layout with all columns */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-100/70 dark:bg-zinc-950 font-bold">
              <th className="py-2.5 px-3 w-10 text-center">Status</th>
              <th className="py-2.5 px-3">Station</th>
              <th className="py-2.5 px-3">Laser Reading</th>
              {(displayMode === 'target_reading' || displayMode === 'both') && (
                <th
                  className="py-2.5 px-3 cursor-pointer hover:text-amber-500 transition select-none"
                  onClick={handleCycleDisplayMode}
                  title="Click to toggle display mode (Target Rod vs Rel. Elev vs Both)"
                >
                  <div className="flex items-center gap-1">
                    <span>Target Rod</span>
                    <span className="text-[9px] lowercase font-normal opacity-70">(tap to toggle)</span>
                  </div>
                </th>
              )}
              {(displayMode === 'relative_elev' || displayMode === 'both') && (
                <th
                  className="py-2.5 px-3 cursor-pointer hover:text-amber-500 transition select-none"
                  onClick={handleCycleDisplayMode}
                  title="Click to toggle display mode (Target Rod vs Rel. Elev vs Both)"
                >
                  <div className="flex items-center gap-1">
                    <span>Relative Elev.</span>
                    <span className="text-[9px] lowercase font-normal opacity-70">(tap to toggle)</span>
                  </div>
                </th>
              )}
              <th className="py-2.5 px-3 text-center">Track Action</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-sm">
            {stations.map((s) => {
              const isSelected = selectedStationId === s.id;
              const isCompleted = !!s.completed;
              const isLocked = !!s.isLocked;

              return (
                <tr
                  key={s.id}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 font-medium'
                      : isCompleted
                      ? 'bg-zinc-50/40 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-600'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                  }`}
                  onClick={() => onEditStation(s)}
                >
                  {/* Completed Checkmark Toggle */}
                  <td
                    className="py-3 px-3 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(s.id);
                    }}
                  >
                    <button
                      className="text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition"
                      title={isCompleted ? 'Mark uncompleted' : 'Mark leveled'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </td>

                  {/* Station Distance & Badges */}
                  <td className="py-3 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{s.distanceFt} ft</span>
                      {isLocked && (
                        <span
                          className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5"
                          title="Locked Tie / Control Point"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>LOCKED</span>
                        </span>
                      )}
                      {s.isTurningPoint && (
                        <span
                          className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-500/30 flex items-center gap-0.5"
                          title="Laser Relocation Benchmark (Turning Point)"
                        >
                          <Flag className="w-2.5 h-2.5" />
                          <span>TP</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Laser Reading */}
                  <td className="py-3 px-3 font-mono">
                    {s.isTurningPoint ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                            {s.readingInches !== null ? formatMeasurement(s.readingInches, unitFormat, fractionResolution) : '—'}
                          </span>
                          <span className="text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1 py-0.2 rounded font-sans font-semibold">
                            Active Laser backsight
                          </span>
                        </div>
                        {s.tpOldReadingInches !== undefined && (
                          <div className="text-[11px] text-zinc-500 font-sans">
                            Laser 1 was: {formatMeasurement(s.tpOldReadingInches, unitFormat, fractionResolution)}{' '}
                            <span className="font-mono">
                              ({(s.datumOffsetInches ?? 0) >= 0 ? '+' : ''}{formatMeasurement(s.datumOffsetInches ?? 0, unitFormat, fractionResolution)} shift)
                            </span>
                          </div>
                        )}
                      </div>
                    ) : s.readingInches !== null ? (
                      s.datumOffsetInches !== undefined && s.datumOffsetInches !== 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="text-zinc-900 dark:text-zinc-100 font-semibold">
                            {formatMeasurement(s.readingInches, unitFormat, fractionResolution)}
                          </div>
                          <div className="text-[11px] font-sans text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <span>
                              Was: <strong>{formatMeasurement(s.readingInches - s.datumOffsetInches, unitFormat, fractionResolution)}</strong>
                            </span>
                            <span className="text-[10px] text-purple-500/80">
                              ({s.datumOffsetInches >= 0 ? '+' : ''}{formatMeasurement(s.datumOffsetInches, unitFormat, fractionResolution)} laser shift)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                          {formatMeasurement(s.readingInches, unitFormat, fractionResolution)}
                        </span>
                      )
                    ) : (
                      <span className="text-zinc-400 text-xs italic bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded">
                        Need Reading
                      </span>
                    )}
                  </td>

                  {/* Target Rod Column */}
                  {(displayMode === 'target_reading' || displayMode === 'both') && (
                    <td className="py-3 px-3 font-mono font-bold text-xs">
                      {s.targetReadingInches !== null && s.targetReadingInches !== undefined ? (
                        <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                          <span className="text-[11px]">🎯</span>
                          <span>{formatMeasurement(s.targetReadingInches, unitFormat, fractionResolution)}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  )}

                  {/* Relative Elevation Column */}
                  {(displayMode === 'relative_elev' || displayMode === 'both') && (
                    <td className="py-3 px-3 font-mono text-zinc-500 dark:text-zinc-400 text-xs">
                      {s.elevationInches !== null
                        ? formatMeasurement(s.elevationInches, unitFormat, fractionResolution)
                        : '—'}
                    </td>
                  )}

                  {/* Track Action Badge */}
                  <td className="py-3 px-3 text-center">
                    {isLocked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        LOCKED
                      </span>
                    ) : (
                      <>
                        {s.action === 'ok' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ON GRADE
                          </span>
                        )}
                        {s.action === 'lift' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                            <ArrowUpCircle className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                            {s.actionText}
                          </span>
                        )}
                        {s.action === 'lower' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            <ArrowDownCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                            {s.actionText}
                          </span>
                        )}
                        {s.action === 'none' && (
                          <span className="text-zinc-400 text-xs">—</span>
                        )}
                      </>
                    )}
                  </td>

                  {/* Row Actions */}
                  <td
                    className="py-3 px-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {onToggleLock && (
                        <button
                          onClick={() => onToggleLock(s.id)}
                          className={`p-1.5 rounded transition ${
                            isLocked
                              ? 'text-amber-500 bg-amber-500/15 hover:bg-amber-500/25'
                              : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                          title={isLocked ? 'Unlock tie (allow normal lift/cut)' : 'Lock tie (fixed point / tree root)'}
                        >
                          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      )}
                      {onSetTurningPoint && (
                        <button
                          onClick={() => {
                            setTurningPointStation(s);
                            setTpNewReadingStr(s.readingInches !== null ? formatMeasurement(s.readingInches, unitFormat, fractionResolution) : '');
                            setTpError(null);
                          }}
                          className={`p-1.5 rounded transition ${
                            s.isTurningPoint
                              ? 'text-purple-500 bg-purple-500/15 hover:bg-purple-500/25'
                              : 'text-zinc-400 hover:text-purple-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                          title="Relocate Laser: Set Turning Point on this tie"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditStation(s)}
                        className="p-1.5 text-zinc-400 hover:text-amber-500 rounded transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Edit measurement"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteStation(s.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Delete station"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {stations.length === 0 && (
        <div className="p-8 text-center text-zinc-400 text-sm">
          No stations added yet. Tap "+ Add Next" to start recording your track profile.
        </div>
      )}

      {/* Extend Track Batch Modal */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Extend Track Profile</span>
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 font-medium block mb-1">Length to add (feet):</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[25, 50, 100, 200].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setExtendLength(amt)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        extendLength === amt
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      +{amt}'
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-medium block mb-1">Station Interval (feet):</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 5, 10].map(inv => (
                    <button
                      key={inv}
                      type="button"
                      onClick={() => setExtendInterval(inv)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        extendInterval === inv
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {inv}'
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 font-medium block mb-1">Direction to extend:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExtendDirection('forward')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 ${
                      extendDirection === 'forward'
                        ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <span>Ahead (Forward &rarr;)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendDirection('backward')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 ${
                      extendDirection === 'backward'
                        ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <span>Behind 0 (Backward &larr;)</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono">
                {extendDirection === 'forward' ? (
                  <>
                    Will create {Math.floor(extendLength / extendInterval)} blank stations ahead ({lastDist + extendInterval}' to{' '}
                    {lastDist + extendLength}').
                  </>
                ) : (
                  <>
                    Will create {Math.floor(extendLength / extendInterval)} blank stations backwards (
                    {firstDist - extendLength}' to {firstDist - extendInterval}').
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onExtendTrack?.(extendLength, extendInterval, extendDirection);
                  setIsExtendModalOpen(false);
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-sm"
              >
                Add {extendLength} Feet {extendDirection === 'forward' ? 'Ahead' : 'Before 0'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Relocate Laser / Turning Point Modal */}
      {turningPointStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Flag className="w-4 h-4 text-purple-500" />
              <span>Relocate Laser (Datum Shift)</span>
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              When moving the rotary laser tripod forward or continuing next weekend, take one reading on this benchmark tie with your{' '}
              <strong>new laser setup</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 font-bold block mb-1">Benchmark Tie (Station):</label>
                <select
                  value={turningPointStation.id}
                  onChange={(e) => {
                    const found = stations.find(s => s.id === e.target.value);
                    if (found) {
                      setTurningPointStation(found);
                      setTpNewReadingStr(found.readingInches !== null ? formatMeasurement(found.readingInches, unitFormat, fractionResolution) : '');
                      setTpError(null);
                    }
                  }}
                  className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none font-mono"
                >
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>
                      Station {s.distanceFt} ft {s.readingInches !== null ? `(Recorded: ${formatMeasurement(s.readingInches, unitFormat, fractionResolution)})` : '(⚠️ No reading yet)'}
                    </option>
                  ))}
                </select>
              </div>

              {turningPointStation.readingInches === null && (
                <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-sans">
                  ⚠️ <strong>Reading Needed First:</strong> Station {turningPointStation.distanceFt} ft has no measurement recorded under your old laser. A turning point tie must be measured before moving the laser so the app can connect the two setups. Please select an already measured tie above.
                </div>
              )}

              <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
                <div className="flex justify-between items-center pb-1 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500">Old Laser Reading:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {turningPointStation.readingInches !== null
                      ? formatMeasurement(turningPointStation.readingInches, unitFormat, fractionResolution)
                      : 'None recorded'}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <label className="text-zinc-500 font-bold block">New Laser Reading on this tie:</label>
                  <input
                    type="text"
                    value={tpNewReadingStr}
                    onChange={(e) => setTpNewReadingStr(e.target.value)}
                    placeholder="e.g. 1' 4 3/8 or 16.5"
                    className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none font-mono"
                    autoFocus
                  />
                  {tpError && <p className="text-red-500 text-[11px] font-sans">{tpError}</p>}
                </div>
              </div>

              {(() => {
                const parsed = parseMeasurement(tpNewReadingStr);
                if (parsed !== null && !isNaN(parsed) && parsed > 0 && turningPointStation.readingInches !== null) {
                  const shift = parsed - turningPointStation.readingInches;
                  const st0 = stations.find(s => s.distanceFt === 0);
                  const st0NewReading = st0 && st0.readingInches !== null ? st0.readingInches + shift : null;

                  return (
                    <div className="p-2.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-800 dark:text-purple-300 text-xs space-y-1.5 font-sans">
                      <div className="font-bold font-mono">
                        Laser Relocation Shift: {shift >= 0 ? '+' : ''}{formatMeasurement(shift, unitFormat, fractionResolution)}
                      </div>
                      <p className="text-[11px] leading-tight text-purple-700 dark:text-purple-400">
                        {shift !== 0
                          ? `All previously measured stations (0 ft to ${turningPointStation.distanceFt} ft) will convert to your new laser's scale (${shift >= 0 ? '+' : ''}${formatMeasurement(shift, unitFormat, fractionResolution)}). ${st0NewReading !== null ? `If you walk back to Station 0 with your rod right now, it will read ${formatMeasurement(st0NewReading, unitFormat, fractionResolution)} to match your active laser!` : ''}`
                          : `Both setups are at the exact same height (0" shift).`}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        All physical elevations, target slopes, and track lifts remain 100% physically identical.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setTurningPointStation(null)}
                className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                disabled={turningPointStation.readingInches === null}
                onClick={handleApplyTurningPoint}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-sm"
              >
                Apply Laser Relocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
