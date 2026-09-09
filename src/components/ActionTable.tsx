import React from 'react';
import { CalculatedStation, UnitFormat } from '../core/types';
import { formatFeetInches, formatMeasurement } from '../core/units';
import { CheckCircle2, Circle, Edit3, Trash2, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface ActionTableProps {
  stations: CalculatedStation[];
  unitFormat: UnitFormat;
  fractionResolution: 16 | 8 | 32;
  onEditStation: (station: CalculatedStation) => void;
  onToggleComplete: (stationId: string) => void;
  onDeleteStation: (stationId: string) => void;
  onAddNextStation: () => void;
  onInsertCustomStation: () => void;
  selectedStationId?: string | null;
}

export const ActionTable: React.FC<ActionTableProps> = ({
  stations,
  unitFormat,
  fractionResolution,
  onEditStation,
  onToggleComplete,
  onDeleteStation,
  onAddNextStation,
  onInsertCustomStation,
  selectedStationId,
}) => {
  return (
    <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors">
      {/* Table Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
            Trackside Leveling Checklist
          </h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Tap row to record reading or adjust shims
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onInsertCustomStation}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            + Custom Pt
          </button>
          <button
            onClick={onAddNextStation}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition flex items-center gap-1 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Next</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-100/70 dark:bg-zinc-950 font-bold">
              <th className="py-2.5 px-3 w-10 text-center">Status</th>
              <th className="py-2.5 px-3">Station</th>
              <th className="py-2.5 px-3">Laser Reading</th>
              <th className="py-2.5 px-3">Relative Elev.</th>
              <th className="py-2.5 px-3 text-center">Track Action</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-sm">
            {stations.map((s) => {
              const isSelected = selectedStationId === s.id;
              const isCompleted = !!s.completed;

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

                  {/* Station Distance */}
                  <td className="py-3 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-200">
                    {s.distanceFt} ft
                  </td>

                  {/* Laser Reading */}
                  <td className="py-3 px-3 font-mono">
                    {s.readingInches !== null ? (
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                        {formatFeetInches(s.readingInches, fractionResolution)}
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs italic bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded">
                        Need Reading
                      </span>
                    )}
                  </td>

                  {/* Relative Elevation */}
                  <td className="py-3 px-3 font-mono text-zinc-500 dark:text-zinc-400 text-xs">
                    {s.elevationInches !== null
                      ? formatMeasurement(s.elevationInches, unitFormat, fractionResolution)
                      : '—'}
                  </td>

                  {/* Track Action Badge */}
                  <td className="py-3 px-3 text-center">
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
                  </td>

                  {/* Row Actions */}
                  <td
                    className="py-3 px-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEditStation(s)}
                        className="p-1.5 text-zinc-400 hover:text-amber-500 rounded transition"
                        title="Edit measurement"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteStation(s.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition"
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
    </div>
  );
};
