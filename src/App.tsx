import React, { useState, useEffect, useMemo } from 'react';
import { TrackProject, StationPoint, CalculatedStation } from './core/types';
import { calculateTrackProfile, getTrackSummary } from './core/calculations';
import { StationConfig } from './components/StationConfig';
import { ProfileChart } from './components/ProfileChart';
import { ActionTable } from './components/ActionTable';
import { FractionKeypad } from './components/FractionKeypad';
import { DataManagementModal } from './components/DataManagementModal';
import { UserGuideModal } from './components/UserGuideModal';
import { NewTrackModal } from './components/NewTrackModal';
import { useBodyScrollLock } from './core/useBodyScrollLock';

const INITIAL_STATIONS: StationPoint[] = [
  { id: 'st-0', distanceFt: 0, readingInches: 6.28 },
  { id: 'st-5', distanceFt: 5, readingInches: 6.22 },
  { id: 'st-10', distanceFt: 10, readingInches: 6.08 },
  { id: 'st-15', distanceFt: 15, readingInches: 5.94 },
  { id: 'st-20', distanceFt: 20, readingInches: 5.94 },
  { id: 'st-25', distanceFt: 25, readingInches: 5.86 },
  { id: 'st-30', distanceFt: 30, readingInches: 5.78 },
  { id: 'st-35', distanceFt: 35, readingInches: 5.63 },
  { id: 'st-40', distanceFt: 40, readingInches: 5.48 },
  { id: 'st-45', distanceFt: 45, readingInches: 5.2 },
  { id: 'st-50', distanceFt: 50, readingInches: 4.9 },
  { id: 'st-55', distanceFt: 55, readingInches: 4.74 },
  { id: 'st-60', distanceFt: 60, readingInches: 4.48 },
  { id: 'st-65', distanceFt: 65, readingInches: 4.18 },
  { id: 'st-70', distanceFt: 70, readingInches: 3.94 },
  { id: 'st-75', distanceFt: 75, readingInches: 3.76 },
  { id: 'st-80', distanceFt: 80, readingInches: 3.66 },
  { id: 'st-85', distanceFt: 85, readingInches: 3.42 },
];

const DEFAULT_PROJECT: TrackProject = {
  id: 'default-project-v3',
  name: 'North Loop Tangent',
  date: new Date().toISOString().split('T')[0],
  gauge: '7 1/4"',
  unitFormat: 'decimal_inches',
  fractionResolution: 16,
  toleranceInches: 0.05,
  stationIntervalFt: 5,
  laserDatumMode: 'relative_to_first',
  gradeMode: 'end_to_end',
  targetGradePercent: 0.0,
  stations: INITIAL_STATIONS,
};

