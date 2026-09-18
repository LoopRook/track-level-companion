import React, { useState, useEffect } from 'react';
import { CalculatedStation, UnitFormat, PrototypeStyle } from '../core/types';
import { formatMeasurement, parseMeasurement } from '../core/units';
import { CheckCircle2, Circle, Edit3, Trash2, Plus, ArrowUpCircle, ArrowDownCircle, Layers, Flag, Lock, Unlock, X } from 'lucide-react';
import { useBodyScrollLock } from '../core/useBodyScrollLock';

export interface ActionTableProps {
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
  onOpenMoveLaser?: () => void;
  selectedStationId?: string | null;
  prototypeStyle?: PrototypeStyle;
  mobileLayout?: 'bottom_nav' | 'tabbed' | 'stacked';
  displayMode?: TableDisplayMode;
  onChangeDisplayMode?: (mode: TableDisplayMode) => void;
  isExternalExtendOpen?: boolean;
  onCloseExternalExtend?: () => void;
  isExternalMoveLaserOpen?: boolean;
  onCloseExternalMoveLaser?: () => void;
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
  onOpenMoveLaser,
  selectedStationId,
  prototypeStyle = 'original',
  mobileLayout = 'bottom_nav',
  displayMode: propDisplayMode,
  onChangeDisplayMode,
  isExternalExtendOpen = false,
  onCloseExternalExtend,
  isExternalMoveLaserOpen = false,
  onCloseExternalMoveLaser,
}) => {
  const [localDisplayMode, setLocalDisplayMode] = useState<TableDisplayMode>(() => {
    try {
      const saved = localStorage.getItem('track_level_table_display_mode');
      if (saved === 'target_reading' || saved === 'relative_elev' || saved === 'both') {
        return saved as TableDisplayMode;
      }
      return 'target_reading';
    } catch {
      return 'target_reading';
    }
  });

  const displayMode = propDisplayMode !== undefined ? propDisplayMode : localDisplayMode;

  const handleSetDisplayMode = (mode: TableDisplayMode) => {
    setLocalDisplayMode(mode);
    onChangeDisplayMode?.(mode);
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

  const [localExtendModalOpen, setLocalExtendModalOpen] = useState(false);
  const isExtendModalOpen = isExternalExtendOpen || localExtendModalOpen;
  const [extendLength, setExtendLength] = useState(50);
  const [extendInterval, setExtendInterval] = useState(5);
  const [extendDirection, setExtendDirection] = useState<'forward' | 'backward'>('forward');

  const [turningPointStation, setTurningPointStation] = useState<CalculatedStation | null>(null);
  const [tpNewReadingStr, setTpNewReadingStr] = useState('');
  const [tpError, setTpError] = useState<string | null>(null);

  const handleCloseExtendModal = () => {
    setLocalExtendModalOpen(false);
    onCloseExternalExtend?.();
  };

  const handleCloseTurningPoint = () => {
    setTurningPointStation(null);
    onCloseExternalMoveLaser?.();
  };

  useEffect(() => {
    if (isExternalMoveLaserOpen) {
      const measured = stations.filter(s => s.readingInches !== null);
      const target = (measured.length > 0 ? measured[measured.length - 1] : stations[0]) || null;
      if (target) {
        setTurningPointStation(target);
        setTpNewReadingStr(target.readingInches !== null ? formatMeasurement(target.readingInches, unitFormat, fractionResolution) : '');
        setTpError(null);
        onOpenMoveLaser?.();
      }
    }
  }, [isExternalMoveLaserOpen, stations, unitFormat, fractionResolution, onOpenMoveLaser]);

  useBodyScrollLock(isExtendModalOpen || !!turningPointStation);

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
    handleCloseTurningPoint();
  };

  return (
    <div className={`proto-card bg-white dark:bg-black md:border border-zinc-200 dark:border-zinc-800 md:rounded-2xl md:shadow-sm overflow-hidden flex flex-col transition-colors h-full min-h-0 ${
      mobileLayout === 'bottom_nav' ? 'mobile-edge-to-edge' : ''
    }`}>
      {/* Header Toolbar (Hidden on mobile phones when bottom_nav is active; controls live in the Nothing OS bottom console) */}
      <div className={`px-3 sm:px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-950 shrink-0 ${
        mobileLayout === 'bottom_nav' ? 'hidden md:flex' : 'flex'
      }`}>
        <div>
          <h3 className={`font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap ${
            prototypeStyle === 'nothing' ? "font-['Space_Mono'] uppercase tracking-[0.08em] text-xs font-bold" : "text-sm sm:text-base"
          }`}>
            {prototypeStyle === 'nothing' ? '[ TRACKSIDE LEVELING CHECKLIST ]' : 'Trackside Leveling Checklist'}
          </h3>
          <p className={`text-[11px] text-zinc-500 dark:text-zinc-400 ${
            prototypeStyle === 'nothing' ? "font-['Space_Mono'] uppercase tracking-wider text-[10px]" : ''
          }`}>
            {prototypeStyle === 'nothing' ? 'TAP ROW TO RECORD READING OR SHIM' : 'Tap row to record reading or adjust shims'}
          </p>
        </div>
        {/* Quick Toolbar: 2x2 grid on mobile for effortless tapping, single sleek row on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto shrink-0">
          <button
            onClick={onAddNextStation}
            data-tutorial="add-next-btn"
            className={`h-8 px-2 sm:px-2.5 transition flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap ${
              prototypeStyle === 'nothing'
                ? 'rounded-full bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-["Space_Mono"] uppercase tracking-wider text-xs font-bold shadow-none'
                : 'rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-sm'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Next</span>
          </button>
          {onExtendTrack && (
            <button
              onClick={() => setLocalExtendModalOpen(true)}
              className={`h-8 px-2 sm:px-2.5 transition flex items-center justify-center gap-1 whitespace-nowrap ${
                prototypeStyle === 'nothing'
                  ? 'rounded-full bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-900 dark:hover:border-zinc-500 font-["Space_Mono"] uppercase tracking-wider text-xs shadow-none'
                  : 'rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-xs'
              }`}
              title="Add a 50ft or 100ft section of stations in one click"
            >
              <Layers className="w-3.5 h-3.5 text-current" />
              <span>+ Extend</span>
            </button>
          )}
          {onSetTurningPoint && (
            <button
              data-tutorial="move-laser-btn"
              onClick={() => {
                const measured = stations.filter(s => s.readingInches !== null);
                const target = (measured.length > 0 ? measured[measured.length - 1] : stations[0]) || null;
                if (target) {
                  setTurningPointStation(target);
                  setTpNewReadingStr(target.readingInches !== null ? formatMeasurement(target.readingInches, unitFormat, fractionResolution) : '');
                  setTpError(null);
                  onOpenMoveLaser?.();
                }
              }}
              className={`h-8 px-2 sm:px-2.5 transition flex items-center justify-center gap-1 whitespace-nowrap ${
                prototypeStyle === 'nothing'
                  ? 'rounded-full bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-900 dark:hover:border-zinc-500 font-["Space_Mono"] uppercase tracking-wider text-xs shadow-none'
                  : 'rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 font-semibold text-xs'
              }`}
              title="Pick up rotary laser and relocate forward: set turning point benchmark"
            >
              <Flag className="w-3.5 h-3.5 text-current" />
              <span>Move Laser</span>
            </button>
          )}
          <button
            onClick={onInsertCustomStation}
            className={`h-8 px-2 sm:px-2.5 transition flex items-center justify-center whitespace-nowrap ${
              prototypeStyle === 'nothing'
                ? 'rounded-full bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-900 dark:hover:border-zinc-500 font-["Space_Mono"] uppercase tracking-wider text-xs shadow-none'
                : 'rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-xs'
            }`}
          >
            + Custom Pt
          </button>
        </div>
      </div>

      {/* View Mode & Column Selector Toolbar (Hidden on mobile phones when bottom_nav is active) */}
      <div className={`px-3 sm:px-4 py-2 border-b flex items-center justify-between gap-2 flex-wrap text-xs shrink-0 ${
        mobileLayout === 'bottom_nav' ? 'hidden md:flex' : 'flex'
      } ${
        prototypeStyle === 'nothing'
          ? 'bg-transparent border-zinc-200 dark:border-zinc-800'
          : 'bg-zinc-100/70 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold uppercase tracking-wider text-[10px] shrink-0 ${
            prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-500 tracking-[0.08em]' : 'text-zinc-400 dark:text-zinc-300'
          }`}>
            {prototypeStyle === 'nothing' ? '[ DISPLAY ]' : 'Display:'}
          </span>
          <div className={`flex p-0.5 h-7 items-center shrink-0 ${
            prototypeStyle === 'nothing'
              ? 'rounded-full bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800'
              : 'rounded-lg bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800'
          }`}>
            <button
              type="button"
              onClick={() => handleSetDisplayMode('target_reading')}
              className={`h-full px-2.5 font-bold text-xs flex items-center gap-1 transition whitespace-nowrap shrink-0 ${
                prototypeStyle === 'nothing'
                  ? displayMode === 'target_reading'
                    ? 'rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black font-["Space_Mono"] uppercase tracking-wider text-[10px] shadow-none'
                    : 'rounded-full text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-["Space_Mono"] uppercase tracking-wider text-[10px]'
                  : displayMode === 'target_reading'
                  ? 'rounded-md bg-amber-500 text-black shadow-xs'
                  : 'rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Show target laser rod measurement to aim for when leveling track"
            >
              <span>Target Rod</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetDisplayMode('relative_elev')}
              className={`h-full px-2.5 font-bold text-xs flex items-center gap-1 transition whitespace-nowrap shrink-0 ${
                prototypeStyle === 'nothing'
                  ? displayMode === 'relative_elev'
                    ? 'rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black font-["Space_Mono"] uppercase tracking-wider text-[10px] shadow-none'
                    : 'rounded-full text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-["Space_Mono"] uppercase tracking-wider text-[10px]'
                  : displayMode === 'relative_elev'
                  ? 'rounded-md bg-amber-500 text-black shadow-xs'
                  : 'rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Show physical relative elevation above/below laser datum"
            >
              <span>Rel. Elev</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetDisplayMode('both')}
              className={`h-full px-2.5 font-bold text-xs flex items-center gap-1 transition whitespace-nowrap shrink-0 ${
                prototypeStyle === 'nothing'
                  ? displayMode === 'both'
                    ? 'rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black font-["Space_Mono"] uppercase tracking-wider text-[10px] shadow-none'
                    : 'rounded-full text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-["Space_Mono"] uppercase tracking-wider text-[10px]'
                  : displayMode === 'both'
                  ? 'rounded-md bg-amber-500 text-black shadow-xs'
                  : 'rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Show both Target Rod Reading and Relative Elevation side-by-side"
            >
              <span>Both</span>
            </button>
          </div>
        </div>
        <div className={`text-[11px] hidden sm:block ${
          prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-[10px] text-zinc-500 uppercase tracking-wider' : 'text-zinc-500'
        }`}>
          {displayMode === 'target_reading' && (prototypeStyle === 'nothing' ? '[ TARGET ROD: READING WHEN LEVELED ]' : 'Target Rod: measurement on tape/rod when leveled')}
          {displayMode === 'relative_elev' && (prototypeStyle === 'nothing' ? '[ RELATIVE ELEVATION: RELATIVE TO DATUM ]' : 'Relative Elevation: height relative to datum reference')}
          {displayMode === 'both' && (prototypeStyle === 'nothing' ? '[ TARGET ROD & RELATIVE ELEVATION ]' : 'Showing Target Rod & Relative Elevation')}
        </div>
      </div>

      {/* Active Laser Relocation / Datum Shift Banner */}
      {stations.some(s => s.isTurningPoint) && (
        <div
          data-tutorial="tp-active-banner"
          className="px-3 sm:px-4 py-2 bg-purple-500/10 border-b border-purple-500/20 text-xs flex items-center justify-between gap-2 text-purple-700 dark:text-purple-300 shrink-0"
        >
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

      {/* MOBILE LIST VIEW (md:hidden): ZERO horizontal scrolling, stacked field-friendly cards with contained scroll */}
      <div className={`divide-y md:hidden ${
        mobileLayout === 'stacked'
          ? 'pb-16'
          : 'flex-1 overflow-y-auto min-h-0 pb-36'
      } ${prototypeStyle === 'nothing' ? 'divide-zinc-200 dark:divide-zinc-800/80' : 'divide-zinc-200 dark:divide-zinc-800/80'}`}>
        {stations.map((s) => {
          const isSelected = selectedStationId === s.id;
          const isCompleted = !!s.completed;
          const isLocked = !!s.isLocked;

          return (
            <div
              key={s.id}
              onClick={() => onEditStation(s)}
              data-tutorial={s.distanceFt === 0 ? 'station-card-0' : s.distanceFt === 5 ? 'station-card-5' : s.distanceFt === 10 ? 'station-card-10' : undefined}
              className={`p-3 transition-all cursor-pointer border-l-2 ${
                prototypeStyle === 'nothing'
                  ? isSelected
                    ? 'bg-zinc-100/90 dark:bg-zinc-900/60 border-l-[#D71921]'
                    : isCompleted
                    ? 'bg-transparent opacity-40 grayscale-[0.2] border-l-transparent'
                    : 'hover:bg-zinc-100/70 dark:hover:bg-zinc-900/40 bg-transparent border-l-transparent'
                  : isSelected
                  ? 'bg-amber-500/10 dark:bg-amber-500/15 border-l-amber-500'
                  : isCompleted
                  ? 'bg-zinc-100/50 dark:bg-zinc-950/70 opacity-40 grayscale-[0.2] border-l-transparent'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60 border-l-transparent'
              }`}
            >
              {/* Top Header Row: Completed Check, Station Distance & Badges, Quick Action Buttons */}
              <div className="flex items-center justify-between gap-2 mb-2">
                {/* Left: Complete Checkbox (44x44px Fitts' Law touch target) + Distance + Status Badges */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <button
                    type="button"
                    data-tutorial={s.distanceFt === 0 ? 'station-complete-0' : s.distanceFt === 5 ? 'station-complete-5' : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(s.id);
                    }}
                    className="w-11 h-11 -m-2.5 flex items-center justify-center rounded-xl text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-90 transition shrink-0"
                    title={isCompleted ? 'Mark uncompleted' : 'Mark leveled'}
                    aria-label={isCompleted ? 'Mark uncompleted' : 'Mark leveled'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className={`w-5 h-5 ${prototypeStyle === 'nothing' ? 'text-[#4A9E5C]' : 'text-emerald-500'}`} />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <span className={`${
                    prototypeStyle === 'nothing' ? 'font-["Space_Mono"] font-bold text-sm tracking-tight' : 'font-mono font-bold text-base'
                  } ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {s.distanceFt} ft
                  </span>

                  {isLocked && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap shrink-0 ${
                        prototypeStyle === 'nothing'
                          ? 'font-["Space_Mono"] uppercase tracking-wider text-[9px] border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-transparent rounded-full'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                      title="Locked Tie / Control Point"
                    >
                      <Lock className="w-2.5 h-2.5 shrink-0" />
                      <span>LOCKED</span>
                    </span>
                  )}

                  {s.isTurningPoint && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap shrink-0 ${
                        prototypeStyle === 'nothing'
                          ? 'font-["Space_Mono"] uppercase tracking-wider text-[9px] border border-[#D71921] text-[#D71921] bg-transparent rounded-full'
                          : 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                      }`}
                      title="Laser Relocation Benchmark (Turning Point)"
                    >
                      <Flag className="w-2.5 h-2.5 shrink-0" />
                      <span>TP</span>
                    </span>
                  )}
                </div>

                {/* Right: Quick Action Buttons (Lock, TP, Edit, Delete) with ample touch spacing */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {onToggleLock && (
                    <button
                      type="button"
                      data-tutorial={`station-lock-${s.distanceFt}`}
                      onClick={() => onToggleLock(s.id)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${
                        prototypeStyle === 'nothing'
                          ? isLocked
                            ? 'text-zinc-900 dark:text-white border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 rounded-full'
                            : 'text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800 hover:text-black dark:hover:text-white hover:border-zinc-500 dark:hover:border-zinc-700 bg-transparent rounded-full'
                          : isLocked
                          ? 'text-amber-500 bg-amber-500/15 border-amber-500/40'
                          : 'text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                      title={isLocked ? 'Unlock tie (allow normal lift/lower)' : 'Lock tie (fixed over root/structure)'}
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
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${
                        prototypeStyle === 'nothing'
                          ? s.isTurningPoint
                            ? 'text-[#D71921] border-[#D71921] bg-transparent rounded-full'
                            : 'text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800 hover:text-black dark:hover:text-white hover:border-zinc-500 dark:hover:border-zinc-700 bg-transparent rounded-full'
                          : s.isTurningPoint
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
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${
                      prototypeStyle === 'nothing'
                        ? 'border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-zinc-500 dark:hover:border-zinc-700 bg-transparent rounded-full'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title="Edit measurement"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteStation(s.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${
                      prototypeStyle === 'nothing'
                        ? 'border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-[#D71921] hover:border-[#D71921]/50 bg-transparent rounded-full'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title="Delete station"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Middle Row: Readings & Target/Elevation */}
              <div
                data-tutorial={s.distanceFt === 0 ? 'station-reading-0' : s.distanceFt === 5 ? 'station-reading-5' : s.distanceFt === 10 ? 'station-reading-10' : undefined}
                className={`grid grid-cols-2 gap-2 py-1.5 px-2.5 rounded-xl mb-2 text-xs ${
                  prototypeStyle === 'nothing'
                    ? 'bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 font-["Space_Mono"]'
                    : 'bg-zinc-100/60 dark:bg-zinc-900/60'
                }`}
              >
                <div>
                  <span className={`text-[10px] block uppercase font-bold ${
                    prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-500 tracking-wider text-[9px]' : 'text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {s.isTurningPoint ? (prototypeStyle === 'nothing' ? '[ READING (TP) ]' : 'Last Reading (TP)') : (prototypeStyle === 'nothing' ? '[ READING ]' : 'Last Reading')}
                  </span>
                  {s.isTurningPoint ? (
                    <div className="font-mono text-xs">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span>{s.readingInches !== null ? formatMeasurement(s.readingInches, unitFormat, fractionResolution) : '—'}</span>
                        <span className={`text-[10px] px-1 py-0.2 rounded whitespace-nowrap shrink-0 ${
                          prototypeStyle === 'nothing'
                            ? 'font-["Space_Mono"] uppercase text-[9px] border border-[#D71921] text-[#D71921] bg-transparent'
                            : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-sans font-semibold'
                        }`}>
                          Active backsight
                        </span>
                      </div>
                      {s.tpOldReadingInches !== undefined && (
                        <div className="text-[11px] text-zinc-500 font-sans mt-0.5">
                          Laser 1 was: {formatMeasurement(s.tpOldReadingInches, unitFormat, fractionResolution)}{' '}
                          <span className="font-mono whitespace-nowrap">
                            ({(s.datumOffsetInches ?? 0) >= 0 ? '+' : ''}{formatMeasurement(s.datumOffsetInches ?? 0, unitFormat, fractionResolution)} shift)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : s.readingInches !== null ? (
                    <div>
                      <div className={`font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 ${
                        prototypeStyle === 'nothing' ? 'font-["Space_Mono"]' : ''
                      }`}>
                        {formatMeasurement(s.readingInches, unitFormat, fractionResolution)}
                      </div>
                      {s.datumOffsetInches !== undefined && s.datumOffsetInches !== 0 && (
                        <div className="text-[11px] font-sans text-purple-600 dark:text-purple-400 mt-0.5">
                          Was: <strong>{formatMeasurement(s.readingInches - s.datumOffsetInches, unitFormat, fractionResolution)}</strong>{' '}
                          <span className="text-[10px] text-purple-500/80 whitespace-nowrap">
                            ({s.datumOffsetInches >= 0 ? '+' : ''}{formatMeasurement(s.datumOffsetInches, unitFormat, fractionResolution)} laser shift)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`italic text-xs ${
                      prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-500 not-italic' : 'text-amber-500'
                    }`}>
                      {prototypeStyle === 'nothing' ? '[ NEED READING ]' : 'Tap to Enter'}
                    </span>
                  )}
                </div>

                {/* Right Column: Target Rod and/or Relative Elevation based on displayMode */}
                <div className="text-right">
                  {displayMode === 'target_reading' && (
                    <div>
                      <span className={`text-[10px] block uppercase font-bold ${
                        prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-500 tracking-wider text-[9px]' : 'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {prototypeStyle === 'nothing' ? '[ TARGET ROD ]' : 'Target Rod'}
                      </span>
                      <div className={`font-mono font-bold text-sm flex items-center justify-end gap-1 ${
                        prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-[#5B9BF6]' : 'text-sky-700 dark:text-sky-400'
                      }`}>
                        <span>
                          {s.targetReadingInches !== null && s.targetReadingInches !== undefined
                            ? formatMeasurement(s.targetReadingInches, unitFormat, fractionResolution)
                            : s.readingInches === null
                            ? '—'
                            : 'Need end shot'}
                        </span>
                      </div>
                    </div>
                  )}

                  {displayMode === 'relative_elev' && (
                    <div>
                      <span className={`text-[10px] block uppercase font-bold ${
                        prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-500 tracking-wider text-[9px]' : 'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {prototypeStyle === 'nothing' ? '[ REL. ELEV ]' : 'Rel. Elevation'}
                      </span>
                      <div className={`font-mono font-bold text-sm text-zinc-800 dark:text-zinc-200 ${
                        prototypeStyle === 'nothing' ? 'font-["Space_Mono"]' : ''
                      }`}>
                        {s.elevationInches !== null
                          ? formatMeasurement(s.elevationInches, unitFormat, fractionResolution)
                          : '—'}
                      </div>
                    </div>
                  )}

                  {displayMode === 'both' && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-end gap-1">
                        <span className={`text-[10px] uppercase font-bold ${
                          prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-500 text-[9px]' : 'text-zinc-600 dark:text-zinc-400'
                        }`}>Target:</span>
                        <span className={`font-mono font-bold text-xs ${
                          prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-[#5B9BF6]' : 'text-sky-700 dark:text-sky-400'
                        }`}>
                          {s.targetReadingInches !== null && s.targetReadingInches !== undefined
                            ? formatMeasurement(s.targetReadingInches, unitFormat, fractionResolution)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <span className={`text-[10px] uppercase font-bold ${
                          prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-500 text-[9px]' : 'text-zinc-600 dark:text-zinc-400'
                        }`}>Elev:</span>
                        <span className={`font-mono font-bold text-xs text-zinc-800 dark:text-zinc-200 ${
                          prototypeStyle === 'nothing' ? 'font-["Space_Mono"]' : ''
                        }`}>
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
              <div data-tutorial={s.distanceFt === 5 ? 'station-action-5' : undefined}>
                {isCompleted ? (
                  <div className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                    prototypeStyle === 'nothing'
                      ? 'font-["Space_Mono"] uppercase tracking-wider text-[11px] border border-[#4A9E5C] text-[#4A9E5C] bg-transparent rounded-full'
                      : 'bg-zinc-200/50 dark:bg-zinc-800/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${prototypeStyle === 'nothing' ? 'text-[#4A9E5C]' : 'text-emerald-500'}`} />
                    <span className="whitespace-nowrap">LEVELED</span>
                    {s.actionText !== '—' && s.action !== 'ok' && (
                      <span className="text-[11px] text-zinc-500 line-through font-normal ml-1 whitespace-nowrap">
                        ({s.actionText})
                      </span>
                    )}
                  </div>
                ) : isLocked ? (
                  <div className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                    prototypeStyle === 'nothing'
                      ? 'font-["Space_Mono"] uppercase tracking-wider text-[11px] border border-zinc-700 text-zinc-400 bg-transparent rounded-full'
                      : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                  }`}>
                    <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="whitespace-nowrap">LOCKED</span>
                  </div>
                ) : (
                  <>
                    {s.action === 'ok' && (
                      <div className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                        prototypeStyle === 'nothing'
                          ? 'font-["Space_Mono"] uppercase tracking-wider text-[11px] border border-[#4A9E5C] text-[#4A9E5C] bg-transparent rounded-full'
                          : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                      }`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${prototypeStyle === 'nothing' ? 'text-[#4A9E5C]' : 'text-emerald-500'}`} />
                        <span className="whitespace-nowrap">{s.actionText}</span>
                      </div>
                    )}
                    {s.action === 'lift' && (
                      <div className={`w-full py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 ${
                        prototypeStyle === 'nothing'
                          ? 'font-["Space_Mono"] uppercase tracking-wider text-[11px] border border-[#5B9BF6] text-[#5B9BF6] bg-transparent rounded-full'
                          : 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                      }`}>
                        <ArrowUpCircle className={`w-4 h-4 shrink-0 ${prototypeStyle === 'nothing' ? 'text-[#5B9BF6]' : 'text-sky-500'}`} />
                        <span className="whitespace-nowrap">{s.actionText}</span>
                      </div>
                    )}
                    {s.action === 'lower' && (
                      <div className={`w-full py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 ${
                        prototypeStyle === 'nothing'
                          ? 'font-["Space_Mono"] uppercase tracking-wider text-[11px] border border-[#D4A843] text-[#D4A843] bg-transparent rounded-full'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                      }`}>
                        <ArrowDownCircle className={`w-4 h-4 shrink-0 ${prototypeStyle === 'nothing' ? 'text-[#D4A843]' : 'text-amber-500'}`} />
                        <span className="whitespace-nowrap">{s.actionText}</span>
                      </div>
                    )}
                    {s.action === 'none' && (
                      <div className={`w-full py-1 px-3 rounded-xl text-xs text-center whitespace-nowrap ${
                        prototypeStyle === 'nothing'
                          ? 'font-["Space_Mono"] uppercase tracking-wider text-[10px] text-zinc-500 border border-zinc-800 rounded-full bg-transparent'
                          : 'text-zinc-600 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/50'
                      }`}>
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
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead className={`sticky top-0 z-10 shadow-xs ${
            prototypeStyle === 'nothing' ? 'bg-[#F0F0F0] dark:bg-black border-b border-zinc-300 dark:border-zinc-800' : 'bg-zinc-100 dark:bg-zinc-950'
          }`}>
            <tr className={`border-b text-[10px] uppercase tracking-wider font-bold ${
              prototypeStyle === 'nothing'
                ? 'border-zinc-300 dark:border-zinc-800 font-["Space_Mono"] tracking-[0.08em] text-zinc-600 dark:text-zinc-400 bg-[#F0F0F0] dark:bg-black'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950'
            }`}>
              <th className={`py-2 px-1 w-9 text-center sticky top-0 whitespace-nowrap ${prototypeStyle === 'nothing' ? 'bg-[#F0F0F0] dark:bg-black' : 'bg-zinc-100 dark:bg-zinc-950'}`}>
                {prototypeStyle === 'nothing' ? '[ STATUS ]' : 'Status'}
              </th>
              <th className={`py-2 px-2 sticky top-0 whitespace-nowrap ${prototypeStyle === 'nothing' ? 'bg-[#F0F0F0] dark:bg-black' : 'bg-zinc-100 dark:bg-zinc-950'}`}>
                {prototypeStyle === 'nothing' ? '[ STATION ]' : 'Station'}
              </th>
              <th className={`py-2 px-2 sticky top-0 whitespace-nowrap ${prototypeStyle === 'nothing' ? 'bg-[#F0F0F0] dark:bg-black' : 'bg-zinc-100 dark:bg-zinc-950'}`}>
                {prototypeStyle === 'nothing' ? '[ LAST READING ]' : 'Last Reading'}
              </th>
              {(displayMode === 'target_reading' || displayMode === 'both') && (
                <th
                  className={`py-2 px-2 cursor-pointer transition select-none sticky top-0 whitespace-nowrap ${
                    prototypeStyle === 'nothing'
                      ? 'bg-[#F0F0F0] dark:bg-black hover:text-black dark:hover:text-white font-["Space_Mono"] tracking-[0.08em]'
                      : 'bg-zinc-100 dark:bg-zinc-950 hover:text-amber-500'
                  }`}
                  onClick={handleCycleDisplayMode}
                  title="Click to toggle display mode (Target Rod vs Rel. Elev vs Both)"
                >
                  <div className="flex items-center gap-1">
                    <span>{prototypeStyle === 'nothing' ? '[ TARGET ROD ]' : 'Target Rod'}</span>
                  </div>
                </th>
              )}
              {(displayMode === 'relative_elev' || displayMode === 'both') && (
                <th
                  className={`py-2 px-2 cursor-pointer transition select-none sticky top-0 whitespace-nowrap ${
                    prototypeStyle === 'nothing'
                      ? 'bg-[#F0F0F0] dark:bg-black hover:text-black dark:hover:text-white font-["Space_Mono"] tracking-[0.08em]'
                      : 'bg-zinc-100 dark:bg-zinc-950 hover:text-amber-500'
                  }`}
                  onClick={handleCycleDisplayMode}
                  title="Click to toggle display mode (Target Rod vs Rel. Elev vs Both)"
                >
                  <div className="flex items-center gap-1">
                    <span>{prototypeStyle === 'nothing' ? '[ REL. ELEV ]' : 'Rel. Elev'}</span>
                  </div>
                </th>
              )}
              <th className={`py-2 px-2 text-center sticky top-0 whitespace-nowrap ${prototypeStyle === 'nothing' ? 'bg-[#F0F0F0] dark:bg-black' : 'bg-zinc-100 dark:bg-zinc-950'}`}>
                {prototypeStyle === 'nothing' ? '[ TRACK ACTION ]' : 'Track Action'}
              </th>
              <th className={`py-2 px-2 text-center sticky top-0 whitespace-nowrap ${prototypeStyle === 'nothing' ? 'bg-[#F0F0F0] dark:bg-black' : 'bg-zinc-100 dark:bg-zinc-950'}`}>
                {prototypeStyle === 'nothing' ? '[ ACTIONS ]' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y text-sm ${
            prototypeStyle === 'nothing' ? 'divide-zinc-200 dark:divide-zinc-800/60' : 'divide-zinc-100 dark:divide-zinc-800/60'
          }`}>
            {stations.map((s) => {
              const isSelected = selectedStationId === s.id;
              const isCompleted = !!s.completed;
              const isLocked = !!s.isLocked;

              return (
                <tr
                  key={s.id}
                  data-tutorial={s.distanceFt === 0 ? 'station-row-0' : s.distanceFt === 5 ? 'station-row-5' : s.distanceFt === 10 ? 'station-row-10' : undefined}
                  className={`transition-all cursor-pointer ${
                    prototypeStyle === 'nothing'
                      ? isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-900 border-l-2 border-l-[#D71921] font-medium'
                        : isCompleted
                        ? 'bg-transparent opacity-40 grayscale-[0.2] border-l-2 border-l-transparent'
                        : 'hover:bg-zinc-100/70 dark:hover:bg-zinc-900/40 border-l-2 border-l-transparent'
                      : isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 font-medium'
                      : isCompleted
                      ? 'bg-zinc-100/40 dark:bg-zinc-950/70 opacity-40 grayscale-[0.2]'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                  }`}
                  onClick={() => onEditStation(s)}
                >
                  {/* Completed Checkmark Toggle (Fitts' Law enlarged touch target) */}
                  <td
                    className="py-2 px-1 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(s.id);
                    }}
                  >
                    <button
                      type="button"
                      data-tutorial={s.distanceFt === 0 ? 'station-complete-0' : s.distanceFt === 5 ? 'station-complete-5' : undefined}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-90 transition mx-auto"
                      title={isCompleted ? 'Mark uncompleted' : 'Mark leveled'}
                      aria-label={isCompleted ? 'Mark uncompleted' : 'Mark leveled'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className={`w-4.5 h-4.5 ${prototypeStyle === 'nothing' ? 'text-[#4A9E5C]' : 'text-emerald-500'}`} />
                      ) : (
                        <Circle className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </td>

                  {/* Station Distance & Badges */}
                  <td className={`py-2 px-2 font-bold text-zinc-900 dark:text-zinc-200 whitespace-nowrap ${
                    prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-xs' : 'font-mono'
                  }`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={isCompleted ? 'line-through text-zinc-500' : ''}>
                        {s.distanceFt} ft
                      </span>
                      {isLocked && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                            prototypeStyle === 'nothing'
                              ? 'font-["Space_Mono"] uppercase tracking-wider text-[8px] border border-zinc-700 text-zinc-400 bg-transparent rounded-full'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                          title="Locked Tie / Control Point"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>LOCKED</span>
                        </span>
                      )}
                      {s.isTurningPoint && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                            prototypeStyle === 'nothing'
                              ? 'font-["Space_Mono"] uppercase tracking-wider text-[8px] border border-[#D71921] text-[#D71921] bg-transparent rounded-full'
                              : 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                          }`}
                          title="Laser Relocation Benchmark (Turning Point)"
                        >
                          <Flag className="w-2.5 h-2.5" />
                          <span>TP</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Laser Reading */}
                  <td
                    className={`py-2 px-2 whitespace-nowrap ${
                      prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-xs' : 'font-mono'
                    }`}
                    data-tutorial={s.distanceFt === 0 ? 'station-reading-0' : s.distanceFt === 5 ? 'station-reading-5' : s.distanceFt === 10 ? 'station-reading-10' : undefined}
                  >
                    {s.isTurningPoint ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                            {s.readingInches !== null ? formatMeasurement(s.readingInches, unitFormat, fractionResolution) : '—'}
                          </span>
                          <span className={`text-[9px] px-1 py-0.2 rounded whitespace-nowrap ${
                            prototypeStyle === 'nothing'
                              ? 'font-["Space_Mono"] uppercase text-[8px] border border-[#D71921] text-[#D71921] bg-transparent'
                              : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-sans font-semibold'
                          }`}>
                            Active backsight
                          </span>
                        </div>
                        {s.tpOldReadingInches !== undefined && (
                          <div className="text-[10px] text-zinc-500 font-sans">
                            Laser 1: {formatMeasurement(s.tpOldReadingInches, unitFormat, fractionResolution)}{' '}
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
                          <div className="text-[10px] font-sans text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <span>
                              Was: <strong>{formatMeasurement(s.readingInches - s.datumOffsetInches, unitFormat, fractionResolution)}</strong>
                            </span>
                            <span className="text-[9px] text-purple-500/80">
                              ({s.datumOffsetInches >= 0 ? '+' : ''}{formatMeasurement(s.datumOffsetInches, unitFormat, fractionResolution)} shift)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                          {formatMeasurement(s.readingInches, unitFormat, fractionResolution)}
                        </span>
                      )
                    ) : (
                      <span className={`text-xs ${
                        prototypeStyle === 'nothing'
                          ? 'font-["Space_Mono"] text-zinc-500 uppercase tracking-wider text-[10px]'
                          : 'text-zinc-600 dark:text-zinc-400 italic bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded'
                      }`}>
                        {prototypeStyle === 'nothing' ? '[ NEED READING ]' : 'Need Reading'}
                      </span>
                    )}
                  </td>

                  {/* Target Rod Column */}
                  {(displayMode === 'target_reading' || displayMode === 'both') && (
                    <td className={`py-2 px-2 font-bold text-xs whitespace-nowrap ${
                      prototypeStyle === 'nothing' ? 'font-["Space_Mono"]' : 'font-mono'
                    }`}>
                      {s.targetReadingInches !== null && s.targetReadingInches !== undefined ? (
                        <div className={`flex items-center gap-1 ${
                          prototypeStyle === 'nothing' ? 'text-[#5B9BF6]' : 'text-sky-700 dark:text-sky-400'
                        }`}>
                          <span>{formatMeasurement(s.targetReadingInches, unitFormat, fractionResolution)}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                          {s.readingInches === null ? '—' : 'Need end shot'}
                        </span>
                      )}
                    </td>
                  )}

                  {/* Relative Elevation Column */}
                  {(displayMode === 'relative_elev' || displayMode === 'both') && (
                    <td className={`py-2 px-2 text-zinc-700 dark:text-zinc-300 text-xs whitespace-nowrap ${
                      prototypeStyle === 'nothing' ? 'font-["Space_Mono"]' : 'font-mono'
                    }`}>
                      {s.elevationInches !== null
                        ? formatMeasurement(s.elevationInches, unitFormat, fractionResolution)
                        : '—'}
                    </td>
                  )}

                  {/* Track Action Badge */}
                  <td
                    className="py-2 px-2 text-center whitespace-nowrap"
                    data-tutorial={s.distanceFt === 5 ? 'station-action-5' : undefined}
                  >
                    {isCompleted ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                        prototypeStyle === 'nothing'
                          ? 'font-["Space_Mono"] uppercase tracking-wider text-[10px] border border-[#4A9E5C] text-[#4A9E5C] bg-transparent'
                          : 'bg-zinc-200/50 dark:bg-zinc-800/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      }`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${prototypeStyle === 'nothing' ? 'text-[#4A9E5C]' : 'text-emerald-500'}`} />
                        <span>LEVELED</span>
                        {s.actionText !== '—' && s.action !== 'ok' && (
                          <span className="text-[10px] text-zinc-500 line-through font-normal ml-0.5 whitespace-nowrap">
                            ({s.actionText})
                          </span>
                        )}
                      </span>
                    ) : isLocked ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                        prototypeStyle === 'nothing'
                          ? 'font-["Space_Mono"] uppercase tracking-wider text-[10px] border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-transparent'
                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                      }`}>
                        <Lock className={`w-3.5 h-3.5 ${prototypeStyle === 'nothing' ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400'} shrink-0`} />
                        <span>LOCKED</span>
                      </span>
                    ) : (
                      <>
                        {s.action === 'ok' && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                            prototypeStyle === 'nothing'
                              ? 'font-["Space_Mono"] uppercase tracking-wider text-[10px] border border-[#4A9E5C] text-[#4A9E5C] bg-transparent'
                              : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                          }`}>
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${prototypeStyle === 'nothing' ? 'text-[#4A9E5C]' : 'text-emerald-500'}`} />
                            <span>{s.actionText}</span>
                          </span>
                        )}
                        {s.action === 'lift' && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                            prototypeStyle === 'nothing'
                              ? 'font-["Space_Mono"] uppercase tracking-wider text-[10px] border border-[#5B9BF6] text-[#5B9BF6] bg-transparent'
                              : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                          }`}>
                            <ArrowUpCircle className={`w-3.5 h-3.5 shrink-0 ${prototypeStyle === 'nothing' ? 'text-[#5B9BF6]' : 'text-sky-500 dark:text-sky-400'}`} />
                            <span>{s.actionText}</span>
                          </span>
                        )}
                        {s.action === 'lower' && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                            prototypeStyle === 'nothing'
                              ? 'font-["Space_Mono"] uppercase tracking-wider text-[10px] border border-[#D4A843] text-[#D4A843] bg-transparent'
                              : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                          }`}>
                            <ArrowDownCircle className={`w-3.5 h-3.5 shrink-0 ${prototypeStyle === 'nothing' ? 'text-[#D4A843]' : 'text-amber-500 dark:text-amber-400'}`} />
                            <span>{s.actionText}</span>
                          </span>
                        )}
                        {s.action === 'none' && (
                          <span className={`text-xs ${
                            prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'
                          }`}>—</span>
                        )}
                      </>
                    )}
                  </td>

                  {/* Row Actions */}
                  <td
                    className="py-2 px-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {onToggleLock && (
                        <button
                          data-tutorial={`station-lock-${s.distanceFt}`}
                          onClick={() => onToggleLock(s.id)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg border transition shrink-0 ${
                            prototypeStyle === 'nothing'
                              ? isLocked
                                ? 'text-zinc-900 dark:text-white border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 rounded-full'
                                : 'text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800 hover:text-black dark:hover:text-white hover:border-zinc-500 dark:hover:border-zinc-700 bg-transparent rounded-full'
                              : isLocked
                              ? 'text-amber-500 bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40'
                              : 'text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                          title={isLocked ? 'Unlock tie (allow normal lift/lower)' : 'Lock tie (fixed point / tree root)'}
                        >
                          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {onSetTurningPoint && (
                        <button
                          onClick={() => {
                            setTurningPointStation(s);
                            setTpNewReadingStr(s.readingInches !== null ? formatMeasurement(s.readingInches, unitFormat, fractionResolution) : '');
                            setTpError(null);
                          }}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg border transition shrink-0 ${
                            prototypeStyle === 'nothing'
                              ? s.isTurningPoint
                                ? 'text-[#D71921] border-[#D71921] bg-transparent rounded-full'
                                : 'text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800 hover:text-black dark:hover:text-white hover:border-zinc-500 dark:hover:border-zinc-700 bg-transparent rounded-full'
                              : s.isTurningPoint
                              ? 'text-purple-500 bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/40'
                              : 'text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-purple-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                          title="Relocate Laser: Set Turning Point on this tie"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditStation(s)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg border transition shrink-0 ${
                          prototypeStyle === 'nothing'
                            ? 'border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-zinc-500 dark:hover:border-zinc-700 bg-transparent rounded-full'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                        title="Edit measurement"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteStation(s.id)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg border transition shrink-0 ${
                          prototypeStyle === 'nothing'
                            ? 'border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-[#D71921] hover:border-[#D71921]/50 bg-transparent rounded-full'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                        title="Delete station"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto pt-3 sm:pt-4 overscroll-contain"
          onClick={handleCloseExtendModal}
        >
          <div
            className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 max-w-sm w-full space-y-3 sm:space-y-4 shadow-2xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto modal-scroll-container overscroll-contain touch-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Extend Track Profile</span>
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-zinc-500 font-medium">Length to add (feet):</label>
                  <span className="text-xs font-mono font-bold text-amber-500">+{extendLength} ft</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[25, 50, 100].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setExtendLength(amt)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        extendLength === amt
                          ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      +{amt}'
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="custom-extend-ft" className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                    Custom:
                  </label>
                  <div className="relative flex-1">
                    <input
                      id="custom-extend-ft"
                      type="number"
                      min="1"
                      max="5000"
                      step="1"
                      value={extendLength || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          setExtendLength(val);
                        } else if (e.target.value === '') {
                          setExtendLength(0);
                        }
                      }}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 pr-8"
                      placeholder="e.g. 75"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-medium pointer-events-none">ft</span>
                  </div>
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
                onClick={handleCloseExtendModal}
                className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                disabled={!extendLength || extendLength <= 0}
                onClick={() => {
                  if (!extendLength || extendLength <= 0) return;
                  onExtendTrack?.(extendLength, extendInterval, extendDirection);
                  handleCloseExtendModal();
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl shadow-sm transition"
              >
                Add {extendLength} Feet {extendDirection === 'forward' ? 'Ahead' : 'Before 0'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Relocate Laser / Turning Point Modal */}
      {turningPointStation && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto pt-3 sm:pt-4 overscroll-contain"
          onClick={handleCloseTurningPoint}
        >
          <div
            className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 max-w-sm w-full space-y-3 sm:space-y-4 shadow-2xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto modal-scroll-container overscroll-contain touch-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-[#D71921] shrink-0" />
                  <span>Relocate Laser (Datum Shift)</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-tight sm:leading-relaxed mt-0.5 sm:mt-1">
                  When moving the rotary laser forward, take one reading on this benchmark tie with your{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100">new laser setup</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseTurningPoint}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 font-bold block mb-1">
                  Shared Benchmark Tie (Station):
                </label>
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
                  className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none font-mono focus:border-purple-500 transition"
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
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 font-sans">Old Reading on Benchmark:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700">
                    {turningPointStation.readingInches !== null
                      ? formatMeasurement(turningPointStation.readingInches, unitFormat, fractionResolution)
                      : 'None recorded'}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-bold block font-sans">
                    New Reading from Relocated Laser:
                  </label>
                  <input
                    data-tutorial="tp-new-reading-input"
                    type="text"
                    inputMode="decimal"
                    value={tpNewReadingStr}
                    onChange={(e) => setTpNewReadingStr(e.target.value)}
                    placeholder="e.g. 7.50, 7 1/2, or 1' 4 3/8"
                    className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition shadow-inner"
                  />
                  {tpError && <p className="text-red-500 text-[11px] font-sans font-medium">{tpError}</p>}
                </div>
              </div>

              {(() => {
                const parsed = parseMeasurement(tpNewReadingStr);
                if (parsed !== null && !isNaN(parsed) && parsed > 0 && turningPointStation.readingInches !== null) {
                  const shift = parsed - turningPointStation.readingInches;
                  const st0 = stations.find(s => s.distanceFt === 0);
                  const st0NewReading = st0 && st0.readingInches !== null ? st0.readingInches + shift : null;

                  return (
                    <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-800 dark:text-purple-300 text-xs space-y-1.5 font-sans animate-in fade-in duration-150">
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>Laser Relocation Shift:</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-900 dark:text-purple-100">
                          {shift >= 0 ? '+' : ''}{formatMeasurement(shift, unitFormat, fractionResolution)}
                        </span>
                      </div>
                      <p className="text-[11px] leading-tight text-purple-700 dark:text-purple-400">
                        {shift !== 0
                          ? `Previously measured stations (0 ft to ${turningPointStation.distanceFt} ft) will convert to your active laser's scale (${shift >= 0 ? '+' : ''}${formatMeasurement(shift, unitFormat, fractionResolution)}). ${st0NewReading !== null ? `Station 0 equivalent: ${formatMeasurement(st0NewReading, unitFormat, fractionResolution)}.` : ''}`
                          : `Both setups are at the same elevation (0" shift).`}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        All physical elevations, target grades, and track adjustments remain identical.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="p-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 text-zinc-400 text-xs font-sans">
                    <p className="text-[11px] leading-tight">
                      💡 Enter your rod reading above to calculate the elevation datum shift.
                    </p>
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={handleCloseTurningPoint}
                className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                data-tutorial="tp-apply-btn"
                disabled={turningPointStation.readingInches === null}
                onClick={handleApplyTurningPoint}
                className={`px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-xs transition active:scale-95 ${
                  prototypeStyle === 'nothing'
                    ? 'rounded-lg bg-[#D71921] hover:bg-[#b01319] text-white font-["Space_Mono"] uppercase tracking-wider'
                    : 'rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                }`}
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
