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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Table Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
            Trackside Leveling Checklist
          </h3>
          <p className="text-xs text-slate-500">
            Tap any row to record or adjust laser measurements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onInsertCustomStation}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            + Custom Pt
          </button>
          <button
            onClick={onAddNextStation}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Next</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-100/60 dark:bg-slate-950/80 font-bold">
              <th className="py-2.5 px-3 w-10 text-center">Status</th>
              <th className="py-2.5 px-3">Station</th>
              <th className="py-2.5 px-3">Laser Reading</th>
              <th className="py-2.5 px-3">Relative Elev.</th>
              <th className="py-2.5 px-3 text-center">Track Action</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
            {stations.map((s) => {
              const isSelected = selectedStationId === s.id;
              const isCompleted = !!s.completed;

              return (
                <tr
                  key={s.id}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 font-medium'
                      : isCompleted
                      ? 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
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
                      className="text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition"
                      title={isCompleted ? 'Mark uncompleted' : 'Mark leveled'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </td>

                  {/* Station Distance */}
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {s.distanceFt} ft
                  </td>

                  {/* Laser Reading */}
                  <td className="py-3 px-3 font-mono">
                    {s.readingInches !== null ? (
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {formatFeetInches(s.readingInches, fractionResolution)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Need Reading
                      </span>
                    )}
                  </td>

                  {/* Relative Elevation */}
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 text-xs">
                    {s.elevationInches !== null
                      ? formatMeasurement(s.elevationInches, unitFormat, fractionResolution)
                      : '—'}
                  </td>

                  {/* Track Action Badge */}
                  <td className="py-3 px-3 text-center">
                    {s.action === 'ok' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ON GRADE
                      </span>
                    )}
                    {s.action === 'lift' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        <ArrowUpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {s.actionText}
                      </span>
                    )}
                    {s.action === 'lower' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <ArrowDownCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        {s.actionText}
                      </span>
                    )}
                    {s.action === 'none' && (
                      <span className="text-slate-400 text-xs">—</span>
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
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition"
                        title="Edit measurement"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteStation(s.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition"
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
        <div className="p-8 text-center text-slate-400 text-sm">
          No stations added yet. Tap "+ Add Next" to start recording your track profile.
        </div>
      )}
    </div>
  );
};
