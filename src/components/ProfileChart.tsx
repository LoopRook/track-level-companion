import React, { useState, useMemo } from 'react';
import { CalculatedStation, GradeMode } from '../core/types';
import { formatFeetInches, formatMeasurement } from '../core/units';
import { Activity, Layers } from 'lucide-react';

interface ProfileChartProps {
  stations: CalculatedStation[];
  gradeMode: GradeMode;
  targetGradePercent: number;
  onSelectStation: (station: CalculatedStation) => void;
  selectedStationId?: string | null;
}

export const ProfileChart: React.FC<ProfileChartProps> = ({
  stations,
  onSelectStation,
  selectedStationId,
}) => {
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(20);
  const [smoothCurve, setSmoothCurve] = useState<boolean>(true);
  const [hoveredStation, setHoveredStation] = useState<CalculatedStation | null>(null);

  // Filter valid measured stations
  const measuredStations = useMemo(() => {
    return stations.filter(s => s.elevationInches !== null && s.targetElevationInches !== null);
  }, [stations]);

  // Chart dimensions & scaling
  const chartWidth = 900;
  const chartHeight = 360;
  const padding = { top: 40, right: 50, bottom: 60, left: 65 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Extents
  const minX = stations.length > 0 ? stations[0].distanceFt : 0;
  const maxX = stations.length > 0 ? Math.max(stations[stations.length - 1].distanceFt, minX + 10) : 50;

  // Elevation extents (inches)
  const allYValues = useMemo(() => {
    const vals: number[] = [0];
    measuredStations.forEach(s => {
      if (s.elevationInches !== null) vals.push(s.elevationInches);
      if (s.targetElevationInches !== null) vals.push(s.targetElevationInches);
    });
    return vals;
  }, [measuredStations]);

  const rawMinY = Math.min(...allYValues);
  const rawMaxY = Math.max(...allYValues);
  // Add padding margin to Y
  const ySpan = Math.max(rawMaxY - rawMinY, 1.0); // at least 1 inch range
  const minY = rawMinY - ySpan * 0.25;
  const maxY = rawMaxY + ySpan * 0.25;

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
      // Straight lines
      return measuredStations.reduce((acc, s, idx) => {
        const x = getX(s.distanceFt);
        const y = getY(s.elevationInches!);
        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, '');
    }

    // Catmull-Rom to cubic Bezier curve for "gentle graph"
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

      // Tension factor 0.3 for gentle, realistic track profile
      const cp1x = p1.x + (p2.x - p0.x) * 0.15;
      const cp1y = p1.y + (p2.y - p0.y) * 0.15;
      const cp2x = p2.x - (p3.x - p1.x) * 0.15;
      const cp2y = p2.y - (p3.y - p1.y) * 0.15;

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

  // Horizontal Grid Lines (Elevation ticks in 1/2" or 1" increments)
  const yTicks = useMemo(() => {
    const ticks: { val: number; y: number; label: string }[] = [];
    const step = ySpan > 6 ? 2.0 : ySpan > 2 ? 1.0 : 0.5; // step in inches
    const startTick = Math.floor(minY / step) * step;
    for (let v = startTick; v <= maxY; v += step) {
      ticks.push({
        val: v,
        y: getY(v),
        label: formatMeasurement(v, 'inches_fraction', 16),
      });
    }
    return ticks;
  }, [minY, maxY, ySpan]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Chart Toolbar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
            Track Vertical Profile
          </h3>
          <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium px-2 py-0.5 rounded-full">
            {measuredStations.length} of {stations.length} Shot
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
          {/* Smooth Curve Toggle */}
          <button
            onClick={() => setSmoothCurve(!smoothCurve)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
              smoothCurve
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title="Toggle between gentle smooth curve and straight station chords"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gentle Curve</span>
          </button>

          {/* Vertical Exaggeration Slider */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
            <span className="text-slate-500 font-normal">Vert. Zoom:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{verticalExaggeration}x</span>
            <div className="flex items-center gap-1 ml-1">
              {[10, 20, 50].map(zoom => (
                <button
                  key={zoom}
                  onClick={() => setVerticalExaggeration(zoom)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                    verticalExaggeration === zoom
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {zoom}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full overflow-x-auto p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[650px] select-none"
        >
          <defs>
            {/* Gradient for Lift Region (track below target) */}
            <linearGradient id="liftFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>

            {/* Gradient for Lower Region (track above target) */}
            <linearGradient id="lowerFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={innerHeight}
            className="fill-slate-50/50 dark:fill-slate-950/40"
          />

          {/* Horizontal Grid lines (Y Ticks) */}
          {yTicks.map(t => (
            <g key={t.val}>
              <line
                x1={padding.left}
                y1={t.y}
                x2={padding.left + innerWidth}
                y2={t.y}
                className={`stroke-slate-200 dark:stroke-slate-800 ${t.val === 0 ? 'stroke-slate-400 dark:stroke-slate-600 stroke-[1.5]' : 'stroke-1 stroke-dashed'}`}
              />
              <text
                x={padding.left - 10}
                y={t.y + 4}
                textAnchor="end"
                className="text-[11px] font-mono fill-slate-400 font-semibold"
              >
                {t.label}
              </text>
            </g>
          ))}

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
                  className="stroke-slate-200 dark:stroke-slate-800/80 stroke-1 stroke-dasharray-2"
                />
                <text
                  x={x}
                  y={padding.top + innerHeight + 20}
                  textAnchor="middle"
                  className="text-[11px] font-mono fill-slate-500 font-bold"
                >
                  {s.distanceFt}'
                </text>
              </g>
            );
          })}

          {/* Target Grade Line (Dashed) */}
          {targetPath && (
            <path
              d={targetPath}
              fill="none"
              className="stroke-emerald-500 dark:stroke-emerald-400 stroke-2 stroke-dasharray-4"
              strokeDasharray="6,4"
            />
          )}

          {/* Actual Track Line (Solid) */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              className="stroke-blue-600 dark:stroke-blue-400 stroke-3"
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

            let dotFill = '#94a3b8'; // gray unmeasured
            let ringColor = 'none';

            if (isMeasured) {
              if (s.action === 'ok') {
                dotFill = '#10b981'; // green
              } else if (s.action === 'lift') {
                dotFill = '#3b82f6'; // blue
              } else if (s.action === 'lower') {
                dotFill = '#f97316'; // amber/orange
              }
            }

            if (isSelected) {
              ringColor = '#eab308'; // bright yellow ring
            }

            return (
              <g
                key={s.id}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => onSelectStation(s)}
                onMouseEnter={() => setHoveredStation(s)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {/* Hit target */}
                <circle cx={x} cy={y} r={14} fill="transparent" />

                {/* Selection pulse ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={10}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="3"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Main Node */}
                <circle
                  cx={x}
                  cy={y}
                  r={isMeasured ? (isSelected ? 7 : 5.5) : 4}
                  fill={dotFill}
                  stroke={isSelected ? '#ffffff' : '#1e293b'}
                  strokeWidth="2"
                  className="shadow-md"
                />

                {/* Status indicator on node */}
                {isMeasured && s.action === 'lift' && (
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-extrabold fill-blue-600 dark:fill-blue-400"
                  >
                    ▲
                  </text>
                )}
                {isMeasured && s.action === 'lower' && (
                  <text
                    x={x}
                    y={y + 18}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-extrabold fill-amber-600 dark:fill-amber-400"
                  >
                    ▼
                  </text>
                )}
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 12}
            textAnchor="middle"
            className="text-xs font-bold uppercase tracking-wider fill-slate-500"
          >
            Track Distance along Rail (Feet)
          </text>
          <text
            x={18}
            y={chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 18 ${chartHeight / 2})`}
            className="text-xs font-bold uppercase tracking-wider fill-slate-500"
          >
            Relative Elevation (Inches)
          </text>
        </svg>

        {/* Hover / Tooltip Card */}
        {hoveredStation && (
          <div
            className="absolute z-20 bg-slate-900/95 text-white text-xs rounded-xl p-3 shadow-xl pointer-events-none border border-slate-700 backdrop-blur-md"
            style={{
              left: `${Math.min(Math.max(getX(hoveredStation.distanceFt) - 80, 20), chartWidth - 190)}px`,
              top: `${Math.max(hoveredStation.elevationInches !== null ? getY(hoveredStation.elevationInches) - 85 : 50, 15)}px`,
            }}
          >
            <div className="font-bold text-amber-400 flex items-center justify-between gap-4 border-b border-slate-700 pb-1 mb-1.5">
              <span>Station: {hoveredStation.distanceFt} ft</span>
              <span className="font-mono text-[10px] text-slate-300">
                {hoveredStation.readingInches !== null
                  ? `Reading: ${formatFeetInches(hoveredStation.readingInches)}`
                  : 'No reading'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
              <span className="text-slate-400">Elevation:</span>
              <span className="font-mono text-right">{formatMeasurement(hoveredStation.elevationInches, 'inches_fraction')}</span>
              <span className="text-slate-400">Target:</span>
              <span className="font-mono text-right">{formatMeasurement(hoveredStation.targetElevationInches, 'inches_fraction')}</span>
            </div>
            <div className="mt-1.5 pt-1 border-t border-slate-700/80 font-bold text-center">
              {hoveredStation.action === 'ok' && (
                <span className="text-emerald-400">✓ On Grade</span>
              )}
              {hoveredStation.action === 'lift' && (
                <span className="text-blue-400">▲ {hoveredStation.actionText}</span>
              )}
              {hoveredStation.action === 'lower' && (
                <span className="text-amber-400">▼ {hoveredStation.actionText}</span>
              )}
              {hoveredStation.action === 'none' && (
                <span className="text-slate-400 italic">Tap to record</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-600 rounded"></span>
            <span>Measured Rail Head</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500"></span>
            <span>Target Grade Plane</span>
          </div>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Low (Needs Lift)
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> High (Needs Lower)
          </span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> On Grade
          </span>
        </div>
      </div>
    </div>
  );
};
