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
    <div className="print-report-container p-0 bg-white text-black font-['Space_Mono',monospace] text-xs">
      {/* Report Header */}
      <div className="border-b-2 border-black pb-2 mb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D71921] inline-block shrink-0" />
              <span className="text-[10px] font-bold text-zinc-600 tracking-wider uppercase">
                [ TRACK LEVEL COMPANION • FIELD REPORT ]
              </span>
            </div>
            <h1 className="text-base font-bold tracking-tight text-black uppercase leading-tight mt-0.5">
              [ {project.name || 'TRACK SECTION PROFILE'} ]
            </h1>
            <p className="text-[9.5px] font-medium text-zinc-500 mt-0.5 tracking-wider uppercase">
              TRACK VERTICAL PROFILE & FIELD LEVELING TELEMETRY • {APP_VERSION_LABEL}
            </p>
          </div>
          <div className="text-right font-mono text-[9px] text-zinc-800 leading-tight border border-zinc-300 rounded px-2.5 py-1 bg-zinc-50">
            <div><strong>DATE:</strong> {project.date || new Date().toISOString().split('T')[0]}</div>
            <div><strong>DATUM:</strong> {project.laserDatumMode === 'relative_to_first' ? 'STATION 0 (REF)' : 'BENCHMARK'}</div>
            <div><strong>FORMAT:</strong> LANDSCAPE FIELD SHEET</div>
          </div>
        </div>

        {/* Metadata Summary Telemetry Grid */}
        <div className="grid grid-cols-4 gap-2 mt-2 pt-1.5 border-t border-zinc-300 text-[10px]">
          <div className="py-1 px-2.5 bg-zinc-50 rounded-lg border border-zinc-300">
            <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-tight tracking-wider">
              [ SECTION LENGTH ]
            </span>
            <strong className="text-[12px] font-bold text-black block">{summary.lengthFt} FT</strong>
            <span className="text-zinc-600 text-[8.5px] block">({summary.totalStations} TIES)</span>
          </div>
          <div className="py-1 px-2.5 bg-zinc-50 rounded-lg border border-zinc-300">
            <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-tight tracking-wider">
              [ DESIGN GRADE ]
            </span>
            <strong className="text-[12px] font-bold text-black block">
              {gradeInfo ? `${gradeInfo.overallGradePercent >= 0 ? '+' : ''}${gradeInfo.overallGradePercent.toFixed(2)}%` : '0.00%'}
            </strong>
            <span className="text-zinc-600 text-[8.5px] block">({project.gradeMode === 'end_to_end' ? 'END-TO-END' : 'TARGET %'})</span>
          </div>
          <div className="py-1 px-2.5 bg-zinc-50 rounded-lg border border-zinc-300">
            <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-tight tracking-wider">
              [ TOLERANCE WINDOW ]
            </span>
            <strong className="text-[12px] font-bold text-emerald-700 block">{tolLabel}</strong>
            <span className="text-zinc-600 text-[8.5px] block">(SHIM THRESHOLD)</span>
          </div>
          <div className="py-1 px-2.5 bg-zinc-50 rounded-lg border border-zinc-300">
            <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-tight tracking-wider">
              [ FIELD STATUS ]
            </span>
            <strong className="text-[12px] font-bold text-black block">{summary.measuredCount}/{summary.totalStations} SHOT</strong>
            <span className="text-zinc-600 text-[8.5px] block">• {summary.onGradeCount} ON GRADE</span>
          </div>
        </div>
      </div>

      {/* SVG Vertical Profile Chart */}
      <div className="border border-zinc-300 rounded-lg p-1.5 mb-2 bg-white break-inside-avoid">
        <div className="flex items-center justify-between mb-1 text-[9px] font-bold px-1 uppercase tracking-wider">
          <span>[ VERTICAL ELEVATION PROFILE (INCHES) ]</span>
          <span className="text-zinc-600 text-[8.5px]">
            — Rail Head  •  - - Target Grade  •  ▲ Lift  •  ▼ Lower  •  ✓ On Grade
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
                  fontSize="7.5"
                  fontFamily="Space Mono, monospace"
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
              strokeDasharray="4,3"
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
              badgeText = '🔒 ROOT';
              badgeColor = '#b45309';
            } else if (s.isTurningPoint) {
              badgeText = '🚩 TP';
              badgeColor = '#7e22ce';
            } else if (s.action === 'ok') {
              badgeText = s.actionText === 'DATUM (REF)' ? 'REF' : 'OK';
              badgeColor = s.actionText === 'DATUM (REF)' ? '#D71921' : '#059669';
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
                    fill={s.actionText === 'DATUM (REF)' ? '#D71921' : s.action === 'ok' ? '#059669' : s.action === 'lift' ? '#0284c7' : '#d97706'}
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
                    fontSize="7"
                    fontFamily="Space Mono, monospace"
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
                  fontFamily="Space Mono, monospace"
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
            fontFamily="Space Mono, monospace"
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
          <h2 className="text-[10px] font-bold uppercase text-black tracking-wider">
            [ TIE-BY-TIE FIELD LEVELING SCHEDULE & READOUT TABLE ]
          </h2>
          <span className="text-[8.5px] text-zinc-500">
            Target Rod = Exact laser detector elevation when leveled
          </span>
        </div>

        <table className="w-full border-collapse border border-zinc-700 text-[9px]">
          <thead>
            <tr className="bg-zinc-900 text-white border-b-2 border-black text-left">
              <th className="py-1 px-1.5 border-r border-zinc-700 w-[10%]">[ STATION ]</th>
              <th className="py-1 px-1.5 border-r border-zinc-700 w-[13%]">[ LAST ROD ]</th>
              <th className="py-1 px-1.5 border-r border-zinc-700 w-[13%]">[ TARGET ROD ]</th>
              <th className="py-1 px-1.5 border-r border-zinc-700 w-[11%]">[ REL ELEV ]</th>
              <th className="py-1 px-1.5 border-r border-zinc-700 w-[25%]">[ ACTION / CORRECTION ]</th>
              <th className="py-1 px-1.5 border-r border-zinc-700 w-[7%] text-center">[ DONE ]</th>
              <th className="py-1 px-1.5 w-[21%]">[ NOTES / FLAGS ]</th>
            </tr>
          </thead>
          <tbody>
            {calculatedStations.map((s) => {
              const isOk = s.action === 'ok';
              const isLift = s.action === 'lift';
              const isLower = s.action === 'lower';
              const isRef = s.actionText === 'DATUM (REF)';

              return (
                <tr
                  key={s.id}
                  className="border-b border-zinc-300 break-inside-avoid bg-white text-zinc-950"
                >
                  <td className="py-0.5 px-1.5 border-r border-zinc-300 font-bold whitespace-nowrap">
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
                    {isRef && (
                      <span className="px-1.5 py-0.5 rounded border border-[#D71921] bg-red-50 text-[#D71921] text-[8px]">
                        ● REF DATUM
                      </span>
                    )}
                    {!isRef && isOk && (
                      <span className="px-1.5 py-0.5 rounded border border-emerald-600 bg-emerald-50 text-emerald-900 text-[8px]">
                        ✓ ON GRADE
                      </span>
                    )}
                    {isLift && (
                      <span className="px-1.5 py-0.5 rounded border border-sky-600 bg-sky-50 text-sky-950 text-[8px]">
                        ▲ LIFT {formatMeasurement(s.liftInches, project.unitFormat, project.fractionResolution)}
                      </span>
                    )}
                    {isLower && (
                      <span className="px-1.5 py-0.5 rounded border border-amber-600 bg-amber-50 text-amber-950 text-[8px]">
                        ▼ LOWER {formatMeasurement(Math.abs(s.liftInches || 0), project.unitFormat, project.fractionResolution)}
                      </span>
                    )}
                    {!isOk && !isLift && !isLower && <span>—</span>}
                  </td>
                  <td className="py-0.5 px-1.5 border-r border-zinc-300 text-center">
                    <span className="inline-block w-3.5 h-3.5 border border-zinc-600 rounded-sm text-center leading-3 font-bold text-emerald-800">
                      {s.completed ? '✓' : ''}
                    </span>
                  </td>
                  <td className="py-0.5 px-1.5 text-[8.5px] text-zinc-700 truncate">
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

      {/* Footer Signoff Block */}
      <div className="mt-2 pt-1.5 border-t-2 border-black flex justify-between items-center text-[8.5px] text-zinc-600 uppercase tracking-wider break-inside-avoid">
        <div>[ SURVEYOR: ________________________ ]</div>
        <div>[ TAMPING CREW: ________________________ ]</div>
        <div>[ INSPECTED: ________________________ ]</div>
        <div>NOTHING OS TELEMETRY • TRACK LEVEL COMPANION</div>
      </div>
    </div>
  );
};
