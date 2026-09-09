import React, { useState, useEffect, useMemo } from 'react';
import { TrackProject, StationPoint, CalculatedStation } from './core/types';
import { calculateTrackProfile, getTrackSummary } from './core/calculations';
import { StationConfig } from './components/StationConfig';
import { ProfileChart } from './components/ProfileChart';
import { ActionTable } from './components/ActionTable';
import { FractionKeypad } from './components/FractionKeypad';
import { DataManagementModal } from './components/DataManagementModal';

const INITIAL_STATIONS: StationPoint[] = [
  { id: 'st-0', distanceFt: 0, readingInches: 14.0 },
  { id: 'st-5', distanceFt: 5, readingInches: 14.25 },  // 1/4" dip
  { id: 'st-10', distanceFt: 10, readingInches: 14.375 }, // 3/8" dip
  { id: 'st-15', distanceFt: 15, readingInches: 14.125 }, // 1/8" dip
  { id: 'st-20', distanceFt: 20, readingInches: 13.875 }, // 1/8" hump
  { id: 'st-25', distanceFt: 25, readingInches: 14.0 },   // on grade
];

const DEFAULT_PROJECT: TrackProject = {
  id: 'default-project',
  name: 'North Loop Tangent',
  date: new Date().toISOString().split('T')[0],
  gauge: '7 1/4"',
  unitFormat: 'feet_inches_fraction',
  fractionResolution: 16,
  toleranceInches: 0.0625, // 1/16"
  stationIntervalFt: 5,
  laserDatumMode: 'relative_to_first',
  gradeMode: 'target_grade',
  targetGradePercent: 0.0,
  stations: INITIAL_STATIONS,
};

export const App: React.FC = () => {
  // Load initial project from localStorage if available
  const [project, setProject] = useState<TrackProject>(() => {
    try {
      const saved = localStorage.getItem('track_level_companion_active');
      return saved ? JSON.parse(saved) : DEFAULT_PROJECT;
    } catch {
      return DEFAULT_PROJECT;
    }
  });

  // Dark mode (defaults to light for bright outdoor sun, but supports dark)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('track_level_dark_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Active Keypad State
  const [activeEditingStation, setActiveEditingStation] = useState<CalculatedStation | null>(null);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
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
    const input = prompt('Enter custom station distance along track (in feet):', '12.5');
    if (!input) return;
    const dist = parseFloat(input);
    if (isNaN(dist) || dist < 0) {
      alert('Please enter a valid positive number for distance.');
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

  // Toggle station leveled/completed
  const handleToggleComplete = (stationId: string) => {
    setProject(prev => ({
      ...prev,
      stations: prev.stations.map(s =>
        s.id === stationId ? { ...s, completed: !s.completed } : s
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
      stations: [
        { id: `st-${Date.now()}-0`, distanceFt: 0, readingInches: null }
      ]
    });
  };

  // Load sample 50ft track with realistic dip
  const handleLoadDemoTrack = () => {
    setProject({
      ...project,
      name: 'Sample 50ft Track (West Curve)',
      date: new Date().toISOString().split('T')[0],
      gradeMode: 'target_grade',
      targetGradePercent: 0.0,
      stationIntervalFt: 5,
      stations: [
        { id: 'demo-0', distanceFt: 0, readingInches: 14.0 },
        { id: 'demo-5', distanceFt: 5, readingInches: 14.125 }, // 1/8" dip
        { id: 'demo-10', distanceFt: 10, readingInches: 14.375 }, // 3/8" dip
        { id: 'demo-15', distanceFt: 15, readingInches: 14.5 },   // 1/2" dip (sag point)
        { id: 'demo-20', distanceFt: 20, readingInches: 14.25 },  // 1/4" dip
        { id: 'demo-25', distanceFt: 25, readingInches: 14.0 },   // on grade
        { id: 'demo-30', distanceFt: 30, readingInches: 13.875 }, // 1/8" hump
        { id: 'demo-35', distanceFt: 35, readingInches: 13.75 },  // 1/4" hump (bridge entry)
        { id: 'demo-40', distanceFt: 40, readingInches: 13.875 },
        { id: 'demo-45', distanceFt: 45, readingInches: 14.0 },
        { id: 'demo-50', distanceFt: 50, readingInches: 14.0 },
      ]
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors p-3 sm:p-5 max-w-5xl mx-auto space-y-4">
      {/* Configuration & Header */}
      <StationConfig
        project={project}
        onChangeProject={handleUpdateProject}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        summary={summary}
      />

      {/* Visual Profile Chart ("Gentle Graph") */}
      <ProfileChart
        stations={calculatedStations}
        gradeMode={project.gradeMode}
        targetGradePercent={project.targetGradePercent}
        onSelectStation={handleSelectStation}
        selectedStationId={activeEditingStation?.id}
      />

      {/* Actionable Trackside Checklist Table */}
      <ActionTable
        stations={calculatedStations}
        unitFormat={project.unitFormat}
        fractionResolution={project.fractionResolution}
        onEditStation={handleSelectStation}
        onToggleComplete={handleToggleComplete}
        onDeleteStation={handleDeleteStation}
        onAddNextStation={handleAddNextStation}
        onInsertCustomStation={handleInsertCustomStation}
        selectedStationId={activeEditingStation?.id}
      />

      {/* Keypad Modal */}
      <FractionKeypad
        isOpen={isKeypadOpen}
        stationDistanceFt={activeEditingStation?.distanceFt ?? 0}
        currentReadingInches={activeEditingStation?.readingInches ?? null}
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
      />
    </div>
  );
};
export default App;
