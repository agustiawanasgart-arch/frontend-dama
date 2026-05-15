import { useState } from 'react';
import ProjectList from './components/ProjectList';
import ClusterList from './components/ClusterList';
import UnitList from './components/UnitList';
import UnitDetailPanel from './components/UnitDetailPanel';

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setSelectedCluster(null);
    setSelectedUnit(null);
  };

  const handleBackToClusters = () => {
    setSelectedCluster(null);
    setSelectedUnit(null);
  };

  const handleBackToUnits = () => {
    setSelectedUnit(null);
  };

  return (
    <div className="relative w-full h-full">
      {/* Level 1: Projects */}
      {!selectedProject && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ProjectList onSelectProject={setSelectedProject} />
        </div>
      )}

      {/* Level 2: Clusters */}
      {selectedProject && !selectedCluster && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <ClusterList 
            project={selectedProject} 
            onSelectCluster={setSelectedCluster} 
            onBack={handleBackToProjects} 
          />
        </div>
      )}

      {/* Level 3: Units */}
      {selectedProject && selectedCluster && !selectedUnit && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <UnitList 
            cluster={selectedCluster} 
            project={selectedProject}
            onSelectUnit={setSelectedUnit} 
            onBack={handleBackToClusters} 
          />
        </div>
      )}

      {/* Level 4: Unit Details (Tabs) */}
      {selectedProject && selectedCluster && selectedUnit && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
           <UnitDetailPanel 
              unit={selectedUnit}
              cluster={selectedCluster}
              project={selectedProject}
              onBack={handleBackToUnits}
           />
        </div>
      )}
    </div>
  );
}
