import React, { useMemo } from 'react';
import { TrackProject, CalculatedStation } from '../core/types';
import { formatMeasurement } from '../core/units';
import { calculateGradeInfo } from '../core/calculations';
import { APP_VERSION_LABEL } from '../core/version';
import { StationSummaryData } from './StationConfig';

export interface PrintReportProps {
  project: TrackProject;
  calculatedStations: CalculatedStation[];
  summary: StationSummaryData;
}

export const PrintReport: React.FC<PrintReportProps> = ({
  project,
  calculatedStations,
  summary,
}) => {
  const gradeInfo = useMemo(() => {
    return calculateGradeInfo(calculatedStations, project.gradeMode, project.targetGradePercent);
  }, [calculatedStations, project.gradeMode, project.targetGradePercent]);

  // Dimensions for printable SVG graph in landscape orientation
  const width = 1000;
  const height = 120;
  const padding = { top: 14, right: 25, bottom: 24, left: 45 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Extents
  const minX = calculatedStations.length > 0 ? calculatedStations[0].distanceFt : 0;
  const maxX = calculatedStations.length > 0 ? calculatedStations[calculatedStations.length - 1].distanceFt : 100;
  const xSpan = maxX - minX || 1;

  const measured = calculatedStations.filter(s => s.elevationInches !== null);
  const elevs = measured.map(s => s.elevationInches as number);
  const targetElevs = calculatedStations.filter(s => s.targetElevationInches !== null).map(s => s.targetElevationInches as number);
  const allY = [...elevs, ...targetElevs, 0];

  const rawMinY = allY.length > 0 ? Math.min(...allY) : -1;
  const rawMaxY = allY.length > 0 ? Math.max(...allY) : 2;
  const yRange = Math.max(1.5, rawMaxY - rawMinY);
  const minY = Math.floor(rawMinY - yRange * 0.15);
  const maxY = Math.ceil(rawMaxY + yRange * 0.25);
  const ySpan = maxY - minY || 1;

  const getX = (distFt: number) => padding.left + ((distFt - minX) / xSpan) * innerWidth;
  const getY = (elevInches: number) => padding.top + innerHeight - ((elevInches - minY) / ySpan) * innerHeight;

  // Y Ticks (integers or halves)
  const yStep = ySpan > 8 ? 2 : ySpan > 4 ? 1 : 0.5;
  const yTicks: number[] = [];
  for (let v = Math.ceil(minY / yStep) * yStep; v <= maxY; v += yStep) {
    yTicks.push(Number(v.toFixed(2)));
  }

  // Smooth path
  const measuredPoints = measured.map(s => ({
    x: getX(s.distanceFt),
    y: getY(s.elevationInches as number),
  }));

  let smoothPath = '';
  if (measuredPoints.length === 1) {
    smoothPath = `M ${measuredPoints[0].x} ${measuredPoints[0].y}`;
  } else if (measuredPoints.length > 1) {
    smoothPath = `M ${measuredPoints[0].x} ${measuredPoints[0].y}`;
    for (let i = 0; i < measuredPoints.length - 1; i++) {
      const p0 = measuredPoints[i];
      const p1 = measuredPoints[i + 1];
      const mx = (p0.x + p1.x) / 2;
      smoothPath += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
  }

  // Target plane path
  const targetPoints = calculatedStations
    .filter(s => s.targetElevationInches !== null)
    .map(s => ({
      x: getX(s.distanceFt),
      y: getY(s.targetElevationInches as number),
    }));

  let targetPath = '';
  if (targetPoints.length > 1) {
    targetPath = `M ${targetPoints[0].x} ${targetPoints[0].y}`;
    for (let i = 1; i < targetPoints.length; i++) {
      targetPath += ` L ${targetPoints[i].x} ${targetPoints[i].y}`;
    }
  }

  const tol = project.toleranceInches ?? 0.0625;
  const tolLabel =
    Math.abs(tol - 0.03125) < 0.001 ? '±1/32"' :
    Math.abs(tol - 0.0625) < 0.001 ? '±1/16"' :
    Math.abs(tol - 0.05) < 0.001 ? '±0.05"' :
    Math.abs(tol - 0.125) < 0.001 ? '±1/8"' :
    `±${tol.toFixed(3)}"`;

  return (
    <div className="print-report-container p-0 bg-white text-black font-sans text-xs">
      {/* Report Header */}
      <div className="border-b-2 border-black pb-1.5 mb-1.5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-black tracking-tight text-black uppercase leading-tight">
              {project.name || 'Track Section Profile'}
            </h1>
            <p className="text-[10.5px] font-semibold text-zinc-600 mt-0.5">
              Track Level Companion {APP_VERSION_LABEL} • Track Vertical Profile & Field Leveling Sheet
            </p>
          </div>
          <div className="text-right font-mono text-[9.5px] text-zinc-700 leading-tight">
            <div><strong>Date:</strong> {project.date || new Date().toISOString().split('T')[0]}</div>
            <div><strong>Format:</strong> Field Sheet (Landscape)</div>
          </div>
        </div>

        {/* Metadata Summary Grid */}
        <div className="grid grid-cols-4 gap-2 mt-1.5 pt-1 border-t border-zinc-300 font-mono text-[10px]">
          <div className="py-0.5 px-2 bg-zinc-100 rounded border border-zinc-300">
            <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-tight">Section Length</span>
            <strong className="text-[11px]">{summary.lengthFt} ft</strong> ({summary.totalStations} ties)
          </div>
          <div className="py-0.5 px-2 bg-zinc-100 rounded border border-zinc-300">
            <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-tight">Grade</span>
            <strong className="text-[11px]">
              {gradeInfo ? `${gradeInfo.overallGradePercent >= 0 ? '+' : ''}${gradeInfo.overallGradePercent.toFixed(2)}%` : '0.00%'}
            </strong> ({project.gradeMode === 'end_to_end' ? 'End-to-End' : 'Target %'})
          </div>
          <div className="py-0.5 px-2 bg-zinc-100 rounded border border-zinc-300">
            <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-tight">On-Grade Margin</span>
            <strong className="text-[11px]">{tolLabel}</strong>
          </div>
          <div className="py-0.5 px-2 bg-zinc-100 rounded border border-zinc-300">
            <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-tight">Field Status</span>
            <strong className="text-[11px]">{summary.measuredCount}/{summary.totalStations} Shot</strong> • {summary.onGradeCount} On Grade
          </div>
        </div>
      </div>

      {/* SVG Vertical Profile Chart */}
      <div className="border border-zinc-300 rounded-md p-1 mb-1.5 bg-white break-inside-avoid">
        <div className="flex items-center justify-between mb-0.5 text-[9.5px] font-bold px-1">
          <span>VERTICAL ELEVATION PROFILE (INCHES)</span>
          <span className="text-zinc-600 font-mono text-[9px]">
            — Rail Head  •  - - Target Plane  •  ▲ Lift  •  ▼ Lower  •  ✓ On Grade
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block">
          {/* Y-Grid */}
          {yTicks.map(t => {
            const y = getY(t);
            const isZero = Math.abs(t) < 0.001;
            return (
              <g key={t}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={isZero ? '#000000' : '#e4e4e7'}
                  strokeWidth={isZero ? 1.5 : 1}
                  strokeDasharray={isZero ? undefined : '3,3'}
                />
                <text
                  x={padding.left - 5}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8"
                  fontFamily="monospace"
                  fill="#52525b"
                  fontWeight="bold"
                >
                  {t > 0 ? `+${t}"` : `${t}"`}
                </text>
              </g>
            );
          })}

          {/* X-Grid lines */}
          {calculatedStations.map(s => {
            const x = getX(s.distanceFt);
            return (
              <line
                key={`xgrid-${s.id}`}
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + innerHeight}
                stroke="#f4f4f5"
                strokeWidth="1"
              />
            );
          })}

          {/* Target plane dashed line */}
          {targetPath && (
            <path
              d={targetPath}
              fill="none"
              stroke="#059669"
              strokeWidth="1.8"
              strokeDasharray="5,4"
            />
          )}

          {/* Measured rail line */}
          {smoothPath && (
            <path
              d={smoothPath}
              fill="none"
              stroke="#09090b"
              strokeWidth="2.5"
            />
          )}

          {/* Station Nodes and attached Callout Data Badges */}
          {calculatedStations.map(s => {
            const x = getX(s.distanceFt);
            const isMeasured = s.elevationInches !== null;
            const y = isMeasured ? getY(s.elevationInches as number) : getY(0);

            let badgeText = '';
            let badgeColor = '#52525b';
            if (s.isLocked) {
              badgeText = '🔒';
              badgeColor = '#d97706';
            } else if (s.isTurningPoint) {
              badgeText = '🚩';
              badgeColor = '#7e22ce';
            } else if (s.action === 'ok') {
              badgeText = s.actionText === 'DATUM (REF)' ? 'REF' : 'OK';
              badgeColor = '#059669';
            } else if (s.action === 'lift') {
              badgeText = `▲+${formatMeasurement(s.liftInches, project.unitFormat, project.fractionResolution)}`;
              badgeColor = '#0284c7';
            } else if (s.action === 'lower') {
              badgeText = `▼-${formatMeasurement(Math.abs(s.liftInches || 0), project.unitFormat, project.fractionResolution)}`;
              badgeColor = '#d97706';
            }

            return (
              <g key={s.id}>
                {/* Point dot */}
                {isMeasured && (
                  <circle
                    cx={x}
                    cy={y}
                    r={s.completed ? 4 : 3.5}
                    fill={s.action === 'ok' ? '#059669' : s.action === 'lift' ? '#0284c7' : '#d97706'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}

                {/* Attached Callout Label above node */}
                {isMeasured && badgeText && (
                  <text
                    x={x}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill={badgeColor}
                  >
                    {badgeText}
                  </text>
                )}

                {/* X Axis distance tick & label */}
                <line
                  x1={x}
                  y1={padding.top + innerHeight}
                  x2={x}
                  y2={padding.top + innerHeight + 3}
                  stroke="#71717a"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + innerHeight + 11}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontFamily="monospace"
                  fill="#18181b"
                  fontWeight="bold"
                >
                  {s.distanceFt}'
                </text>
              </g>
            );
          })}

          {/* Bottom axis title */}
          <text
            x={width / 2}
            y={height - 3}
            textAnchor="middle"
            fontSize="7.5"
            fontFamily="sans-serif"
            fontWeight="bold"
            fill="#71717a"
            letterSpacing="1"
          >
            TRACK DISTANCE (FEET)
          </text>
        </svg>
      </div>

      {/* Tie-by-Tie Leveling Schedule Table */}
      <div className="mt-1">
        <div className="flex items-center justify-between mb-1 px-0.5">
          <h2 className="text-[11px] font-black uppercase text-black">
            TIE-BY-TIE FIELD LEVELING SCHEDULE & READOUT TABLE
          </h2>
          <span className="text-[9px] text-zinc-500 font-mono">
            Target Rod = Exact laser detector elevation when leveled
          </span>
        </div>

        <table className="w-full border-collapse border border-zinc-400 font-mono text-[9.5px]">
          <thead>
            <tr className="bg-zinc-200 text-black border-b border-zinc-400 text-left">
              <th className="py-1 px-1.5 border-r border-zinc-300 w-[10%]">Station</th>
              <th className="py-1 px-1.5 border-r border-zinc-300 w-[13%]">Last Reading</th>
              <th className="py-1 px-1.5 border-r border-zinc-300 w-[13%]">Target Rod</th>
              <th className="py-1 px-1.5 border-r border-zinc-300 w-[11%]">Rel. Elev</th>
              <th className="py-1 px-1.5 border-r border-zinc-300 w-[25%]">Required Action</th>
              <th className="py-1 px-1.5 border-r border-zinc-300 w-[7%] text-center">Done</th>
              <th className="py-1 px-1.5 w-[21%]">Notes / Flags</th>
            </tr>
          </thead>
          <tbody>
            {calculatedStations.map((s, idx) => {
              const isEven = idx % 2 === 0;
              const isOk = s.action === 'ok';
              const isLift = s.action === 'lift';
              const isLower = s.action === 'lower';

              return (
                <tr
                  key={s.id}
                  className={`border-b border-zinc-300 break-inside-avoid ${isEven ? 'bg-white' : 'bg-zinc-50'}`}
                >
                  <td className="py-0.5 px-1.5 border-r border-zinc-300 font-bold text-black whitespace-nowrap">
                    {s.distanceFt} ft
                  </td>
                  <td className="py-0.5 px-1.5 border-r border-zinc-300 whitespace-nowrap">
                    {s.readingInches !== null
                      ? formatMeasurement(s.readingInches, project.unitFormat, project.fractionResolution)
                      : '—'}
                  </td>
                  <td className="py-0.5 px-1.5 border-r border-zinc-300 font-bold text-blue-900 whitespace-nowrap">
                    {s.targetReadingInches !== null && s.targetReadingInches !== undefined
                      ? formatMeasurement(s.targetReadingInches, project.unitFormat, project.fractionResolution)
                      : '—'}
                  </td>
                  <td className="py-0.5 px-1.5 border-r border-zinc-300 whitespace-nowrap">
                    {s.elevationInches !== null
                      ? formatMeasurement(s.elevationInches, project.unitFormat, project.fractionResolution)
                      : '—'}
                  </td>
                  <td className="py-0.5 px-1.5 border-r border-zinc-300 font-bold whitespace-nowrap">
                    {isOk && (
                      <span className="text-emerald-800">
                        ✓ {s.actionText === 'DATUM (REF)' ? 'DATUM (REF)' : 'ON GRADE'}
                      </span>
                    )}
                    {isLift && (
                      <span className="text-sky-800">
                        ▲ LIFT {formatMeasurement(s.liftInches, project.unitFormat, project.fractionResolution)}
                      </span>
                    )}
                    {isLower && (
                      <span className="text-amber-800">
                        ▼ LOWER {formatMeasurement(Math.abs(s.liftInches || 0), project.unitFormat, project.fractionResolution)}
                      </span>
                    )}
                    {!isOk && !isLift && !isLower && <span>—</span>}
                  </td>
                  <td className="py-0.5 px-1.5 border-r border-zinc-300 text-center">
                    <span className="inline-block w-3.5 h-3.5 border border-zinc-500 rounded-xs text-center leading-3 font-bold text-emerald-700">
                      {s.completed ? '✓' : ''}
                    </span>
                  </td>
                  <td className="py-0.5 px-1.5 text-[9px] text-zinc-600 truncate">
                    {s.isTurningPoint && <span className="font-bold text-purple-800">[TP / Benchmark] </span>}
                    {s.isLocked && <span className="font-bold text-amber-800">[LOCKED Point] </span>}
                    {s.datumOffsetInches ? `Shift: ${s.datumOffsetInches >= 0 ? '+' : ''}${formatMeasurement(s.datumOffsetInches, project.unitFormat, project.fractionResolution)}` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer signoff block */}
      <div className="mt-1.5 pt-1 border-t border-zinc-300 flex justify-between items-center text-[9px] text-zinc-500 font-mono break-inside-avoid">
        <div>Surveyed by: ________________________</div>
        <div>Tamped / Leveled by: ________________________</div>
        <div>Field Leveling Sheet • Track Level Companion</div>
      </div>
    </div>
  );
};
