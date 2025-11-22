/**
 * Projects Grid Component
 * Displays projects in a responsive grid
 */

import React from 'react';
import type { ProjectView, TaskView } from '../types';
import { ProjectCard } from './ProjectCard';

interface ProjectsGridProps {
  projects: ProjectView[];
  tasks: TaskView[];
  onViewTasks: (projectId: string) => void;
}

export const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  tasks,
  onViewTasks
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          tasks={tasks}
          onViewTasks={onViewTasks}
        />
      ))}
    </div>
  );
};
