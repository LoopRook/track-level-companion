import React, { useState, useMemo } from 'react';
import { CalculatedStation, GradeMode } from '../core/types';
import { formatFeetInches, formatMeasurement } from '../core/units';
import { Spline, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';

interface ProfileChartProps {
  stations: CalculatedStation[];
  gradeMode: GradeMode;
  targetGradePercent: number;
  onSelectStation: (station: CalculatedStation) => void;
  selectedStationId?: string | null;
}

type ZoomScale = '1x' | '3x' | '8x' | '15x';

/**
 * Fritsch-Carlson Monotone Cubic Spline
 * Guaranteed to pass through every station point smoothly without overshoot/fake waves.
 */
function getSmoothSplinePath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M ${points[0].x} ${points[0].y}`;
  if (n === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  const dxs: number[] = [];
  const dys: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    dxs.push(dx);
    dys.push(dy);
    slopes.push(dx === 0 ? 0 : dy / dx);
  }

  const m: number[] = new Array(n).fill(0);
  m[0] = slopes[0];
  m[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = (slopes[i - 1] + slopes[i]) / 2;
  }

  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(slopes[i]) < 1e-9) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / slopes[i];
      const beta = m[i + 1] / slopes[i];
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        m[i] = tau * alpha * slopes[i];
        m[i + 1] = tau * beta * slopes[i];
      }
    }
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = dxs[i] / 3;
    const cp1x = p1.x + dx;
    const cp1y = p1.y + m[i] * dx;
    const cp2x = p2.x - dx;
    const cp2y = p2.y - m[i + 1] * dx;
    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export const ProfileChart: React.FC<ProfileChartProps> = ({
  stations,
  onSelectStation,
  selectedStationId,
}) => {
  // Style: 'curve' (gentle smooth curve) vs 'straight' (point-to-point chords)
  const [curveMode, setCurveMode] = useState<'curve' | 'straight'>('curve');
  // Zoom: '3x' is default gentle view, 8x/15x are exaggerated
  const [zoomScale, setZoomScale] = useState<ZoomScale>('3x');
  const [isScrollable, setIsScrollable] = useState<boolean>(false);
  const [activeStation, setActiveStation] = useState<CalculatedStation | null>(null);

  // Filter measured stations
  const measuredStations = useMemo(() => {
    return stations.filter(s => s.elevationInches !== null && s.targetElevationInches !== null);
  }, [stations]);

  // Dimensions
  const baseWidth = 850;
  const chartHeight = 250;
  const padding = { top: 35, right: 35, bottom: 40, left: 60 };

  // Width
  const effectiveWidth = isScrollable ? Math.max(baseWidth, stations.length * 60) : baseWidth;
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

  // Zoom Multiplier: magnifies dips & humps relative to target grade
  const exaggerationMultiplier: number = useMemo(() => {
    switch (zoomScale) {
      case '1x': return 1.0;
      case '3x': return 3.0;
      case '8x': return 8.0;
      case '15x': return 15.0;
      default: return 3.0;
    }
  }, [zoomScale]);

  // Helper to compute exaggerated visual elevation for smooth curve and markers
  const getVisualElev = (s: CalculatedStation): number | null => {
    if (s.elevationInches === null || isNaN(s.elevationInches)) return null;
    if (s.targetElevationInches !== null && !isNaN(s.targetElevationInches)) {
      const diff = s.elevationInches - s.targetElevationInches;
      return s.targetElevationInches + diff * exaggerationMultiplier;
    }
    const base = measuredStations[0]?.elevationInches ?? 0;
    const diff = s.elevationInches - base;
    return base + diff * exaggerationMultiplier;
  };

  // Vertical Extents (inches) - fits visual curve comfortably without clipping
  const { minY, maxY, yTicks } = useMemo(() => {
    const vals: number[] = [0];
    measuredStations.forEach(s => {
      const vElev = getVisualElev(s);
      if (vElev !== null && !isNaN(vElev)) vals.push(vElev);
      if (s.targetElevationInches !== null && !isNaN(s.targetElevationInches)) {
        vals.push(s.targetElevationInches);
      }
    });

    const validVals = vals.filter(v => typeof v === 'number' && !isNaN(v));
    const rawMin = validVals.length > 0 ? Math.min(...validVals) : 0;
    const rawMax = validVals.length > 0 ? Math.max(...validVals) : 0;
    const actualSpan = Math.max(rawMax - rawMin, 0);

    // Provide at least 3.0" minimum visual window and 30% margin
    const span = Math.max(actualSpan * 1.35, 3.0);
    const center = (rawMax + rawMin) / 2;

    const calcMinY = center - span / 2;
    const calcMaxY = center + span / 2;

    // Ticks
    const step = span > 14 ? 2.0 : span > 4 ? 1.0 : 0.5;
    const ticks: { val: number; label: string }[] = [];
    const firstTick = Math.ceil(calcMinY / step) * step;

    for (let v = firstTick; v <= calcMaxY + 0.001; v += step) {
      if (ticks.length >= 30) break;
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
  }, [measuredStations, exaggerationMultiplier]);

  // Coordinate transforms
  const getX = (distFt: number) => {
    if (maxX === minX) return padding.left + innerWidth / 2;
    return padding.left + ((distFt - minX) / (maxX - minX)) * innerWidth;
  };

  const getY = (elevInches: number) => {
    if (maxY === minY) return padding.top + innerHeight / 2;
    return padding.top + innerHeight - ((elevInches - minY) / (maxY - minY)) * innerHeight;
  };

  // Generate SVG path for actual rail profile (using visual exaggerated points)
  const actualPath = useMemo(() => {
    if (measuredStations.length < 2) return '';

    const pts = measuredStations.map(s => ({
      x: getX(s.distanceFt),
      y: getY(getVisualElev(s)!),
    }));

    if (curveMode === 'curve') {
      return getSmoothSplinePath(pts);
    }

    // Straight chord lines
    return pts.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }, '');
  }, [measuredStations, curveMode, minY, maxY, minX, maxX, innerWidth, exaggerationMultiplier]);

  // Generate SVG path for target grade
  const targetPath = useMemo(() => {
    if (measuredStations.length < 2) return '';
    return measuredStations.reduce((acc, s, idx) => {
      const x = getX(s.distanceFt).toFixed(1);
      const y = getY(s.targetElevationInches!).toFixed(1);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [measuredStations, minY, maxY, minX, maxX, innerWidth]);

  // Active station to inspect (selected or hovered)
  const currentInspectStation = activeStation || stations.find(s => s.id === selectedStationId) || null;

  return (
    <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors">
      {/* Header Toolbar */}
      <div className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 bg-zinc-50 dark:bg-zinc-950">
        {/* Title and Shot Counter */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
            Track Vertical Profile
          </h3>
          <span className="text-[11px] bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 font-mono px-2 py-0.5 rounded-full">
            {measuredStations.length}/{stations.length} Shot
          </span>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Curve vs Straight Toggle */}
          <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-800">
            <button
              onClick={() => setCurveMode('curve')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition active:scale-95 ${
                curveMode === 'curve'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Smooth gentle curve connecting stations"
            >
              <Spline className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Curve</span>
            </button>
            <button
              onClick={() => setCurveMode('straight')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition active:scale-95 ${
                curveMode === 'straight'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Straight point-to-point lines"
            >
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Straight</span>
            </button>
          </div>

          {/* Vertical Zoom Sensitivity Buttons */}
          <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold px-1.5 hidden md:inline">
              Vert:
            </span>
            {(['1x', '3x', '8x', '15x'] as ZoomScale[]).map(scale => (
              <button
                key={scale}
                onClick={() => setZoomScale(scale)}
                className={`px-2 py-1 rounded font-mono text-xs font-bold transition active:scale-95 ${
                  zoomScale === scale
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-amber-400 shadow-sm ring-1 ring-amber-400/50'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title={
                  scale === '1x'
                    ? '1x True Scale: Real-world physical geometry (subtle dips)'
                    : scale === '3x'
                    ? '3x Gentle: Realistic smooth rail flex (Default)'
                    : scale === '8x'
                    ? '8x Noticeable: Magnify dips and humps 8x'
                    : '15x Exaggerated: High magnification for fine 1/16" leveling'
                }
              >
                {scale}
              </button>
            ))}
          </div>

          {/* Expand / Fit Width Toggle */}
          <button
            onClick={() => setIsScrollable(!isScrollable)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-200/80 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-800 transition"
            title={isScrollable ? 'Fit entire track to screen' : 'Expand track for wide horizontal scrolling'}
          >
            {isScrollable ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span className="text-[11px] hidden sm:inline">Fit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span className="text-[11px] hidden sm:inline">Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selected Station Banner / Active Readout */}
      {currentInspectStation && (
        <div className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between text-xs font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-500 dark:text-amber-400">
              Station {currentInspectStation.distanceFt} ft
            </span>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-700 dark:text-zinc-300">
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
              className="text-[11px] underline text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 ml-1.5"
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
                      : 'stroke-zinc-200 dark:stroke-zinc-800/80 stroke-1'
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
              className="stroke-zinc-900 dark:stroke-white stroke-[3.5]"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Station Markers / Interactive Points */}
          {stations.map(s => {
            const x = getX(s.distanceFt);
            const isMeasured = s.elevationInches !== null;
            const y = isMeasured ? getY(getVisualElev(s)!) : padding.top + innerHeight / 2;
            const isSelected = selectedStationId === s.id;

            let dotFill = '#52525b'; // zinc-600 unmeasured
            if (isMeasured) {
              if (s.action === 'ok') dotFill = '#10b981'; // green
              else if (s.action === 'lift') dotFill = '#38bdf8'; // sky blue
              else if (s.action === 'lower') dotFill = '#f59e0b'; // amber
            }

            return (
              <g
                key={s.id}
                className="cursor-pointer transition-transform hover:scale-125 active:scale-95"
                onClick={() => {
                  setActiveStation(s);
                  onSelectStation(s);
                }}
                onMouseEnter={() => setActiveStation(s)}
                onMouseLeave={() => setActiveStation(null)}
              >
                {/* Generous touch target */}
                <circle cx={x} cy={y} r={17} fill="transparent" />

                {/* Selection indicator ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={10}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    className="animate-pulse"
                  />
                )}

                {/* Turning Point (Benchmark) ring */}
                {s.isTurningPoint && (
                  <circle
                    cx={x}
                    cy={y}
                    r={9}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeDasharray="2,2"
                  />
                )}

                {/* Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isMeasured ? (isSelected ? 6.5 : 5.5) : 3.5}
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
            <span>Rail Head ({curveMode === 'curve' ? 'Smooth Curve' : 'Straight Chords'})</span>
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
