import React, { useState, useMemo } from 'react';
import { CalculatedStation, GradeMode } from '../core/types';
import { formatFeetInches, formatMeasurement } from '../core/units';
import { Maximize2, Minimize2 } from 'lucide-react';

interface ProfileChartProps {
  stations: CalculatedStation[];
  gradeMode: GradeMode;
  targetGradePercent: number;
  onSelectStation: (station: CalculatedStation) => void;
  selectedStationId?: string | null;
}

type ViewScale = 'gentle' | 'medium' | 'magnified';

export const ProfileChart: React.FC<ProfileChartProps> = ({
  stations,
  onSelectStation,
  selectedStationId,
}) => {
  // Gentle is default as requested ("softer, less all over the place")
  const [viewScale, setViewScale] = useState<ViewScale>('gentle');
  const [isScrollable, setIsScrollable] = useState<boolean>(false);
  const [activeStation, setActiveStation] = useState<CalculatedStation | null>(null);

  // Filter measured stations
  const measuredStations = useMemo(() => {
    return stations.filter(s => s.elevationInches !== null && s.targetElevationInches !== null);
  }, [stations]);

  // Dimensions
  const baseWidth = 850;
  const chartHeight = 240;
  const padding = { top: 30, right: 35, bottom: 40, left: 60 };

  // If scrollable is toggled on mobile, expand width
  const effectiveWidth = isScrollable ? Math.max(baseWidth, stations.length * 55) : baseWidth;
  const innerWidth = effectiveWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Horizontal Extents (ft)
  const minX = stations.length > 0 && typeof stations[0]?.distanceFt === 'number' && !isNaN(stations[0].distanceFt)
    ? stations[0].distanceFt
    : 0;
  const lastDist = stations.length > 0 && typeof stations[stations.length - 1]?.distanceFt === 'number' && !isNaN(stations[stations.length - 1].distanceFt)
    ? stations[stations.length - 1].distanceFt
    : minX + 10;
  const maxX = Math.max(lastDist, minX + 5);

  // Vertical Extents (inches) - Calm & Softer by default
  const { minY, maxY, yTicks } = useMemo(() => {
    const vals: number[] = [0];
    measuredStations.forEach(s => {
      if (s.elevationInches !== null) vals.push(s.elevationInches);
      if (s.targetElevationInches !== null) vals.push(s.targetElevationInches);
    });

    const validVals = vals.filter(v => typeof v === 'number' && !isNaN(v));
    const rawMin = validVals.length > 0 ? Math.min(...validVals) : 0;
    const rawMax = validVals.length > 0 ? Math.max(...validVals) : 0;
    const actualSpan = Math.max(rawMax - rawMin, 0);

    // Minimum vertical window so small dips don't turn into huge mountains:
    // Gentle: at least 8 inches total span (calm, natural rail view)
    // Medium: at least 4 inches total span
    // Magnified: at least 1.5 inches total span (exaggerated for finding tiny bumps)
    let minWindow = 8.0;
    if (viewScale === 'gentle') minWindow = 8.0;
    else if (viewScale === 'medium') minWindow = 4.0;
    else if (viewScale === 'magnified') minWindow = 1.5;

    const span = Math.max(actualSpan * 1.3, minWindow);
    const center = (rawMax + rawMin) / 2;

    const calcMinY = center - span / 2;
    const calcMaxY = center + span / 2;

    // Ticks with safety guard
    const step = span > 10 ? 2.0 : span > 4 ? 1.0 : 0.5;
    const ticks: { val: number; label: string }[] = [];
    const firstTick = Math.ceil(calcMinY / step) * step;

    for (let v = firstTick; v <= calcMaxY + 0.001; v += step) {
      if (ticks.length >= 30) break; // Safety guard against infinite loops
      ticks.push({
        val: v,
        label: formatMeasurement(v, 'inches_fraction', 16),
      });
    }

    return {
      minY: calcMinY,
      maxY: calcMaxY,
      yTicks: ticks,
    };
  }, [measuredStations, viewScale]);

  // Coordinate transforms
  const getX = (distFt: number) => {
    if (maxX === minX) return padding.left + innerWidth / 2;
    return padding.left + ((distFt - minX) / (maxX - minX)) * innerWidth;
  };

  const getY = (elevInches: number) => {
    if (maxY === minY) return padding.top + innerHeight / 2;
    return padding.top + innerHeight - ((elevInches - minY) / (maxY - minY)) * innerHeight;
  };

  // Generate SVG path for actual rail profile
  // Using direct clean chords with gentle fillets prevents unnatural overshoot waves
  const actualPath = useMemo(() => {
    if (measuredStations.length < 2) return '';
    return measuredStations.reduce((acc, s, idx) => {
      const x = getX(s.distanceFt);
      const y = getY(s.elevationInches!);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [measuredStations, minY, maxY, minX, maxX, innerWidth]);

  // Generate SVG path for target grade
  const targetPath = useMemo(() => {
    if (measuredStations.length < 2) return '';
    return measuredStations.reduce((acc, s, idx) => {
      const x = getX(s.distanceFt);
      const y = getY(s.targetElevationInches!);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [measuredStations, minY, maxY, minX, maxX, innerWidth]);

  // Active station to inspect (selected or hovered)
  const currentInspectStation = activeStation || stations.find(s => s.id === selectedStationId) || null;

  return (
    <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors">
      {/* Header Toolbar */}
      <div className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
            Track Vertical Profile
          </h3>
          <span className="text-[11px] bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 font-mono px-2 py-0.5 rounded-full">
            {measuredStations.length}/{stations.length} Shot
          </span>
        </div>

        {/* View Scale Controls */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold px-1.5 hidden sm:inline">
              Vertical:
            </span>
            <button
              onClick={() => setViewScale('gentle')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                viewScale === 'gentle'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-amber-400 font-bold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Calm natural track profile (soft, non-jarring)"
            >
              Gentle
            </button>
            <button
              onClick={() => setViewScale('medium')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                viewScale === 'medium'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-amber-400 font-bold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Standard view"
            >
              Medium
            </button>
            <button
              onClick={() => setViewScale('magnified')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                viewScale === 'magnified'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-amber-400 font-bold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Magnified vertical scale to see micro dips"
            >
              Magnified
            </button>
          </div>

          {/* Scrollable / Fit Toggle */}
          <button
            onClick={() => setIsScrollable(!isScrollable)}
            className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition"
            title={isScrollable ? 'Fit track to screen' : 'Expand track for horizontal scrolling'}
          >
            {isScrollable ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Selected Station Banner / Active Readout */}
      {currentInspectStation && (
        <div className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between text-xs font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-500 dark:text-amber-400">
              Station {currentInspectStation.distanceFt} ft
            </span>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-600 dark:text-zinc-300">
              Reading:{' '}
              {currentInspectStation.readingInches !== null
                ? formatFeetInches(currentInspectStation.readingInches)
                : 'Need shot'}
            </span>
            <span className="text-zinc-400 hidden sm:inline">|</span>
            <span className="text-zinc-500 hidden sm:inline">
              Elev: {formatMeasurement(currentInspectStation.elevationInches, 'inches_fraction')}
            </span>
          </div>

          <div className="flex items-center gap-2 font-sans font-bold">
            {currentInspectStation.action === 'ok' && (
              <span className="text-emerald-500 text-xs">✓ ON GRADE</span>
            )}
            {currentInspectStation.action === 'lift' && (
              <span className="text-sky-500 dark:text-sky-400 text-xs">▲ {currentInspectStation.actionText}</span>
            )}
            {currentInspectStation.action === 'lower' && (
              <span className="text-amber-500 dark:text-amber-400 text-xs">▼ {currentInspectStation.actionText}</span>
            )}
            <button
              onClick={() => onSelectStation(currentInspectStation)}
              className="text-[11px] underline text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 ml-2"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Unified SVG Canvas Container */}
      <div className={`w-full ${isScrollable ? 'overflow-x-auto scrollbar-thin' : ''} bg-zinc-50/50 dark:bg-black select-none`}>
        <svg
          viewBox={`0 0 ${effectiveWidth} ${chartHeight}`}
          className={`block ${isScrollable ? '' : 'w-full'} h-auto`}
          style={isScrollable ? { minWidth: `${effectiveWidth}px` } : undefined}
        >
          {/* Background Grid Lines (Y-Ticks) */}
          {yTicks.map(t => {
            const y = getY(t.val);
            const isZero = Math.abs(t.val) < 0.001;
            return (
              <g key={t.val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={effectiveWidth - padding.right}
                  y2={y}
                  className={
                    isZero
                      ? 'stroke-zinc-400 dark:stroke-zinc-600 stroke-[1.5]'
                      : 'stroke-zinc-200 dark:stroke-zinc-800/80 stroke-1 stroke-dasharray-2'
                  }
                  strokeDasharray={isZero ? undefined : '3,3'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="font-mono text-[10px] fill-zinc-500 font-semibold"
                >
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* Vertical Station Grid lines (X-Ticks) */}
          {stations.map(s => {
            const x = getX(s.distanceFt);
            return (
              <g key={s.id}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + innerHeight}
                  className="stroke-zinc-200 dark:stroke-zinc-800/60 stroke-1"
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={padding.top + innerHeight + 18}
                  textAnchor="middle"
                  className="font-mono text-[10px] fill-zinc-600 dark:fill-zinc-400 font-bold"
                >
                  {s.distanceFt}'
                </text>
              </g>
            );
          })}

          {/* Target Grade Line (Green dashed reference plane) */}
          {targetPath && (
            <path
              d={targetPath}
              fill="none"
              className="stroke-emerald-500 dark:stroke-emerald-400 stroke-2"
              strokeDasharray="6,4"
            />
          )}

          {/* Actual Rail Line (Crisp clean white in dark mode, dark charcoal in light mode) */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              className="stroke-zinc-900 dark:stroke-white stroke-[3]"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Station Markers / Interactive Points */}
          {stations.map(s => {
            const x = getX(s.distanceFt);
            const isMeasured = s.elevationInches !== null;
            const y = isMeasured ? getY(s.elevationInches!) : padding.top + innerHeight / 2;
            const isSelected = selectedStationId === s.id;

            let dotFill = '#52525b'; // zinc-600
            if (isMeasured) {
              if (s.action === 'ok') dotFill = '#10b981'; // green
              else if (s.action === 'lift') dotFill = '#38bdf8'; // sky blue
              else if (s.action === 'lower') dotFill = '#f59e0b'; // amber
            }

            return (
              <g
                key={s.id}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => {
                  setActiveStation(s);
                  onSelectStation(s);
                }}
                onMouseEnter={() => setActiveStation(s)}
                onMouseLeave={() => setActiveStation(null)}
              >
                {/* Generous touch target */}
                <circle cx={x} cy={y} r={16} fill="transparent" />

                {/* Selection indicator ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={9}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    className="animate-pulse"
                  />
                )}

                {/* Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isMeasured ? (isSelected ? 6 : 5) : 3.5}
                  fill={dotFill}
                  stroke={isSelected ? '#f59e0b' : '#000000'}
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={effectiveWidth / 2}
            y={chartHeight - 6}
            textAnchor="middle"
            className="text-[9px] font-bold uppercase tracking-wider fill-zinc-500"
          >
            Track Distance (Feet)
          </text>
        </svg>
      </div>

      {/* Legend Footer */}
      <div className="px-3.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between text-[11px] text-zinc-500 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-zinc-900 dark:bg-white rounded"></span>
            <span>Rail Head</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 border-t border-dashed border-emerald-500"></span>
            <span>Target Plane</span>
          </div>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <span className="flex items-center gap-1 text-sky-500">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span> Lift (Low)
          </span>
          <span className="flex items-center gap-1 text-amber-500">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Lower (High)
          </span>
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> On Grade
          </span>
        </div>
      </div>
    </div>
  );
};
