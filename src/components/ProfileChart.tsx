import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CalculatedStation, GradeMode } from '../core/types';
import { formatFeetInches, formatMeasurement } from '../core/units';
import { Layers, MoveHorizontal } from 'lucide-react';

interface ProfileChartProps {
  stations: CalculatedStation[];
  gradeMode: GradeMode;
  targetGradePercent: number;
  onSelectStation: (station: CalculatedStation) => void;
  selectedStationId?: string | null;
}

type ExaggerationMode = 1 | 2 | 5 | 10;

export const ProfileChart: React.FC<ProfileChartProps> = ({
  stations,
  onSelectStation,
  selectedStationId,
}) => {
  // Softer default vertical scale (2x) as requested
  const [exaggeration, setExaggeration] = useState<ExaggerationMode>(2);
  const [smoothCurve, setSmoothCurve] = useState<boolean>(true);
  const [hoveredStation, setHoveredStation] = useState<CalculatedStation | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter valid measured stations
  const measuredStations = useMemo(() => {
    return stations.filter(s => s.elevationInches !== null && s.targetElevationInches !== null);
  }, [stations]);

  // Chart dimensions & scaling
  // Height is compact on mobile (260px) to preserve screen real-estate
  const chartHeight = 280;
  const padding = { top: 35, right: 40, bottom: 50, left: 20 };
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Dynamic width based on station count so points never compress on phone screens
  const stationSpacing = 65; // pixels per station
  const chartWidth = Math.max(750, stations.length * stationSpacing);
  const innerWidth = chartWidth - padding.left - padding.right;

  // Horizontal Extents (ft)
  const minX = stations.length > 0 ? stations[0].distanceFt : 0;
  const maxX = stations.length > 0 ? Math.max(stations[stations.length - 1].distanceFt, minX + 5) : 50;

  // Auto-scroll when selectedStationId changes
  useEffect(() => {
    if (selectedStationId && scrollContainerRef.current) {
      const selectedIndex = stations.findIndex(s => s.id === selectedStationId);
      if (selectedIndex >= 0) {
        const xPos = padding.left + (selectedIndex / Math.max(stations.length - 1, 1)) * innerWidth;
        scrollContainerRef.current.scrollTo({
          left: Math.max(0, xPos - 200),
          behavior: 'smooth',
        });
      }
    }
  }, [selectedStationId, stations, innerWidth, padding.left]);

  // Vertical Extents (inches) with SOFTER scaling
  const { minY, maxY, yTicks } = useMemo(() => {
    const vals: number[] = [0];
    measuredStations.forEach(s => {
      if (s.elevationInches !== null) vals.push(s.elevationInches);
      if (s.targetElevationInches !== null) vals.push(s.targetElevationInches);
    });

    const rawMin = Math.min(...vals);
    const rawMax = Math.max(...vals);
    const rawSpan = rawMax - rawMin;

    // Softer span minimums to prevent slight 1/8" bumps from looking like vertical cliffs:
    // 1x: True 1:1 physical ratio span (very flat)
    // 2x: Soft / Gentle natural span (at least 8" window) -> DEFAULT
    // 5x: Balanced span (at least 4" window)
    // 10x: Detailed span (at least 2" window)
    let minWindowInches = 8.0;
    if (exaggeration === 1) minWindowInches = Math.max(16.0, (maxX - minX) * 0.4);
    else if (exaggeration === 2) minWindowInches = 8.0;
    else if (exaggeration === 5) minWindowInches = 4.0;
    else if (exaggeration === 10) minWindowInches = 2.0;

    const effectiveSpan = Math.max(rawSpan * 1.4, minWindowInches);
    const center = (rawMax + rawMin) / 2;

    const calcMinY = center - effectiveSpan / 2;
    const calcMaxY = center + effectiveSpan / 2;

    // Generate clean ticks at 0.5", 1", or 2" intervals
    const step = effectiveSpan > 12 ? 2.0 : effectiveSpan > 5 ? 1.0 : 0.5;
    const ticks: { val: number; yFraction: number; label: string }[] = [];
    const firstTick = Math.ceil(calcMinY / step) * step;

    for (let v = firstTick; v <= calcMaxY; v += step) {
      const yFraction = (v - calcMinY) / (calcMaxY - calcMinY);
      ticks.push({
        val: v,
        yFraction,
        label: formatMeasurement(v, 'inches_fraction', 16),
      });
    }

    return {
      minY: calcMinY,
      maxY: calcMaxY,
      yTicks: ticks,
    };
  }, [measuredStations, exaggeration, minX, maxX]);

  // Coordinate transforms
  const getX = (distFt: number) => {
    if (maxX === minX) return padding.left + innerWidth / 2;
    return padding.left + ((distFt - minX) / (maxX - minX)) * innerWidth;
  };

  const getY = (elevInches: number) => {
    if (maxY === minY) return padding.top + innerHeight / 2;
    return padding.top + innerHeight - ((elevInches - minY) / (maxY - minY)) * innerHeight;
  };

  // Generate SVG path for actual profile
  const actualPath = useMemo(() => {
    if (measuredStations.length < 2) return '';

    if (!smoothCurve || measuredStations.length < 3) {
      return measuredStations.reduce((acc, s, idx) => {
        const x = getX(s.distanceFt);
        const y = getY(s.elevationInches!);
        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, '');
    }

    // Gentle Catmull-Rom with low tension for smooth, relaxed rail track profile
    const points = measuredStations.map(s => ({
      x: getX(s.distanceFt),
      y: getY(s.elevationInches!),
    }));

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[0];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      // Tension factor 0.12 for gentle, non-jarring transitions
      const cp1x = p1.x + (p2.x - p0.x) * 0.12;
      const cp1y = p1.y + (p2.y - p0.y) * 0.12;
      const cp2x = p2.x - (p3.x - p1.x) * 0.12;
      const cp2y = p2.y - (p3.y - p1.y) * 0.12;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [measuredStations, smoothCurve, minY, maxY, minX, maxX]);

  // Generate SVG path for target grade
  const targetPath = useMemo(() => {
    if (measuredStations.length < 2) return '';
    return measuredStations.reduce((acc, s, idx) => {
      const x = getX(s.distanceFt);
      const y = getY(s.targetElevationInches!);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [measuredStations, minY, maxY, minX, maxX]);

  return (
    <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md overflow-hidden flex flex-col transition-colors">
      {/* Chart Toolbar */}
      <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
            Track Vertical Profile
          </h3>
          <span className="text-[11px] bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 font-mono px-2 py-0.5 rounded-full">
            {measuredStations.length}/{stations.length} Shot
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Smooth Curve Toggle */}
          <button
            onClick={() => setSmoothCurve(!smoothCurve)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              smoothCurve
                ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                : 'bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
            title="Toggle between gentle smooth curve and straight chords"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gentle</span>
          </button>

          {/* Vertical Softness / Exaggeration Selector */}
          <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold px-1.5 hidden sm:inline">
              Vertical:
            </span>
            {[
              { label: 'Soft (2x)', val: 2 },
              { label: '5x', val: 5 },
              { label: '10x', val: 10 },
              { label: '1:1', val: 1 },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setExaggeration(opt.val as ExaggerationMode)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] transition ${
                  exaggeration === opt.val
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-amber-400 font-bold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Swipe / Pan Prompt for Phone Screens */}
      <div className="sm:hidden px-3 py-1 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-center gap-1 text-[11px] text-zinc-500 font-medium">
        <MoveHorizontal className="w-3.5 h-3.5 text-amber-500" />
        <span>Swipe horizontally to view all track stations</span>
      </div>

      {/* Main Visualizer Area (Fixed Sticky Y-Axis + Scrollable SVG) */}
      <div className="relative flex w-full bg-zinc-50/50 dark:bg-black overflow-hidden">
        {/* Fixed Left Elevation Scale (Sticky Y-Axis) */}
        <div
          className="relative z-10 w-14 shrink-0 bg-white/95 dark:bg-black/95 border-r border-zinc-200 dark:border-zinc-800/80 select-none flex flex-col justify-between py-2 text-right pr-2"
          style={{ height: `${chartHeight}px` }}
        >
          <div className="absolute top-2 left-2 text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
            Elev
          </div>
          {yTicks.map(t => {
            const topPx = padding.top + innerHeight - (t.yFraction * innerHeight);
            return (
              <div
                key={t.val}
                className="absolute right-2 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold"
                style={{ top: `${topPx - 7}px` }}
              >
                {t.label}
              </div>
            );
          })}
        </div>

        {/* Scrollable Track SVG Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden select-none scrollbar-thin scroll-smooth"
          style={{ height: `${chartHeight}px` }}
        >
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            width={chartWidth}
            height={chartHeight}
            className="block"
          >
            {/* Background Grid */}
            <rect
              x={0}
              y={0}
              width={chartWidth}
              height={chartHeight}
              className="fill-transparent"
            />

            {/* Horizontal Grid lines (Y Ticks) */}
            {yTicks.map(t => {
              const y = padding.top + innerHeight - (t.yFraction * innerHeight);
              const isZero = Math.abs(t.val) < 0.001;
              return (
                <line
                  key={t.val}
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  className={
                    isZero
                      ? 'stroke-zinc-400 dark:stroke-zinc-600 stroke-[1.5]'
                      : 'stroke-zinc-200 dark:stroke-zinc-800/70 stroke-1 stroke-dasharray-2'
                  }
                />
              );
            })}

            {/* Vertical Station Grid lines (X Ticks) */}
            {stations.map(s => {
              const x = getX(s.distanceFt);
              return (
                <g key={s.id}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + innerHeight}
                    className="stroke-zinc-200 dark:stroke-zinc-800/60 stroke-1 stroke-dasharray-2"
                  />
                  <text
                    x={x}
                    y={padding.top + innerHeight + 20}
                    textAnchor="middle"
                    className="text-[11px] font-mono fill-zinc-600 dark:fill-zinc-400 font-bold"
                  >
                    {s.distanceFt}'
                  </text>
                </g>
              );
            })}

            {/* Target Grade Line (Dashed Green) */}
            {targetPath && (
              <path
                d={targetPath}
                fill="none"
                className="stroke-emerald-500 dark:stroke-emerald-400 stroke-2"
                strokeDasharray="6,4"
              />
            )}

            {/* Actual Track Line (Solid Crisp White / Silver in dark mode) */}
            {actualPath && (
              <path
                d={actualPath}
                fill="none"
                className="stroke-zinc-900 dark:stroke-zinc-100 stroke-[3.5]"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Station Markers / Nodes */}
            {stations.map(s => {
              const x = getX(s.distanceFt);
              const isMeasured = s.elevationInches !== null;
              const y = isMeasured ? getY(s.elevationInches!) : padding.top + innerHeight / 2;
              const isSelected = selectedStationId === s.id;

              let dotFill = '#52525b'; // zinc-600 unmeasured
              let dotStroke = '#000000';

              if (isMeasured) {
                if (s.action === 'ok') {
                  dotFill = '#10b981'; // emerald green
                  dotStroke = '#065f46';
                } else if (s.action === 'lift') {
                  dotFill = '#38bdf8'; // soft sky blue/cyan
                  dotStroke = '#0369a1';
                } else if (s.action === 'lower') {
                  dotFill = '#f59e0b'; // golden amber
                  dotStroke = '#b45309';
                }
              }

              return (
                <g
                  key={s.id}
                  className="cursor-pointer transition-transform hover:scale-125 active:scale-95"
                  onClick={() => onSelectStation(s)}
                  onMouseEnter={() => setHoveredStation(s)}
                  onMouseLeave={() => setHoveredStation(null)}
                >
                  {/* Invisible generous hit target (34px diameter) for fingers */}
                  <circle cx={x} cy={y} r={17} fill="transparent" />

                  {/* Selection pulse ring */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={11}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      className="animate-ping opacity-80"
                    />
                  )}

                  {/* Main Node */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isMeasured ? (isSelected ? 7.5 : 6) : 4.5}
                    fill={dotFill}
                    stroke={isSelected ? '#f59e0b' : dotStroke}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                  />

                  {/* Up / Down Action Badges on node */}
                  {isMeasured && s.action === 'lift' && (
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      className="text-[10px] font-mono font-black fill-sky-500 dark:fill-sky-400"
                    >
                      ▲
                    </text>
                  )}
                  {isMeasured && s.action === 'lower' && (
                    <text
                      x={x}
                      y={y + 17}
                      textAnchor="middle"
                      className="text-[10px] font-mono font-black fill-amber-500 dark:fill-amber-400"
                    >
                      ▼
                    </text>
                  )}
                </g>
              );
            })}

            {/* Bottom Distance Label */}
            <text
              x={chartWidth / 2}
              y={chartHeight - 8}
              textAnchor="middle"
              className="text-[10px] font-bold uppercase tracking-wider fill-zinc-500"
            >
              Track Distance along Rail (Feet)
            </text>
          </svg>
        </div>

        {/* Hover / Tooltip Card */}
        {hoveredStation && (
          <div
            className="absolute z-30 bg-black/95 text-white text-xs rounded-xl p-3 shadow-2xl pointer-events-none border border-zinc-700 backdrop-blur-md"
            style={{
              left: `${Math.min(Math.max(getX(hoveredStation.distanceFt) + 60, 80), window.innerWidth > 600 ? 550 : 220)}px`,
              top: '20px',
            }}
          >
            <div className="font-bold text-amber-400 flex items-center justify-between gap-4 border-b border-zinc-800 pb-1 mb-1.5">
              <span>Station: {hoveredStation.distanceFt} ft</span>
              <span className="font-mono text-[10px] text-zinc-300">
                {hoveredStation.readingInches !== null
                  ? `Reading: ${formatFeetInches(hoveredStation.readingInches)}`
                  : 'No reading'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
              <span className="text-zinc-400">Elevation:</span>
              <span className="font-mono text-right">{formatMeasurement(hoveredStation.elevationInches, 'inches_fraction')}</span>
              <span className="text-zinc-400">Target:</span>
              <span className="font-mono text-right">{formatMeasurement(hoveredStation.targetElevationInches, 'inches_fraction')}</span>
            </div>
            <div className="mt-1.5 pt-1 border-t border-zinc-800 font-bold text-center">
              {hoveredStation.action === 'ok' && (
                <span className="text-emerald-400">✓ On Grade</span>
              )}
              {hoveredStation.action === 'lift' && (
                <span className="text-sky-400">▲ {hoveredStation.actionText}</span>
              )}
              {hoveredStation.action === 'lower' && (
                <span className="text-amber-400">▼ {hoveredStation.actionText}</span>
              )}
              {hoveredStation.action === 'none' && (
                <span className="text-zinc-400 italic">Tap to record</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-zinc-900 dark:bg-zinc-100 rounded"></span>
            <span>Measured Rail</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500"></span>
            <span>Target Plane</span>
          </div>
        </div>
        <div className="flex items-center gap-3 font-semibold text-[11px]">
          <span className="flex items-center gap-1 text-sky-500 dark:text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span> Low (Lift)
          </span>
          <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> High (Lower)
          </span>
          <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> On Grade
          </span>
        </div>
      </div>
    </div>
  );
};
