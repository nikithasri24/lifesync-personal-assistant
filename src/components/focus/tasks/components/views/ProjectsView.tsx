/**
 * Projects View Component
 * Main view for displaying projects in a grid
 */

import React from 'react';
import type { ProjectView, TaskView } from '../../types';
import { ProjectsGrid } from '../ProjectsGrid';

interface ProjectsViewProps {
  projects: ProjectView[];
  tasks: TaskView[];
  onViewTasks: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  tasks,
  onViewTasks
}) => {
  return <ProjectsGrid projects={projects} tasks={tasks} onViewTasks={onViewTasks} />;
};