export const App: React.FC = () => {
  // Load initial project from localStorage if available
  const [project, setProject] = useState<TrackProject>(() => {
    try {
      const saved = localStorage.getItem('track_level_companion_active');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If it's the old default demo project, refresh to the new decimal example values and end_to_end default
        if (parsed.id === 'default-project' || parsed.id === 'default-project-v1' || parsed.id === 'default-project-v2') {
          return DEFAULT_PROJECT;
        }
        return parsed;
      }
      return DEFAULT_PROJECT;
    } catch {
      return DEFAULT_PROJECT;
    }
  });

  // Dark mode (defaults to true for pure black OLED theme)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('track_level_theme_mode');
      if (savedTheme === 'light') return false;
      if (savedTheme === 'dark') return true;
      return true; // Default is always dark mode
    } catch {
      return true;
    }
  });

  // Active Keypad State
  const [activeEditingStation, setActiveEditingStation] = useState<CalculatedStation | null>(null);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isNewTrackModalOpen, setIsNewTrackModalOpen] = useState(false);

  useBodyScrollLock(isKeypadOpen || isDataModalOpen || isGuideOpen || isNewTrackModalOpen);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('track_level_theme_mode', isDarkMode ? 'dark' : 'light');
      localStorage.setItem('track_level_dark_mode', isDarkMode ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  // Persist project changes
  useEffect(() => {
    try {
      localStorage.setItem('track_level_companion_active', JSON.stringify(project));
    } catch (e) {
      console.error(e);
    }
  }, [project]);

  // Calculate live track profile
  const calculatedStations = useMemo(() => {
    return calculateTrackProfile(project);
  }, [project]);

  // Summary statistics
  const summary = useMemo(() => {
    return getTrackSummary(calculatedStations);
  }, [calculatedStations]);

  // Project update helper
  const handleUpdateProject = (updated: Partial<TrackProject>) => {
    setProject(prev => ({ ...prev, ...updated }));
  };

  // Station Editing Handlers
  const handleSelectStation = (station: CalculatedStation) => {
    setActiveEditingStation(station);
    setIsKeypadOpen(true);
  };

  const handleSaveStationReading = (valInches: number | null) => {
    if (!activeEditingStation) return;

    setProject(prev => ({
      ...prev,
      stations: prev.stations.map(s =>
        s.id === activeEditingStation.id ? { ...s, readingInches: valInches } : s
      )
    }));
    setIsKeypadOpen(false);
  };

  // Save and automatically advance to next station (or create next station)
  const handleSaveAndNext = (valInches: number | null) => {
    if (!activeEditingStation) return;

    const currentIdx = project.stations.findIndex(s => s.id === activeEditingStation.id);

    // Update current
    const updatedStations = project.stations.map(s =>
      s.id === activeEditingStation.id ? { ...s, readingInches: valInches } : s
    );

    let nextStation: StationPoint;

    if (currentIdx >= 0 && currentIdx < updatedStations.length - 1) {
      // Advance to existing next station
      nextStation = updatedStations[currentIdx + 1];
    } else {
      // Create next station at standard interval
      const lastDist = activeEditingStation.distanceFt;
      const newDist = lastDist + project.stationIntervalFt;
      nextStation = {
        id: `station-${Date.now()}`,
        distanceFt: newDist,
        readingInches: null,
      };
      updatedStations.push(nextStation);
    }

    setProject(prev => ({
      ...prev,
      stations: updatedStations,
    }));

    // Find calculated state for the next station
    const nextCalc = calculateTrackProfile({ ...project, stations: updatedStations }).find(
      s => s.id === nextStation.id
    );

    setActiveEditingStation(nextCalc || {
      ...nextStation,
      elevationInches: null,
      targetElevationInches: null,
      liftInches: null,
      action: 'none',
      actionText: '—',
    });
  };

  const handleSaveAndPrev = (valInches: number | null) => {
    if (!activeEditingStation) return;

    const currentIdx = project.stations.findIndex(s => s.id === activeEditingStation.id);
    const updatedStations = project.stations.map(s =>
      s.id === activeEditingStation.id ? { ...s, readingInches: valInches } : s
    );

    setProject(prev => ({
      ...prev,
      stations: updatedStations,
    }));

    if (currentIdx > 0) {
      const prevStation = updatedStations[currentIdx - 1];
      const prevCalc = calculateTrackProfile({ ...project, stations: updatedStations }).find(
        s => s.id === prevStation.id
      );
      setActiveEditingStation(prevCalc || null);
    } else {
      setIsKeypadOpen(false);
    }
  };

  // Add next station at end
  const handleAddNextStation = () => {
    const lastStation = project.stations[project.stations.length - 1];
    const newDist = lastStation ? lastStation.distanceFt + project.stationIntervalFt : 0;

    const newStation: StationPoint = {
      id: `station-${Date.now()}`,
      distanceFt: newDist,
      readingInches: null,
    };

    setProject(prev => ({
      ...prev,
      stations: [...prev.stations, newStation],
    }));

    // Immediately open keypad for it
    const calc = {
      ...newStation,
      elevationInches: null,
      targetElevationInches: null,
      liftInches: null,
      action: 'none' as const,
      actionText: '—',
    };
    setActiveEditingStation(calc);
    setIsKeypadOpen(true);
  };

  // Insert intermediate custom station (e.g. at bridge abutment or switch point)
  const handleInsertCustomStation = () => {
    const input = prompt('Enter station distance along track (in feet, e.g. -5, -10, 12.5):', '12.5');
    if (!input) return;
    const dist = parseFloat(input);
    if (isNaN(dist)) {
      alert('Please enter a valid number for distance.');
      return;
    }

    const newStation: StationPoint = {
      id: `station-${Date.now()}`,
      distanceFt: dist,
      readingInches: null,
    };

    // Insert and keep sorted by distance
    const combined = [...project.stations, newStation].sort((a, b) => a.distanceFt - b.distanceFt);

    setProject(prev => ({
      ...prev,
      stations: combined,
    }));

    const calc = {
      ...newStation,
      elevationInches: null,
      targetElevationInches: null,
      liftInches: null,
      action: 'none' as const,
      actionText: '—',
    };
    setActiveEditingStation(calc);
    setIsKeypadOpen(true);
  };

  // Batch extend track by specified feet (forward or backward)
  const handleExtendTrack = (lengthFt: number, intervalFt: number, direction: 'forward' | 'backward' = 'forward') => {
    const interval = intervalFt > 0 ? intervalFt : project.stationIntervalFt;
    const count = Math.floor(lengthFt / interval);

    if (direction === 'backward') {
      const firstStation = project.stations[0];
      const startDist = firstStation ? firstStation.distanceFt : 0;
      const newStations: StationPoint[] = [];

      for (let i = count; i >= 1; i--) {
        newStations.push({
          id: `station-${Date.now()}-neg-${i}`,
          distanceFt: startDist - i * interval,
          readingInches: null,
        });
      }

      if (newStations.length > 0) {
        setProject(prev => ({
          ...prev,
          stations: [...newStations, ...prev.stations],
        }));
      }
    } else {
      const lastStation = project.stations[project.stations.length - 1];
      const startDist = lastStation ? lastStation.distanceFt : 0;
      const newStations: StationPoint[] = [];

      for (let i = 1; i <= count; i++) {
        newStations.push({
          id: `station-${Date.now()}-${i}`,
          distanceFt: startDist + i * interval,
          readingInches: null,
        });
      }

      if (newStations.length > 0) {
        setProject(prev => ({
          ...prev,
          stations: [...prev.stations, ...newStations],
        }));
      }
    }
  };

  // Set turning point / laser relocation datum shift
  // Converts all previously recorded stations to the new active laser's scale!
  const handleSetTurningPoint = (stationId: string, newReadingInches: number) => {
    const targetIdx = project.stations.findIndex(s => s.id === stationId);
    if (targetIdx === -1) return;

    const targetStation = project.stations[targetIdx];
    if (targetStation.readingInches === null) return;

    // Laser height difference: New Laser Reading - Old Laser Reading on benchmark tie
    const oldReading = targetStation.readingInches;
    const delta = newReadingInches - oldReading;

    const updatedStations = project.stations.map((s) => {
      if (s.readingInches !== null) {
        // All previously measured ties convert directly to the active laser's scale!
        const updatedReading = s.readingInches + delta;
        if (s.id === stationId) {
          return {
            ...s,
            isTurningPoint: true,
            tpOldReadingInches: oldReading,
            tpNewReadingInches: newReadingInches,
            readingInches: updatedReading,
            datumOffsetInches: (s.datumOffsetInches || 0) + delta,
          };
        }
        return {
          ...s,
          readingInches: updatedReading,
          datumOffsetInches: (s.datumOffsetInches || 0) + delta,
        };
      }
      return s;
    });

    setProject(prev => ({
      ...prev,
      fixedDatumInches: prev.fixedDatumInches !== undefined ? prev.fixedDatumInches + delta : undefined,
      stations: updatedStations,
    }));
  };

  // Reset all laser relocation / datum offsets and restore original readings
  const handleResetDatum = () => {
    setProject(prev => {
      const tpStation = prev.stations.find(s => s.isTurningPoint);
      const delta = tpStation?.datumOffsetInches ?? 0;

      return {
        ...prev,
        fixedDatumInches: prev.fixedDatumInches !== undefined ? prev.fixedDatumInches - delta : undefined,
        stations: prev.stations.map(s => {
          const shift = s.datumOffsetInches || 0;
          const { datumOffsetInches, isTurningPoint, tpOldReadingInches, tpNewReadingInches, ...rest } = s;
          return {
            ...rest,
            readingInches: s.readingInches !== null ? s.readingInches - shift : null,
          };
        })
      };
    });
  };

  // Toggle station leveled/completed
  const handleToggleComplete = (stationId: string) => {
    setProject(prev => ({
      ...prev,
      stations: prev.stations.map(s =>
        s.id === stationId ? { ...s, completed: !s.completed } : s
      )
    }));
  };

  // Toggle station locked control point (e.g. over tree root or fixed structure)
  const handleToggleLock = (stationId: string) => {
    setProject(prev => ({
      ...prev,
      stations: prev.stations.map(s =>
        s.id === stationId ? { ...s, isLocked: !s.isLocked } : s
      )
    }));
  };

  // Delete station
  const handleDeleteStation = (stationId: string) => {
    if (project.stations.length <= 1) {
      alert('Track must have at least one station.');
      return;
    }
    setProject(prev => ({
      ...prev,
      stations: prev.stations.filter(s => s.id !== stationId),
    }));
  };

  // Reset to empty track
  const handleResetProject = () => {
    setProject({
      ...project,
      name: 'New Track Section',
      date: new Date().toISOString().split('T')[0],
      unitFormat: 'decimal_inches',
      stations: [
        { id: `st-${Date.now()}-0`, distanceFt: 0, readingInches: null }
      ]
    });
  };

  // Create new track with modal configuration (Blank, Pre-Generated Grid, or Clear Readings)
  const handleCreateNewTrack = ({
    name,
    mode,
    lengthFt,
    intervalFt,
    saveCurrentFirst,
  }: {
    name: string;
    mode: 'blank_zero' | 'empty_grid' | 'clear_readings';
    lengthFt: number;
    intervalFt: number;
    saveCurrentFirst: boolean;
  }) => {
    // Safety: If requested, save active project into saved tracks storage before replacing
    if (saveCurrentFirst && project.stations.some(s => s.readingInches !== null)) {
      try {
        const existingStr = localStorage.getItem('track_level_companion_projects');
        const existing: TrackProject[] = existingStr ? JSON.parse(existingStr) : [];
        const filtered = existing.filter(p => p.name !== project.name);
        localStorage.setItem('track_level_companion_projects', JSON.stringify([project, ...filtered]));
      } catch (err) {
        console.error('Failed to auto-save project before creating new track:', err);
      }
    }

    let newStations: StationPoint[] = [];

    if (mode === 'blank_zero') {
      newStations = [
        { id: `st-${Date.now()}-0`, distanceFt: 0, readingInches: null }
      ];
    } else if (mode === 'empty_grid') {
      const step = intervalFt > 0 ? intervalFt : 5;
      const max = Math.max(step, lengthFt);
      for (let d = 0; d <= max; d += step) {
        newStations.push({
          id: `st-${Date.now()}-${d}`,
          distanceFt: d,
          readingInches: null,
        });
      }
    } else if (mode === 'clear_readings') {
      newStations = project.stations.map(s => ({
        ...s,
        readingInches: null,
        completed: false,
        isLocked: false,
        isTurningPoint: false,
      }));
    }

    setProject(prev => ({
      ...prev,
      id: `track-${Date.now()}`,
      name,
      date: new Date().toISOString().split('T')[0],
      stationIntervalFt: mode === 'empty_grid' ? intervalFt : prev.stationIntervalFt,
      fixedDatumInches: undefined,
      stations: newStations,
    }));

    setActiveEditingStation(null);
  };

  // Load sample 85ft track with realistic decimal values
  const handleLoadDemoTrack = () => {
    setProject({
      ...project,
      name: 'Sample 85ft Section (Decimal Inches)',
      date: new Date().toISOString().split('T')[0],
      gradeMode: 'end_to_end',
      targetGradePercent: 0.0,
      stationIntervalFt: 5,
      unitFormat: 'decimal_inches',
      toleranceInches: 0.05,
      stations: INITIAL_STATIONS.map((s, idx) => ({
        ...s,
        id: `demo-${idx * 5}`,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-black dark:text-zinc-100 transition-colors p-2.5 sm:p-4 max-w-5xl mx-auto space-y-3">
      {/* Configuration & Header */}
      <StationConfig
        project={project}
        onChangeProject={handleUpdateProject}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenGuideModal={() => setIsGuideOpen(true)}
        onOpenNewTrackModal={() => setIsNewTrackModalOpen(true)}
        summary={summary}
        calculatedStations={calculatedStations}
      />

      {/* Visual Profile Chart ("Gentle Graph") */}
      <ProfileChart
        stations={calculatedStations}
        gradeMode={project.gradeMode}
        targetGradePercent={project.targetGradePercent}
        onSelectStation={handleSelectStation}
        selectedStationId={activeEditingStation?.id}
        onApplyTargetGrade={(grade) => {
          handleUpdateProject({
            gradeMode: 'target_grade',
            targetGradePercent: Number(grade.toFixed(2)),
          });
        }}
      />

      {/* Actionable Trackside Checklist Table */}
      <ActionTable
        stations={calculatedStations}
        unitFormat={project.unitFormat}
        fractionResolution={project.fractionResolution}
        onEditStation={handleSelectStation}
        onToggleComplete={handleToggleComplete}
        onToggleLock={handleToggleLock}
        onDeleteStation={handleDeleteStation}
        onAddNextStation={handleAddNextStation}
        onInsertCustomStation={handleInsertCustomStation}
        onExtendTrack={handleExtendTrack}
        onSetTurningPoint={handleSetTurningPoint}
        onResetDatum={handleResetDatum}
        selectedStationId={activeEditingStation?.id}
      />

      {/* Keypad Modal */}
      <FractionKeypad
        isOpen={isKeypadOpen}
        stationDistanceFt={activeEditingStation?.distanceFt ?? 0}
        currentReadingInches={activeEditingStation?.readingInches ?? null}
        datumOffsetInches={activeEditingStation?.appliedDatumOffsetInches ?? activeEditingStation?.datumOffsetInches}
        targetReadingInches={activeEditingStation?.targetReadingInches ?? null}
        actionText={activeEditingStation?.actionText}
        unitFormat={project.unitFormat}
        fractionResolution={project.fractionResolution}
        stationIndex={activeEditingStation ? project.stations.findIndex(s => s.id === activeEditingStation.id) + 1 : undefined}
        totalStations={project.stations.length}
        onSave={handleSaveStationReading}
        onSaveAndNext={handleSaveAndNext}
        onSaveAndPrev={handleSaveAndPrev}
        onClose={() => setIsKeypadOpen(false)}
      />

      {/* Data Management / Export Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        currentProject={project}
        onLoadProject={(p) => setProject(p)}
        onResetProject={handleResetProject}
        onLoadDemoTrack={handleLoadDemoTrack}
        onOpenNewTrack={() => setIsNewTrackModalOpen(true)}
      />

      {/* Start New Track Modal */}
      <NewTrackModal
        isOpen={isNewTrackModalOpen}
        onClose={() => setIsNewTrackModalOpen(false)}
        currentProject={project}
        onCreateNewTrack={handleCreateNewTrack}
      />

      {/* Field Guide & Animated Tutorial Modal */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
export default App;
