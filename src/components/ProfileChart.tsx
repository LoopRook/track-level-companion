import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CalculatedStation, GradeMode, PrototypeStyle } from '../core/types';
import { formatFeetInches, formatMeasurement } from '../core/units';
import { calculateGradeInfo, calculateSubsetGrade, SubsetGradeInfo } from '../core/calculations';
import { Maximize2, Minimize2, Ruler, Download, Image as ImageIcon, Printer, ChevronDown } from 'lucide-react';

interface ProfileChartProps {
  stations: CalculatedStation[];
  gradeMode: GradeMode;
  targetGradePercent: number;
  onSelectStation: (station: CalculatedStation) => void;
  selectedStationId?: string | null;
  onApplyTargetGrade?: (gradePercent: number) => void;
  trackName?: string;
  onToggleMeasureMode?: (isActive: boolean) => void;
  onSubsetSpanChange?: () => void;
  prototypeStyle?: PrototypeStyle;
  isDarkMode?: boolean;
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
  gradeMode,
  targetGradePercent = 0.0,
  onSelectStation,
  selectedStationId,
  onApplyTargetGrade,
  trackName,
  onToggleMeasureMode,
  onSubsetSpanChange,
  prototypeStyle = 'original',
  isDarkMode,
}) => {
  const isDark = typeof isDarkMode === 'boolean'
    ? isDarkMode
    : typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : true;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Zoom: '3x' is default gentle view, 8x/15x are exaggerated
  const [zoomScale, setZoomScale] = useState<ZoomScale>('3x');
  const [isScrollable, setIsScrollable] = useState<boolean>(false);

  // Selected start & end station for subset evaluation / pinned inspection
  const [selectedStartId, setSelectedStartId] = useState<string | null>(selectedStationId || null);
  const [selectedEndId, setSelectedEndId] = useState<string | null>(null);
  const [openStationPicker, setOpenStationPicker] = useState<'start' | 'end' | null>(null);

  // Smooth hover tracking across the track
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  // Measure / Subset evaluation toolbar toggle
  const [isMeasureModeActive, setIsMeasureModeActive] = useState<boolean>(false);

  // Sync external selectedStationId (e.g. from table row click) if no range is locked
  useEffect(() => {
    if (selectedStationId && selectedStationId !== selectedStartId && !selectedEndId) {
      setSelectedStartId(selectedStationId);
    } else if (!selectedStationId && !isMeasureModeActive) {
      setSelectedStartId(null);
    }
  }, [selectedStationId, isMeasureModeActive]);

  // Reset measure mode when switching tracks or tutorials
  useEffect(() => {
    setIsMeasureModeActive(false);
    setSelectedStartId(null);
    setSelectedEndId(null);
    setOpenStationPicker(null);
  }, [trackName]);

  // Filter measured stations
  const measuredStations = useMemo(() => {
    return stations.filter(s => s.elevationInches !== null && s.targetElevationInches !== null);
  }, [stations]);

  // Calculate grade statistics and piecewise chord segments
  const gradeInfo = useMemo(() => {
    return calculateGradeInfo(stations, gradeMode, targetGradePercent);
  }, [stations, gradeMode, targetGradePercent]);

  // Active subset evaluation (locked range or live preview)
  const activeSubsetGrade = useMemo<SubsetGradeInfo | null>(() => {
    // 1. Locked range between selectedStartId and selectedEndId
    if (selectedStartId && selectedEndId && selectedStartId !== selectedEndId) {
      return calculateSubsetGrade(stations, selectedStartId, selectedEndId);
    }
    // 2. Live preview between selectedStartId and hoveredStationId
    if (selectedStartId && hoveredStationId && selectedStartId !== hoveredStationId) {
      return calculateSubsetGrade(stations, selectedStartId, hoveredStationId);
    }
    return null;
  }, [stations, selectedStartId, selectedEndId, hoveredStationId]);

  const isRangeLocked = Boolean(selectedStartId && selectedEndId && selectedStartId !== selectedEndId);

  // Single station to inspect if no subset is active
  const startStation = stations.find(s => s.id === selectedStartId) || null;
  const endStation = stations.find(s => s.id === selectedEndId) || null;
  const hoveredStation = stations.find(s => s.id === hoveredStationId) || null;
  const currentInspectStation = !activeSubsetGrade ? (hoveredStation || startStation || null) : null;

  // Mobile viewport detection for responsive coordinate system
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive Base Width & Height:
  // On mobile portrait (< 640px), a tighter viewBox (600px width) and taller height (220px)
  // yields an aspect ratio of ~2.7:1 instead of 6.67:1. This makes the SVG curve and dots >2.4x taller
  // and dramatically more readable and touch-friendly on phones.
  const baseWidth = isMobile ? 600 : 1200;

  // Chart Height: Constant physical canvas height across all zoom levels to prevent layout shifts.
  // Zooming adjusts the elevation calculation span window (Y-axis magnification), NOT the physical DOM height.
  const chartHeight = useMemo(() => {
    if (isMobile) {
      return 230;
    }
    return 180;
  }, [isMobile]);

  const padding = useMemo(() => {
    if (isMobile) {
      return { top: 20, right: 22, bottom: 28, left: 46 };
    }
    return { top: 25, right: 35, bottom: 34, left: 60 };
  }, [isMobile]);

  // Width
  const effectiveWidth = isScrollable ? Math.max(baseWidth, stations.length * (isMobile ? 55 : 60)) : baseWidth;
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

  // Vertical Extents (inches) - direct window scaling to make height differences noticeably taller
  const { minY, maxY, yTicks } = useMemo(() => {
    const vals: number[] = [0];
    measuredStations.forEach(s => {
      if (s.elevationInches !== null && !isNaN(s.elevationInches)) vals.push(s.elevationInches);
      if (s.targetElevationInches !== null && !isNaN(s.targetElevationInches)) {
        vals.push(s.targetElevationInches);
      }
    });

    const validVals = vals.filter(v => typeof v === 'number' && !isNaN(v));
    const rawMin = validVals.length > 0 ? Math.min(...validVals) : 0;
    const rawMax = validVals.length > 0 ? Math.max(...validVals) : 0;
    const actualSpan = Math.max(rawMax - rawMin, 0.0625);
    const center = (rawMax + rawMin) / 2;

    // Window span tuning:
    let spanMultiplier = 2.0;
    let minSpan = 6.0;

    if (zoomScale === '1x') {
      spanMultiplier = 4.0;
      minSpan = 16.0;
    } else if (zoomScale === '3x') {
      spanMultiplier = 2.0;
      minSpan = 6.0;
    } else if (zoomScale === '8x') {
      spanMultiplier = 1.33;
      minSpan = 1.75;
    } else if (zoomScale === '15x') {
      spanMultiplier = 1.08;
      minSpan = 0.5;
    }

    const span = Math.max(actualSpan * spanMultiplier, minSpan);
    const calcMinY = center - span / 2;
    const calcMaxY = center + span / 2;

    // Ticks
    const step = span > 16 ? 4.0 : span > 7 ? 2.0 : span > 3 ? 1.0 : span > 1.2 ? 0.5 : 0.25;
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
  }, [measuredStations, zoomScale]);

  // Coordinate transforms
  const getX = (distFt: number) => {
    if (maxX === minX) return padding.left + innerWidth / 2;
    return padding.left + ((distFt - minX) / (maxX - minX)) * innerWidth;
  };

  const getY = (elevInches: number) => {
    if (maxY === minY) return padding.top + innerHeight / 2;
    return padding.top + innerHeight - ((elevInches - minY) / (maxY - minY)) * innerHeight;
  };

  // Generate SVG path for actual rail profile (smooth Fritsch-Carlson monotone cubic spline)
  const actualPath = useMemo(() => {
    if (measuredStations.length < 2) return '';

    const pts = measuredStations.map(s => ({
      x: getX(s.distanceFt),
      y: getY(s.elevationInches!),
    }));

    return getSmoothSplinePath(pts);
  }, [measuredStations, minY, maxY, minX, maxX, innerWidth]);

  // Generate SVG area fill for liquid glass style
  const actualAreaPath = useMemo(() => {
    if (measuredStations.length < 2) return '';
    const pts = measuredStations.map(s => ({
      x: getX(s.distanceFt),
      y: getY(s.elevationInches!),
    }));
    const spline = getSmoothSplinePath(pts);
    const first = pts[0];
    const last = pts[pts.length - 1];
    const bottomY = padding.top + innerHeight;
    return `${spline} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [measuredStations, minY, maxY, minX, maxX, innerWidth, padding.top, innerHeight]);

  // Generate SVG path for target grade
  const targetPath = useMemo(() => {
    if (measuredStations.length < 2) return '';
    return measuredStations.reduce((acc, s, idx) => {
      const x = getX(s.distanceFt).toFixed(1);
      const y = getY(s.targetElevationInches!).toFixed(1);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [measuredStations, minY, maxY, minX, maxX, innerWidth]);

  // Helper to find closest station to an SVG X coordinate
  const getClosestStation = (svgX: number): CalculatedStation | null => {
    let closest: CalculatedStation | null = null;
    let minDist = Infinity;
    for (const s of stations) {
      const sx = getX(s.distanceFt);
      const dist = Math.abs(sx - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = s;
      }
    }
    return closest;
  };

  // Full-height column geometry for each station (guarantees 100% reliable tap/click targets on mobile & desktop)
  const stationColumns = useMemo(() => {
    if (stations.length === 0) return [];
    return stations.map((s, idx) => {
      const x = getX(s.distanceFt);
      const prevX = idx > 0 ? getX(stations[idx - 1].distanceFt) : padding.left;
      const nextX = idx < stations.length - 1 ? getX(stations[idx + 1].distanceFt) : effectiveWidth - padding.right;
      const left = idx === 0 ? padding.left : (prevX + x) / 2;
      const right = idx === stations.length - 1 ? effectiveWidth - padding.right : (x + nextX) / 2;
      const width = Math.max(right - left, 1);
      return {
        station: s,
        x,
        left,
        width,
      };
    });
  }, [stations, minX, maxX, innerWidth, effectiveWidth, padding.left, padding.right]);

  // Smooth mouse tracking across SVG canvas on desktop
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const screenX = e.clientX - rect.left;
    const svgX = (screenX / rect.width) * effectiveWidth;

    const closest = getClosestStation(svgX);
    if (closest) {
      const sx = getX(closest.distanceFt);
      if (Math.abs(sx - svgX) < 45) {
        if (hoveredStationId !== closest.id) {
          setHoveredStationId(closest.id);
        }
        return;
      }
    }
    if (hoveredStationId !== null) {
      setHoveredStationId(null);
    }
  };

  const handleSvgMouseLeave = () => {
    setHoveredStationId(null);
  };

  // Fallback click on SVG background: snaps to nearest station column
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const screenX = e.clientX - rect.left;
    const svgX = (screenX / rect.width) * effectiveWidth;
    const closest = getClosestStation(svgX);
    if (closest) {
      handleNodeClick(closest);
    }
  };

  // Station interaction: click/tap selects/evaluates range; double click opens keypad editor
  const handleNodeClick = (s: CalculatedStation) => {
    if (!selectedStartId) {
      setSelectedStartId(s.id);
      setSelectedEndId(null);
    } else if (selectedStartId === s.id && !selectedEndId) {
      // Clicking same single selected station deselects
      setSelectedStartId(null);
      setSelectedEndId(null);
    } else if (!selectedEndId) {
      // Lock range between start and clicked station
      setSelectedEndId(s.id);
    } else {
      // Range was locked, start fresh from clicked station
      setSelectedStartId(s.id);
      setSelectedEndId(null);
    }
  };

  const handleNodeDoubleClick = (s: CalculatedStation) => {
    onSelectStation(s);
  };

  const handleExportPng = () => {
    if (!svgRef.current) return;
    setIsExporting(true);
    try {
      const svgEl = svgRef.current;
      const viewBoxAttr = svgEl.getAttribute('viewBox');
      const vbParts = viewBoxAttr ? viewBoxAttr.split(' ').map(Number) : [0, 0, effectiveWidth, chartHeight];
      const svgWidth = vbParts[2] || effectiveWidth;
      const svgHeight = vbParts[3] || chartHeight;

      const clone = svgEl.cloneNode(true) as SVGSVGElement;

      // Inline computed styles from original SVG to ensure strokes, colors, and typography are preserved
      const origElements = svgEl.querySelectorAll('*');
      const cloneElements = clone.querySelectorAll('*');
      const cssProps = [
        'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
        'stroke-linejoin', 'fill', 'fill-opacity', 'opacity',
        'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline'
      ];

      for (let i = 0; i < origElements.length; i++) {
        const orig = origElements[i];
        const cln = cloneElements[i];
        if (orig && cln) {
          const computed = window.getComputedStyle(orig);
          for (const prop of cssProps) {
            const val = computed.getPropertyValue(prop);
            if (val && val !== 'none' && !cln.hasAttribute(prop)) {
              cln.setAttribute(prop, val);
            }
          }
        }
      }

      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clone);
      if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const canvas = document.createElement('canvas');
      const scaleFactor = 2; // High-res Hi-DPI
      const bannerHeight = 70;
      canvas.width = svgWidth * scaleFactor;
      canvas.height = (svgHeight + bannerHeight) * scaleFactor;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsExporting(false);
        return;
      }

      ctx.scale(scaleFactor, scaleFactor);

      // Match current dark/light mode
      const isDark = document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');
      ctx.fillStyle = isDark ? '#09090b' : '#ffffff';
      ctx.fillRect(0, 0, svgWidth, svgHeight + bannerHeight);

      // Header Title
      ctx.fillStyle = isDark ? '#f4f4f5' : '#18181b';
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.fillText(trackName || 'Track Vertical Profile', padding.left, 28);

      // Subtitle with stats and date
      ctx.font = '11px monospace';
      ctx.fillStyle = isDark ? '#a1a1aa' : '#71717a';
      const gradeStr = gradeInfo ? `Overall Grade: ${gradeInfo.overallGradePercent >= 0 ? '+' : ''}${gradeInfo.overallGradePercent.toFixed(2)}%` : '';
      const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      ctx.fillText(`${gradeStr}  •  ${measuredStations.length}/${stations.length} Shot  •  ${dateStr}`, padding.left, 48);

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        ctx.drawImage(img, 0, bannerHeight, svgWidth, svgHeight);
        URL.revokeObjectURL(url);

        const link = document.createElement('a');
        const safeName = (trackName || 'track-profile')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        link.download = `${safeName}-profile.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setIsExporting(false);
        setShowExportMenu(false);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      img.src = url;
    } catch (err) {
      console.error('Export PNG failed:', err);
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };

  return (
    <div
      data-tutorial="profile-chart"
      className="proto-card bg-white dark:bg-black md:border border-b border-zinc-200 dark:border-zinc-800 md:rounded-2xl md:shadow-sm overflow-hidden flex flex-col transition-colors mobile-edge-to-edge"
    >
      {/* Header Toolbar */}
      <div className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 bg-zinc-50 dark:bg-zinc-950">
        {/* Title and Shot Counter */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          {prototypeStyle === 'nothing' ? (
            <div className="w-2 h-2 rounded-full bg-[#D71921] shrink-0" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          )}
          <h3 className={`font-bold text-zinc-900 dark:text-zinc-100 text-sm whitespace-nowrap ${
            prototypeStyle === 'nothing' ? "font-['Space_Mono'] uppercase tracking-[0.08em] text-xs" : ''
          }`}>
            <span className="sm:hidden">{prototypeStyle === 'nothing' ? '[ PROFILE ]' : 'Track Profile'}</span>
            <span className="hidden sm:inline">{prototypeStyle === 'nothing' ? '[ TRACK VERTICAL PROFILE ]' : 'Track Vertical Profile'}</span>
          </h3>
          <span className={`text-[11px] ${
            prototypeStyle === 'nothing'
              ? 'bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-["Space_Mono"] uppercase tracking-wider px-2 py-0.5 rounded-md'
              : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 font-mono px-2 py-0.5 rounded-md'
          } whitespace-nowrap shrink-0`}>
            {measuredStations.length}/{stations.length} Shot
          </span>
          {gradeInfo && (
            <span
              className={`text-[11px] ${
                prototypeStyle === 'nothing'
                  ? 'bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-["Space_Mono"] uppercase tracking-wider px-2 py-0.5 rounded-md'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-md border border-emerald-500/25'
              } whitespace-nowrap shrink-0`}
              title={
                gradeMode === 'end_to_end'
                  ? `End-to-End net slope: ${gradeInfo.overallGradePercent >= 0 ? '+' : ''}${gradeInfo.overallGradePercent.toFixed(2)}% (${gradeInfo.segments.length} chords)`
                  : `Target Slope: ${gradeInfo.overallGradePercent >= 0 ? '+' : ''}${gradeInfo.overallGradePercent.toFixed(2)}%`
              }
            >
              {prototypeStyle === 'nothing'
                ? `[ ${gradeMode === 'end_to_end' ? 'NET' : 'GRADE'}: ${gradeInfo.overallGradePercent >= 0 ? '+' : ''}${gradeInfo.overallGradePercent.toFixed(2)}% ]`
                : `${gradeMode === 'end_to_end' ? 'End-to-End: ' : 'Grade: '}${gradeInfo.overallGradePercent >= 0 ? '+' : ''}${gradeInfo.overallGradePercent.toFixed(2)}%`}
              {gradeInfo.hasLockedPoints && prototypeStyle !== 'nothing' && <span className="hidden sm:inline"> ({gradeInfo.segments.length} chords)</span>}
            </span>
          )}
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Evaluate Grade / Subset Tool Button */}
          <button
            data-tutorial="evaluate-grade-btn"
            onClick={() => {
              const nextState = !isMeasureModeActive;
              setIsMeasureModeActive(nextState);
              if (nextState && !selectedStartId) {
                if (measuredStations.length >= 2) {
                  setSelectedStartId(measuredStations[0].id);
                  setSelectedEndId(measuredStations[measuredStations.length - 1].id);
                }
              }
              onToggleMeasureMode?.(nextState);
            }}
            className={`h-7.5 sm:h-7 flex items-center gap-1.5 px-2.5 text-xs font-bold transition active:scale-95 whitespace-nowrap shrink-0 ${
              prototypeStyle === 'nothing'
                ? isMeasureModeActive || isRangeLocked
                  ? 'bg-black text-white dark:bg-white dark:text-black font-["Space_Mono"] uppercase tracking-wider rounded-lg shadow-none'
                  : 'bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-900 dark:hover:border-zinc-400 font-["Space_Mono"] uppercase tracking-wider rounded-lg shadow-none'
                : isMeasureModeActive || isRangeLocked
                ? 'bg-sky-500 text-black shadow-sm rounded-lg'
                : 'bg-zinc-200/80 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 rounded-lg'
            }`}
            title="Evaluate grade, rise, and slope between any subset of stations"
          >
            <Ruler className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Evaluate Grade</span>
            <span className="sm:hidden">Grade</span>
            {isRangeLocked && activeSubsetGrade && (
              <span className={`${
                prototypeStyle === 'nothing'
                  ? 'bg-black/10 dark:bg-white/20 text-current px-1.5 py-0.2 rounded-md text-[10px] font-mono'
                  : 'bg-black/20 text-black px-1.5 py-0.2 rounded text-[10px] font-mono font-extrabold'
              }`}>
                {activeSubsetGrade.distanceFt}'
              </span>
            )}
          </button>

          {/* Vertical Zoom Sensitivity Buttons */}
          <div className={`h-7.5 sm:h-7 flex items-center p-0.5 shrink-0 ${
            prototypeStyle === 'nothing'
              ? 'bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg'
              : 'bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg'
          }`}>
            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold px-1.5 hidden md:inline font-mono">
              Vert:
            </span>
            {(['1x', '3x', '8x', '15x'] as ZoomScale[]).map(scale => (
              <button
                key={scale}
                onClick={() => setZoomScale(scale)}
                className={`h-full px-2 font-mono text-xs transition active:scale-95 flex items-center justify-center ${
                  prototypeStyle === 'nothing'
                    ? zoomScale === scale
                      ? 'bg-black text-white dark:bg-white dark:text-black font-bold rounded-md shadow-none font-["Space_Mono"]'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-md font-["Space_Mono"]'
                    : zoomScale === scale
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-amber-400 shadow-sm ring-1 ring-amber-400/50 rounded'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded'
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
            className={`h-7.5 sm:h-7 flex items-center gap-1 px-2.5 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
              prototypeStyle === 'nothing'
                ? 'rounded-lg bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-900 dark:hover:border-zinc-400 font-["Space_Mono"] uppercase tracking-wider shadow-none'
                : 'rounded-lg bg-zinc-200/80 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-800'
            }`}
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

          {/* Export / Print Dropdown Menu */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`h-7.5 sm:h-7 flex items-center gap-1 px-2.5 text-xs font-semibold transition active:scale-95 whitespace-nowrap ${
                prototypeStyle === 'nothing'
                  ? 'rounded-lg bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-900 dark:hover:border-zinc-400 font-["Space_Mono"] uppercase tracking-wider shadow-none'
                  : 'rounded-lg bg-zinc-200/80 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-800 shadow-xs'
              }`}
              title="Export PNG or print track profile chart"
            >
              <Download className={`w-3.5 h-3.5 stroke-[2.2] ${prototypeStyle === 'nothing' ? 'text-[#D71921]' : 'text-amber-500'}`} />
              <span className="text-[11px] hidden sm:inline">Export</span>
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-30 space-y-0.5 text-xs">
                  <button
                    type="button"
                    onClick={handleExportPng}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-medium"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{isExporting ? 'Exporting PNG...' : 'Save PNG Image'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-medium"
                  >
                    <Printer className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Print / PDF Field Sheet</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subset Grade Evaluator Bar (Nothing OS Custom Station Pickers) */}
      {isMeasureModeActive && (
        <div className={`px-3.5 py-2 border-b flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 transition-colors ${
          prototypeStyle === 'nothing'
            ? 'bg-zinc-50 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800'
            : 'bg-sky-500/10 dark:bg-sky-950/40 border-sky-500/20'
        }`}>
          <div className="flex items-center gap-2 flex-wrap font-mono">
            <span className={`font-bold flex items-center gap-1 ${
              prototypeStyle === 'nothing' ? 'text-zinc-900 dark:text-zinc-100 font-["Space_Mono"] uppercase tracking-wider' : 'text-sky-700 dark:text-sky-300'
            }`}>
              <Ruler className={`w-3.5 h-3.5 ${prototypeStyle === 'nothing' ? 'text-[#D71921]' : ''}`} />
              {prototypeStyle === 'nothing' ? '[ SUBSET ]' : 'Subset:'}
            </span>

            {/* Custom Nothing OS Station Pickers (replacing native <select> mobile wheel traps) */}
            <div className="flex items-center gap-1.5" data-tutorial="evaluate-grade-from">
              <span className={`text-[11px] ${prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-500 uppercase' : 'text-zinc-500 font-sans'}`}>
                From:
              </span>
              <button
                type="button"
                onClick={() => setOpenStationPicker('start')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition active:scale-95 flex items-center gap-1 cursor-pointer ${
                  prototypeStyle === 'nothing'
                    ? 'bg-white dark:bg-black border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-[#D71921] font-["Space_Mono"]'
                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                }`}
              >
                <span>
                  {startStation
                    ? `${startStation.distanceFt} ft`
                    : 'Select Start...'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] ${prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-500 uppercase' : 'text-zinc-500 font-sans'}`}>
                To:
              </span>
              <button
                type="button"
                onClick={() => setOpenStationPicker('end')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition active:scale-95 flex items-center gap-1 cursor-pointer ${
                  prototypeStyle === 'nothing'
                    ? 'bg-white dark:bg-black border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-[#D71921] font-["Space_Mono"]'
                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                }`}
              >
                <span>
                  {endStation
                    ? `${endStation.distanceFt} ft`
                    : 'Select End...'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            </div>

            {activeSubsetGrade && (
              <div data-tutorial="evaluate-grade-readout" className="flex items-center gap-2 flex-wrap">
                <span className="text-zinc-400 hidden sm:inline">|</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  Span: <strong className="text-zinc-900 dark:text-white">{activeSubsetGrade.distanceFt} ft</strong> ({activeSubsetGrade.stationCount} ties)
                </span>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  Rise/Fall:{' '}
                  <strong className="text-zinc-900 dark:text-white">
                    {activeSubsetGrade.elevationDiffInches >= 0 ? '+' : ''}
                    {formatMeasurement(activeSubsetGrade.elevationDiffInches, 'inches_fraction')}
                  </strong>
                </span>
                <span className="text-zinc-400">|</span>
                <span className={`font-bold px-2 py-0.5 rounded border ${
                  prototypeStyle === 'nothing'
                    ? 'bg-black text-white dark:bg-white dark:text-black border-zinc-700 dark:border-zinc-300 font-["Space_Mono"]'
                    : 'text-sky-700 dark:text-sky-300 bg-sky-500/15 border-sky-500/30'
                }`}>
                  Grade: {activeSubsetGrade.netGradePercent >= 0 ? '+' : ''}
                  {activeSubsetGrade.netGradePercent.toFixed(2)}%{' '}
                  {activeSubsetGrade.direction === 'uphill' ? '↗' : activeSubsetGrade.direction === 'downhill' ? '↘' : '→'}
                </span>
                {activeSubsetGrade.bestFitGradePercent !== null && (
                  <span className="text-zinc-500 text-[11px] hidden lg:inline">
                    (Best-Fit: {activeSubsetGrade.bestFitGradePercent >= 0 ? '+' : ''}
                    {activeSubsetGrade.bestFitGradePercent.toFixed(2)}%)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {activeSubsetGrade && onApplyTargetGrade && (
              <button
                data-tutorial="evaluate-grade-apply"
                onClick={() => onApplyTargetGrade(activeSubsetGrade.netGradePercent)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer ${
                  prototypeStyle === 'nothing'
                    ? 'bg-[#D71921] hover:bg-[#b01319] text-white font-["Space_Mono"] uppercase tracking-wider'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
                title={`Set target grade to ${activeSubsetGrade.netGradePercent.toFixed(2)}%`}
              >
                {prototypeStyle === 'nothing' ? '[ Apply as Target ]' : 'Apply as Target'}
              </button>
            )}
            <button
              onClick={() => {
                setSelectedStartId(null);
                setSelectedEndId(null);
                setIsMeasureModeActive(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer ${
                prototypeStyle === 'nothing'
                  ? 'border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white font-["Space_Mono"] uppercase'
                  : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {prototypeStyle === 'nothing' ? '[ Reset ]' : 'Reset'}
            </button>
          </div>
        </div>
      )}

      {/* Nothing OS Custom Station Picker Modal / Sheet */}
      {openStationPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overscroll-none"
          onClick={() => setOpenStationPicker(null)}
        >
          <div
            className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[75vh] font-['Space_Mono']"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D71921]" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                  [ SELECT {openStationPicker === 'start' ? 'START' : 'END'} STATION ]
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenStationPicker(null)}
                className="px-2.5 py-1 text-xs font-bold uppercase rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-[#D71921] hover:text-[#D71921] transition active:scale-95 cursor-pointer"
              >
                [ Close ]
              </button>
            </div>
            <div className="p-2 overflow-y-auto modal-scroll-container space-y-1 divide-y divide-zinc-100 dark:divide-zinc-900">
              {stations.map((s) => {
                const isSelected = openStationPicker === 'start' ? selectedStartId === s.id : selectedEndId === s.id;
                return (
                  <button
                    key={`picker-${s.id}`}
                    type="button"
                    onClick={() => {
                      if (openStationPicker === 'start') {
                        setSelectedStartId(s.id);
                      } else {
                        setSelectedEndId(s.id);
                      }
                      onSubsetSpanChange?.();
                      setOpenStationPicker(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-mono transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#D71921] text-white font-bold'
                        : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-['Space_Mono']">Station {s.distanceFt} ft</span>
                      {s.elevationInches !== null && (
                        <span className={`text-[11px] ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
                          ({formatMeasurement(s.elevationInches, 'inches_fraction')})
                        </span>
                      )}
                    </div>
                    {isSelected && <span className="text-[10px] font-bold uppercase tracking-wider font-['Space_Mono']">[ Selected ]</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Selected Station Banner / Active Readout - Persistent height prevents SVG layout shifts */}
      {!isMeasureModeActive && (
        <div className="min-h-[36px] px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2 transition-colors">
          {activeSubsetGrade ? (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
                <span className={`font-bold px-2 py-0.5 rounded-md text-xs whitespace-nowrap shrink-0 ${
                  isRangeLocked ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                }`}>
                  {isRangeLocked ? 'SUBSET EVALUATION' : 'SUBSET PREVIEW'}: {activeSubsetGrade.startStation.distanceFt}' → {activeSubsetGrade.endStation.distanceFt}'
                </span>
                <span className="text-zinc-400 hidden sm:inline">|</span>
                <span className="text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  Span: <strong>{activeSubsetGrade.distanceFt} ft</strong> ({activeSubsetGrade.stationCount} ties)
                </span>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  Rise/Fall:{' '}
                  <strong>
                    {activeSubsetGrade.elevationDiffInches >= 0 ? '+' : ''}
                    {formatMeasurement(activeSubsetGrade.elevationDiffInches, 'inches_fraction')}
                  </strong>
                </span>
                <span className="text-zinc-400">|</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${
                  isRangeLocked
                    ? 'bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400'
                }`}>
                  Net Grade: {activeSubsetGrade.netGradePercent >= 0 ? '+' : ''}
                  {activeSubsetGrade.netGradePercent.toFixed(2)}%{' '}
                  {activeSubsetGrade.direction === 'uphill' ? '↗' : activeSubsetGrade.direction === 'downhill' ? '↘' : '→'}
                </span>
              </div>

              <div className="flex items-center gap-2 font-sans font-bold self-end sm:self-auto shrink-0">
                {isRangeLocked ? (
                  <>
                    {onApplyTargetGrade && (
                      <button
                        onClick={() => onApplyTargetGrade(activeSubsetGrade.netGradePercent)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 shadow-sm whitespace-nowrap shrink-0"
                      >
                        Apply as Target
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedStartId(null);
                        setSelectedEndId(null);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold transition active:scale-95 whitespace-nowrap shrink-0"
                    >
                      Clear Range
                    </button>
                  </>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs italic font-sans whitespace-nowrap">
                    Tap to lock range
                  </span>
                )}
              </div>
            </>
          ) : currentInspectStation ? (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
                <span className="font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  Station {currentInspectStation.distanceFt} ft
                </span>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  Reading:{' '}
                  {currentInspectStation.readingInches !== null
                    ? formatFeetInches(currentInspectStation.readingInches)
                    : 'Need shot'}
                </span>
                <span className="text-zinc-400 hidden sm:inline">|</span>
                <span className="text-zinc-500 hidden sm:inline whitespace-nowrap">
                  Elev: {formatMeasurement(currentInspectStation.elevationInches, 'inches_fraction')}
                </span>

                {/* Mobile guidance when 1 station is selected AND measure mode is active */}
                {isMeasureModeActive && selectedStartId && !selectedEndId && (
                  <span className="text-[11px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-sans font-semibold px-2 py-0.5 rounded-md border border-amber-500/25 animate-pulse whitespace-nowrap shrink-0">
                    <span className="hidden xs:inline">Tap 2nd station for grade</span>
                    <span className="xs:hidden">Tap 2nd station</span>
                  </span>
                )}

                {gradeInfo && (
                  <>
                    <span className="text-zinc-400 hidden md:inline">|</span>
                    <span className="text-emerald-600 dark:text-emerald-400 hidden md:inline font-bold whitespace-nowrap">
                      Grade:{' '}
                      {(() => {
                        const activeSeg = gradeInfo.segments.find(
                          seg => currentInspectStation.distanceFt >= seg.startDistanceFt && currentInspectStation.distanceFt <= seg.endDistanceFt
                        ) || gradeInfo.segments[0];
                        return activeSeg
                          ? `${activeSeg.gradePercent >= 0 ? '+' : ''}${activeSeg.gradePercent.toFixed(2)}%`
                          : `${gradeInfo.overallGradePercent >= 0 ? '+' : ''}${gradeInfo.overallGradePercent.toFixed(2)}%`;
                      })()}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 font-sans font-bold self-end sm:self-auto shrink-0">
                {currentInspectStation.completed && (
                  <span className={`text-xs px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    prototypeStyle === 'nothing'
                      ? 'text-[#4A9E5C] border border-[#4A9E5C] font-["Space_Mono"]'
                      : 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                  }`}>
                    ✓ LEVELED
                  </span>
                )}
                {currentInspectStation.isLocked ? (
                  <span className={`text-xs flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    prototypeStyle === 'nothing'
                      ? 'text-zinc-900 dark:text-white font-["Space_Mono"]'
                      : 'text-amber-800 dark:text-amber-400'
                  }`}>
                    🔒 LOCKED
                  </span>
                ) : (
                  <>
                    {currentInspectStation.action === 'ok' && (
                      <span className={`text-xs whitespace-nowrap shrink-0 ${
                        prototypeStyle === 'nothing'
                          ? 'text-[#4A9E5C] font-["Space_Mono"]'
                          : 'text-emerald-700 dark:text-emerald-400 font-sans'
                      }`}>
                        {currentInspectStation.actionText === 'DATUM (REF)' ? 'DATUM (REF)' : '✓ ON GRADE'}
                      </span>
                    )}
                    {currentInspectStation.action === 'lift' && (
                      <span className={`text-xs whitespace-nowrap shrink-0 ${
                        prototypeStyle === 'nothing'
                          ? 'text-[#5B9BF6] font-["Space_Mono"]'
                          : 'text-sky-700 dark:text-sky-400 font-sans'
                      }`}>▲ {currentInspectStation.actionText}</span>
                    )}
                    {currentInspectStation.action === 'lower' && (
                      <span className={`text-xs whitespace-nowrap shrink-0 ${
                        prototypeStyle === 'nothing'
                          ? 'text-[#D4A843] font-["Space_Mono"]'
                          : 'text-amber-800 dark:text-amber-400 font-sans'
                      }`}>▼ {currentInspectStation.actionText}</span>
                    )}
                  </>
                )}
                <button
                  onClick={() => onSelectStation(currentInspectStation)}
                  className={`px-3 py-1 text-xs font-bold transition active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    prototypeStyle === 'nothing'
                      ? 'bg-black text-white dark:bg-white dark:text-black font-["Space_Mono"] uppercase tracking-wider rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200'
                      : 'bg-amber-500 text-black rounded-lg shadow-sm hover:bg-amber-400'
                  }`}
                >
                  {prototypeStyle === 'nothing' ? '[ EDIT ]' : '✏️ Edit'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-sans">
              <span className="inline-block w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
              <span>Tap a station to inspect. Tap two stations to evaluate the grade between them.</span>
            </div>
          )}
        </div>
      )}

      {/* Unified SVG Canvas Container */}
      <div
        className={`w-full ${isScrollable ? 'overflow-x-auto scrollbar-thin' : ''} ${
          prototypeStyle === 'nothing' ? 'bg-[#FFFFFF] dark:bg-[#000000]' : 'bg-zinc-50/50 dark:bg-black'
        } select-none`}
        style={{ WebkitOverflowScrolling: 'touch', touchAction: isScrollable ? 'pan-x pan-y' : 'pan-y' }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${effectiveWidth} ${chartHeight}`}
          className={`block ${isScrollable ? '' : 'w-full'} h-auto`}
          style={{
            minWidth: isScrollable ? `${effectiveWidth}px` : undefined,
            touchAction: isScrollable ? 'pan-x pan-y' : 'pan-y',
          }}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
          onClick={handleSvgClick}
        >
          <defs>
            {/* Phosphor HUD Glow for Cockpit */}
            <filter id="cockpitGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Translucent Prismatic Area Gradient for Liquid Glass (Original) */}
            <linearGradient id="glassAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>

            {/* Puffy Clay Soft Pastel Area Gradient for Claymorphism */}
            <linearGradient id="clayAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#a855f7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>

            {/* Clay Drop Shadow for Volumetric Line */}
            <filter id="claymorphismDropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.35" floodColor="#4338ca" />
            </filter>

            {/* Dot Matrix Grid Backdrop for Nothing OS (16px pitch, matching index.css) */}
            <pattern id="nothingDotGrid" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="0.9" fill={isDark ? '#2a2a2a' : '#b8b8b8'} />
            </pattern>

            {/* Nothing OS "Smoked Glass" (Translucent Polycarbonate) Monochromatic Gradient */}
            <linearGradient id="nothingSmokedGlassGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDark ? '#FFFFFF' : '#000000'} stopOpacity={isDark ? 0.16 : 0.07} />
              <stop offset="35%" stopColor={isDark ? '#FFFFFF' : '#000000'} stopOpacity={isDark ? 0.06 : 0.02} />
              <stop offset="100%" stopColor={isDark ? '#FFFFFF' : '#000000'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Nothing OS Dot Matrix Grid Backdrop */}
          {prototypeStyle === 'nothing' && (
            <rect
              x={padding.left}
              y={padding.top}
              width={innerWidth}
              height={innerHeight}
              fill="url(#nothingDotGrid)"
              className="pointer-events-none"
            />
          )}

          {/* Nothing OS Smoked Glass Area Fill (Exposes dot matrix through translucent acrylic) */}
          {prototypeStyle === 'nothing' && actualAreaPath && (
            <path
              d={actualAreaPath}
              fill="url(#nothingSmokedGlassGrad)"
              className="pointer-events-none transition-all duration-300"
            />
          )}

          {/* Liquid Glass (Original) Area Gradient Fill */}
          {prototypeStyle === 'glass' && actualAreaPath && (
            <path
              d={actualAreaPath}
              fill="url(#glassAreaGrad)"
              className="pointer-events-none transition-all duration-300"
            />
          )}

          {/* Claymorphism Area Gradient Fill */}
          {prototypeStyle === 'claymorphism' && actualAreaPath && (
            <path
              d={actualAreaPath}
              fill="url(#clayAreaGrad)"
              className="pointer-events-none transition-all duration-300"
            />
          )}

          {/* Shaded Range Region for Subset Grade Evaluation */}
          {activeSubsetGrade && (
            <rect
              x={getX(activeSubsetGrade.startStation.distanceFt)}
              y={padding.top}
              width={Math.max(2, getX(activeSubsetGrade.endStation.distanceFt) - getX(activeSubsetGrade.startStation.distanceFt))}
              height={innerHeight}
              className={isRangeLocked ? "fill-sky-500/10 dark:fill-sky-400/10 pointer-events-none" : "fill-amber-500/10 dark:fill-amber-400/10 pointer-events-none"}
            />
          )}

          {/* Background Grid Lines (Y-Ticks) */}
          {yTicks.map(t => {
            const y = getY(t.val);
            const isZero = Math.abs(t.val) < 0.001;

            if (prototypeStyle === 'nothing') {
              // In Nothing OS: Only draw zero datum reference line. Do NOT draw dashed lines over dots.
              return (
                <g key={t.val}>
                  {isZero && (
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={effectiveWidth - padding.right}
                      y2={y}
                      stroke={isDark ? '#333333' : '#cccccc'}
                      strokeWidth="1"
                    />
                  )}
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
            }

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
          {stations.map((s, idx) => {
            const x = getX(s.distanceFt);
            const isStart = selectedStartId === s.id;
            const isEnd = selectedEndId === s.id;
            const isHovered = hoveredStationId === s.id;
            const isSelected = isStart || isEnd;
            const isInRange = activeSubsetGrade &&
              s.distanceFt >= activeSubsetGrade.startStation.distanceFt &&
              s.distanceFt <= activeSubsetGrade.endStation.distanceFt;

            // In mobile fit mode, skip crowded intermediate labels if stations > 18 to avoid overlaps
            const showLabel = !isMobile || isScrollable || stations.length <= 18 || idx % Math.ceil(stations.length / 16) === 0 || isSelected || idx === stations.length - 1;

            if (prototypeStyle === 'nothing') {
              // In Nothing OS: Pure clean coordinate space.
              // No vertical dashed lines across the whole canvas!
              // Ticks at bottom axis line + Space Mono labels.
              // Selected station gets a razor-sharp Nothing signal red (#D71921) vertical cursor line.
              return (
                <g key={s.id}>
                  {/* Axis tick mark */}
                  <line
                    x1={x}
                    y1={padding.top + innerHeight}
                    x2={x}
                    y2={padding.top + innerHeight + 4}
                    stroke={isDark ? '#333333' : '#cccccc'}
                    strokeWidth="1"
                  />
                  {isSelected && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + innerHeight}
                      stroke={isMeasureModeActive ? (isDark ? '#5B9BF6' : '#1D4ED8') : (isDark ? '#FFFFFF' : '#000000')}
                      strokeWidth="1.2"
                      strokeDasharray={isMeasureModeActive ? undefined : '2,2'}
                    />
                  )}
                  {isHovered && !isSelected && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + innerHeight}
                      stroke={isDark ? '#555555' : '#aaaaaa'}
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  )}
                  {showLabel && (
                    <text
                      x={x}
                      y={padding.top + innerHeight + (isMobile ? 16 : 18)}
                      textAnchor="middle"
                      className={`font-mono ${isMobile ? 'text-[10px]' : 'text-[11px]'} ${
                        isSelected
                          ? isMeasureModeActive
                            ? isDark ? 'fill-[#5B9BF6] font-bold' : 'fill-[#1D4ED8] font-bold'
                            : 'fill-[#D71921] font-bold'
                          : isHovered
                          ? isDark ? 'fill-zinc-300 font-bold' : 'fill-zinc-800 font-bold'
                          : isDark ? 'fill-zinc-500 font-normal' : 'fill-zinc-600 font-normal'
                      }`}
                    >
                      {s.distanceFt}'
                    </text>
                  )}
                </g>
              );
            }

            let lineClass = 'stroke-zinc-200 dark:stroke-zinc-800/60 stroke-1';
            let strokeDash: string | undefined = '2,2';
            let textClass = 'fill-zinc-600 dark:fill-zinc-400 font-bold';

            if (isStart) {
              lineClass = 'stroke-amber-400 dark:stroke-amber-400 stroke-[2]';
              strokeDash = undefined;
              textClass = 'fill-amber-600 dark:fill-amber-400 font-extrabold';
            } else if (isEnd) {
              lineClass = 'stroke-sky-400 dark:stroke-sky-400 stroke-[2]';
              strokeDash = undefined;
              textClass = 'fill-sky-600 dark:fill-sky-400 font-extrabold';
            } else if (isHovered) {
              lineClass = 'stroke-amber-400/80 dark:stroke-amber-400/80 stroke-[1.5]';
              strokeDash = '3,3';
              textClass = 'fill-amber-600 dark:fill-amber-400 font-bold';
            } else if (isInRange) {
              lineClass = isRangeLocked ? 'stroke-sky-300/40 dark:stroke-sky-700/40 stroke-1' : 'stroke-zinc-300 dark:stroke-zinc-700/60 stroke-1';
            }

            return (
              <g key={s.id}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + innerHeight}
                  className={lineClass}
                  strokeDasharray={strokeDash}
                />
                {showLabel && (
                  <text
                    x={x}
                    y={padding.top + innerHeight + (isMobile ? 16 : 18)}
                    textAnchor="middle"
                    className={`font-mono ${isMobile ? 'text-[10px]' : 'text-[11px]'} ${textClass}`}
                  >
                    {s.distanceFt}'
                  </text>
                )}
              </g>
            );
          })}

          {/* Target Grade Line (Green dashed reference plane) */}
          {targetPath && (
            <path
              d={targetPath}
              fill="none"
              className={
                prototypeStyle === 'cockpit'
                  ? 'stroke-emerald-400 stroke-2'
                  : prototypeStyle === 'glass'
                  ? 'stroke-cyan-400 stroke-2'
                  : prototypeStyle === 'swiss'
                  ? 'stroke-black dark:stroke-white stroke-[1.5]'
                  : prototypeStyle === 'claymorphism'
                  ? 'stroke-emerald-500 stroke-2'
                  : prototypeStyle === 'nothing'
                  ? 'stroke-[#4A9E5C] stroke-2'
                  : 'stroke-emerald-500 dark:stroke-emerald-400 stroke-2'
              }
              strokeDasharray={prototypeStyle === 'swiss' ? '3,3' : '6,4'}
            />
          )}

          {/* Actual Rail Line */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              className={
                prototypeStyle === 'cockpit'
                  ? 'stroke-amber-400 stroke-[3.5]'
                  : prototypeStyle === 'glass'
                  ? 'stroke-purple-400 dark:stroke-purple-300 stroke-[3.5]'
                  : prototypeStyle === 'swiss'
                  ? 'stroke-[#eb0000] stroke-[3.5]'
                  : prototypeStyle === 'claymorphism'
                  ? 'stroke-[#6366f1] dark:stroke-[#818cf8] stroke-[4]'
                  : prototypeStyle === 'nothing'
                  ? 'stroke-black dark:stroke-white stroke-[2.2]'
                  : 'stroke-zinc-900 dark:stroke-white stroke-[3.5]'
              }
              filter={
                prototypeStyle === 'cockpit'
                  ? 'url(#cockpitGlow)'
                  : prototypeStyle === 'claymorphism'
                  ? 'url(#claymorphismDropShadow)'
                  : undefined
              }
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Reference Chord Line between Subset Stations */}
          {activeSubsetGrade && activeSubsetGrade.startStation.elevationInches !== null && activeSubsetGrade.endStation.elevationInches !== null && (
            <line
              x1={getX(activeSubsetGrade.startStation.distanceFt)}
              y1={getY(activeSubsetGrade.startStation.elevationInches)}
              x2={getX(activeSubsetGrade.endStation.distanceFt)}
              y2={getY(activeSubsetGrade.endStation.elevationInches)}
              stroke={
                prototypeStyle === 'nothing'
                  ? isDark ? '#5B9BF6' : '#1D4ED8'
                  : isRangeLocked ? "#38bdf8" : "#f59e0b"
              }
              strokeWidth={prototypeStyle === 'nothing' ? '2' : '2.5'}
              strokeDasharray={isRangeLocked ? "5,3" : "3,3"}
              className="pointer-events-none select-none"
            />
          )}

          {/* Intelligent Collision-Free Badges for Target Grade & Subset Chord */}
          {(() => {
            // 1. Gather Subset Chord Badge Data
            let chordBadge: {
              x: number;
              y: number;
              midX: number;
              midY: number;
              width: number;
              height: number;
              text: string;
            } | null = null;

            if (
              activeSubsetGrade &&
              activeSubsetGrade.startStation.elevationInches !== null &&
              activeSubsetGrade.endStation.elevationInches !== null
            ) {
              const cx1 = getX(activeSubsetGrade.startStation.distanceFt);
              const cy1 = getY(activeSubsetGrade.startStation.elevationInches);
              const cx2 = getX(activeSubsetGrade.endStation.distanceFt);
              const cy2 = getY(activeSubsetGrade.endStation.elevationInches);
              const cmidX = (cx1 + cx2) / 2;
              const cmidY = (cy1 + cy2) / 2;
              const sign = activeSubsetGrade.netGradePercent > 0.001 ? '+' : '';
              const arrow = activeSubsetGrade.direction === 'uphill' ? '↗' : activeSubsetGrade.direction === 'downhill' ? '↘' : '→';
              const text = `${sign}${activeSubsetGrade.netGradePercent.toFixed(2)}% (${activeSubsetGrade.distanceFt}') ${arrow}`;
              const width = text.length * 6.8 + 14;
              const height = 18;
              const defaultY = Math.max(padding.top + 4, Math.min(padding.top + innerHeight - 22, cmidY - 14));

              chordBadge = {
                x: cmidX,
                y: defaultY,
                midX: cmidX,
                midY: cmidY,
                width,
                height,
                text,
              };
            }

            // 2. Gather Target Grade Segment Badges & Check Collisions
            const targetBadgesList: {
              key: string;
              text: string;
              x: number;
              y: number;
              width: number;
              height: number;
            }[] = [];

            if (gradeInfo) {
              gradeInfo.segments.forEach((seg, idx) => {
                const x1 = getX(seg.startDistanceFt);
                const x2 = getX(seg.endDistanceFt);
                const y1 = getY(seg.startElevInches);
                const y2 = getY(seg.endElevInches);
                if (x2 - x1 < 35) return;

                const sign = seg.gradePercent > 0.001 ? '+' : '';
                const arrow = seg.gradePercent > 0.05 ? '↗' : seg.gradePercent < -0.05 ? '↘' : '→';
                const labelText = gradeMode === 'end_to_end' && gradeInfo.hasLockedPoints
                  ? `${sign}${seg.gradePercent.toFixed(2)}% ${arrow}`
                  : `${sign}${seg.gradePercent.toFixed(2)}% Grade ${arrow}`;

                const width = labelText.length * 6.8 + 12;
                const height = 17;
                let targetX = (x1 + x2) / 2;
                const targetMidY = (y1 + y2) / 2;
                let targetY = Math.max(padding.top + 4, Math.min(padding.top + innerHeight - 20, targetMidY - 18));

                // Collision Detection with Chord Badge
                if (chordBadge) {
                  const isXOverlap = Math.abs(chordBadge.midX - targetX) < (chordBadge.width + width) / 2 + 10;
                  if (isXOverlap) {
                    // Tier 1: Vertical Polarity Separation
                    // Whichever line is physically higher on screen (smaller SVG Y) gets its badge placed ABOVE.
                    // The other line gets its badge placed BELOW.
                    if (targetMidY <= chordBadge.midY) {
                      // Target line is higher (or equal):
                      targetY = Math.max(padding.top + 4, targetMidY - height - 4);
                      chordBadge.y = Math.min(padding.top + innerHeight - chordBadge.height - 4, chordBadge.midY + 7);
                    } else {
                      // Chord line is higher:
                      chordBadge.y = Math.max(padding.top + 4, chordBadge.midY - chordBadge.height - 4);
                      targetY = Math.min(padding.top + innerHeight - height - 4, targetMidY + 7);
                    }

                    // Tier 2: Horizontal Fallback Repulsion
                    // If vertical distance between badges is still too close:
                    const isStillYOverlap = Math.abs(targetY - chordBadge.y) < height + 4;
                    if (isStillYOverlap) {
                      // Nudge target grade badge horizontally along its segment away from chord badge
                      if (chordBadge.midX >= (x1 + x2) / 2) {
                        targetX = x1 + (x2 - x1) * 0.25;
                      } else {
                        targetX = x1 + (x2 - x1) * 0.75;
                      }
                      const t = (targetX - x1) / (x2 - x1);
                      const newTargetMidY = y1 + t * (y2 - y1);
                      targetY = Math.max(padding.top + 4, Math.min(padding.top + innerHeight - 20, newTargetMidY - 18));
                    }
                  }
                }

                targetBadgesList.push({
                  key: `grade-seg-${idx}`,
                  text: labelText,
                  x: targetX,
                  y: targetY,
                  width,
                  height,
                });
              });
            }

            return (
              <g className="pointer-events-none select-none">
                {/* Target Grade Badges */}
                {targetBadgesList.map(tb => (
                  <g key={tb.key}>
                    <rect
                      x={tb.x - tb.width / 2}
                      y={tb.y}
                      width={tb.width}
                      height={tb.height}
                      rx={prototypeStyle === 'nothing' ? 3 : 4.5}
                      className={
                        prototypeStyle === 'nothing'
                          ? isDark
                            ? 'fill-black stroke-[#4A9E5C] stroke-[1.2]'
                            : 'fill-white stroke-[#4A9E5C] stroke-[1.2]'
                          : 'fill-white/95 dark:fill-zinc-900/95 stroke-emerald-500/70 dark:stroke-emerald-400/80 stroke-[1.2]'
                      }
                    />
                    <text
                      x={tb.x}
                      y={tb.y + 11.5}
                      textAnchor="middle"
                      className={
                        prototypeStyle === 'nothing'
                          ? 'font-mono text-[9.5px] font-bold fill-[#4A9E5C]'
                          : 'font-mono text-[9.5px] font-extrabold fill-emerald-700 dark:fill-emerald-300'
                      }
                    >
                      {tb.text}
                    </text>
                  </g>
                ))}

                {/* Subset Chord Badge */}
                {chordBadge && (
                  <g>
                    <rect
                      x={chordBadge.x - chordBadge.width / 2}
                      y={chordBadge.y}
                      width={chordBadge.width}
                      height={chordBadge.height}
                      rx={prototypeStyle === 'nothing' ? 3 : 5}
                      className={
                        prototypeStyle === 'nothing'
                          ? isDark
                            ? 'fill-black stroke-[#5B9BF6] stroke-[1.2]'
                            : 'fill-white stroke-[#1D4ED8] stroke-[1.2]'
                          : isRangeLocked
                          ? 'fill-sky-950/95 stroke-sky-400 stroke-[1.5]'
                          : 'fill-amber-950/95 stroke-amber-400 stroke-[1.5]'
                      }
                    />
                    <text
                      x={chordBadge.x}
                      y={chordBadge.y + 12.5}
                      textAnchor="middle"
                      className={
                        prototypeStyle === 'nothing'
                          ? isDark
                            ? 'font-mono text-[9.5px] font-bold fill-[#5B9BF6]'
                            : 'font-mono text-[9.5px] font-bold fill-[#1D4ED8]'
                          : isRangeLocked
                          ? 'font-mono text-[10px] font-extrabold fill-sky-300'
                          : 'font-mono text-[10px] font-extrabold fill-amber-300'
                      }
                    >
                      {chordBadge.text}
                    </text>
                  </g>
                )}
              </g>
            );
          })()}

          {/* Full-Height Column Hit Targets (Guarantees 100% reliable tap/click coverage from top to bottom on mobile & desktop) */}
          {stationColumns.map(col => (
            <rect
              key={`col-hit-${col.station.id}`}
              x={col.left}
              y={0}
              width={col.width}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer active:fill-amber-500/10"
              pointerEvents="all"
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(col.station);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleNodeDoubleClick(col.station);
              }}
            />
          ))}

          {/* Station Markers / Interactive Points */}
          {stations.map(s => {
            const x = getX(s.distanceFt);
            const isMeasured = s.elevationInches !== null;
            const y = isMeasured ? getY(s.elevationInches!) : padding.top + innerHeight / 2;
            const isStart = selectedStartId === s.id;
            const isEnd = selectedEndId === s.id;
            const isHovered = hoveredStationId === s.id;
            const isSelected = isStart || isEnd;

            let dotFill = '#52525b'; // zinc-600 unmeasured
            if (isMeasured) {
              if (s.action === 'ok') dotFill = '#10b981'; // green
              else if (s.action === 'lift') dotFill = '#38bdf8'; // sky blue
              else if (s.action === 'lower') dotFill = '#f59e0b'; // amber
            }

            if (prototypeStyle === 'nothing') {
              const nothingPipFill = !isMeasured
                ? 'none'
                : s.action === 'ok'
                ? '#4A9E5C'
                : s.action === 'lift'
                ? (isDark ? '#5B9BF6' : '#007AFF')
                : s.action === 'lower'
                ? '#D4A843'
                : (isDark ? '#FFFFFF' : '#000000');

              return (
                <g key={s.id} className="pointer-events-none select-none">
                  {/* Turning Point (Survey Benchmark Diamond) */}
                  {s.isTurningPoint && (
                    <polygon
                      points={`${x},${y - 7} ${x + 7},${y} ${x},${y + 7} ${x - 7},${y}`}
                      fill="none"
                      stroke="#D71921"
                      strokeWidth="1.4"
                    />
                  )}

                  {/* Locked Tie (Precision Mechanical Square) */}
                  {s.isLocked && (
                    <rect
                      x={x - 6}
                      y={y - 6}
                      width={12}
                      height={12}
                      fill="none"
                      stroke={isDark ? '#FFFFFF' : '#000000'}
                      strokeWidth="1.4"
                    />
                  )}

                  {/* Completed / Leveled Concentric Ring */}
                  {s.completed && (
                    <circle
                      cx={x}
                      cy={y}
                      r={7}
                      fill="none"
                      stroke="#4A9E5C"
                      strokeWidth="1.2"
                    />
                  )}

                  {/* Hover Hairline Reticle */}
                  {isHovered && !isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={8}
                      fill="none"
                      stroke={isDark ? '#888888' : '#555555'}
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  )}

                  {/* Selected Hairline Reticle */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={9}
                      fill="none"
                      stroke={isMeasureModeActive ? (isDark ? '#5B9BF6' : '#1D4ED8') : (isDark ? '#FFFFFF' : '#000000')}
                      strokeWidth="1.2"
                    />
                  )}

                  {/* Pip Core */}
                  {!isMeasured ? (
                    <circle
                      cx={x}
                      cy={y}
                      r={3}
                      fill="none"
                      stroke={isDark ? '#555555' : '#888888'}
                      strokeWidth="1.2"
                    />
                  ) : (
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 4.5 : isHovered ? 4 : 3.5}
                      fill={isMeasureModeActive && isSelected ? (isDark ? '#5B9BF6' : '#1D4ED8') : nothingPipFill}
                      stroke={isSelected ? (isDark ? '#000000' : '#FFFFFF') : (isDark ? '#000000' : '#FFFFFF')}
                      strokeWidth={1}
                    />
                  )}

                  {/* Measure Mode Badges [ A ] and [ B ] */}
                  {isMeasureModeActive && isStart && (
                    <g transform={`translate(${x}, ${y - 15})`}>
                      <rect
                        x={-9}
                        y={-8}
                        width={18}
                        height={14}
                        fill={isDark ? '#FFFFFF' : '#000000'}
                        rx={2}
                      />
                      <text
                        x={0}
                        y={2.5}
                        textAnchor="middle"
                        fill={isDark ? '#000000' : '#FFFFFF'}
                        fontSize="9"
                        fontFamily="Space Mono, monospace"
                        fontWeight="bold"
                      >
                        A
                      </text>
                    </g>
                  )}
                  {isMeasureModeActive && isEnd && (
                    <g transform={`translate(${x}, ${y - 15})`}>
                      <rect
                        x={-9}
                        y={-8}
                        width={18}
                        height={14}
                        fill={isDark ? '#5B9BF6' : '#007AFF'}
                        rx={2}
                      />
                      <text
                        x={0}
                        y={2.5}
                        textAnchor="middle"
                        fill={isDark ? '#000000' : '#FFFFFF'}
                        fontSize="9"
                        fontFamily="Space Mono, monospace"
                        fontWeight="bold"
                      >
                        B
                      </text>
                    </g>
                  )}
                </g>
              );
            }

            return (
              <g
                key={s.id}
                className="pointer-events-none"
              >
                {/* Hover halo ring */}
                {isHovered && !isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isMobile ? 16 : 14}
                    fill={dotFill}
                    fillOpacity={0.22}
                    stroke={dotFill}
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                )}

                {/* Start Station selection ring */}
                {isStart && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isMobile ? 13 : 11}
                    fill="#f59e0b"
                    fillOpacity={0.25}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}

                {/* End Station selection ring */}
                {isEnd && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isMobile ? 13 : 11}
                    fill="#38bdf8"
                    fillOpacity={0.25}
                    stroke="#38bdf8"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}

                {/* Turning Point (Benchmark) ring */}
                {s.isTurningPoint && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isMobile ? 12 : 10}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeDasharray="2,2"
                  />
                )}

                {/* Locked Tie (Root / Fixed Point) ring */}
                {s.isLocked && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isMobile ? 12 : 10}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                )}

                {/* Completed (Leveled trackside) indicator ring */}
                {s.completed && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isMobile ? 12.5 : 10.5}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                )}

                {/* Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isMeasured ? (isSelected || isHovered ? (isMobile ? 9.5 : 8) : (isMobile ? 7.5 : 6.5)) : (isHovered ? (isMobile ? 6.5 : 5.5) : (isMobile ? 5.5 : 4.5))}
                  fill={s.completed ? '#10b981' : dotFill}
                  stroke={isStart ? '#f59e0b' : isEnd ? '#38bdf8' : '#000000'}
                  strokeWidth={isSelected ? '2' : '1.5'}
                  opacity={s.completed ? 0.6 : 1}
                  className="transition-[r] duration-150 ease-out"
                />
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={effectiveWidth / 2}
            y={chartHeight - 6}
            textAnchor="middle"
            className="text-[9px] font-bold uppercase tracking-wider fill-zinc-500 hidden sm:block"
          >
            Track Distance (Feet)
          </text>
        </svg>
      </div>

      {/* Legend Footer */}
      {prototypeStyle === 'nothing' ? (
        <div className="px-3.5 py-1.5 bg-[#FFFFFF] dark:bg-[#000000] border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between text-[10px] text-zinc-600 dark:text-zinc-400 gap-2 font-['Space_Mono'] uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-black dark:bg-white"></span>
              <span>Rail Head</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-[#4A9E5C]"></span>
              <span className="text-[#4A9E5C]">Target Grade</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-[#5B9BF6]"></span>
              <span>Subset Chord</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-[#5B9BF6] whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#5B9BF6] shrink-0"></span> LIFT (LOW)
            </span>
            <span className="flex items-center gap-1.5 text-[#D4A843] whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#D4A843] shrink-0"></span> LOWER (HIGH)
            </span>
            <span className="flex items-center gap-1.5 text-[#4A9E5C] whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#4A9E5C] shrink-0"></span> ON GRADE
            </span>
            <span className="flex items-center gap-1.5 text-[#4A9E5C] whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full border border-[#4A9E5C] shrink-0"></span> LEVELED
            </span>
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-zinc-900 dark:bg-white rounded"></span>
              <span>Rail Head (Actual)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 border-t border-dashed border-emerald-500"></span>
              <span>Target Plane</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 border-t border-dashed border-sky-400"></span>
              <span>Subset Chord</span>
            </div>
          </div>
          <div className="flex items-center gap-3 font-semibold flex-wrap">
            <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400 whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span> Lift (Low)
            </span>
            <span className="flex items-center gap-1 text-amber-800 dark:text-amber-400 whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span> Lower (High)
            </span>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span> On Grade
            </span>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full border border-emerald-500 bg-emerald-500/30 shrink-0"></span> Leveled ✓
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
