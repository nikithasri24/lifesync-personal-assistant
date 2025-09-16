import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Target, FileText } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

interface ProjectColumn {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  icon?: React.ReactNode;
  projectId: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  features: Feature[];
  columns?: ProjectColumn[];
}

export default function ProjectTrackingDebug() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'lifesync',
      name: 'PersonalAssistant - LifeSync',
      description: 'Personal productivity & life management suite',
      color: 'blue',
      features: [],
      columns: [
        { id: 'ideas', name: 'Ideas', color: 'purple', order: 0 },
        { id: 'working', name: 'Working', color: 'blue', order: 1 },
        { id: 'pending', name: 'Pending', color: 'orange', order: 2 },
        { id: 'done', name: 'Done', color: 'green', order: 3 }
      ]
    }
  ]);
  
  const [activeProjectId, setActiveProjectId] = useState('lifesync');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const activeProject = projects.find(p => p.id === activeProjectId);
  const features = activeProject?.features || [];

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // This useEffect might be causing the issue - let's test it
  useEffect(() => {
    console.log('useEffect running, activeProject:', activeProject);
    if (activeProject?.id === 'lifesync' && activeProject.features.length === 0) {
      console.log('Adding sample features with JSX...');
      // Add complex features with JSX icons - this might cause the issue
      const sampleFeatures: Feature[] = [
        {
          id: 'dashboard',
          title: 'Dashboard & Overview',
          description: 'Main dashboard with stats, quick access, and daily overview',
          status: 'working',
          priority: 'high',
          category: 'Core',
          icon: <BarChart3 size={16} />,
          projectId: 'lifesync'
        },
        {
          id: 'habits-system',
          title: 'Habit Tracking System',
          description: 'Categories, frequency patterns, reminders, calendar view',
          status: 'ideas',
          priority: 'high',
          category: 'Productivity',
          icon: <Target size={16} />,
          projectId: 'lifesync'
        }
      ];

      setProjects(prev => prev.map(p => 
        p.id === 'lifesync' ? { ...p, features: sampleFeatures } : p
      ));
    }
  }, [activeProject]); // This dependency might cause infinite loops

  // Initialize visible columns when active project changes
  useEffect(() => {
    console.log('Visible columns useEffect running');
    if (activeProject?.columns) {
      setVisibleColumns(new Set(activeProject.columns.map(col => col.id)));
    }
  }, [activeProject]); // Another useEffect with activeProject dependency

  try {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
      >
        <div className="space-y-6">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Tracking</h1>
            <p className="text-gray-600">{activeProject?.description || 'Manage your projects'}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Plus size={16} />
              <span>Add Feature</span>
            </button>
          </div>
        </div>

        {/* Simple Stats */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{activeProject?.name || 'Project'}</h3>
          <p className="text-sm text-gray-600">Basic project tracking (no drag and drop yet)</p>
        </div>

        {/* Simple Feature List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Features</h2>
          <p className="text-gray-500">No features yet. This is a debug version.</p>
        </div>
        </div>
      </DndContext>
    );
  } catch (error) {
    console.error('Error in ProjectTrackingDebug:', error);
    return <div className="p-8 text-red-600">Error: {String(error)}</div>;
  }
}