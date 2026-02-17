import React from 'react';
import { Edit2, Trash2, CheckCircle, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { BadgeV2 } from '@/components/v2/BadgeV2';
import { OwnerBadge } from '@/components/common/OwnerBadge';
import type { Project } from '@/hooks/useProjectsQuery';
import type { Task } from '@/types/task';
import { useThemeColors } from '@/hooks/useThemeColors';
import { gradients } from '@/styles/colors';

interface ProjectMetrics {
  projectId: string;
  completedTasks: number;
  totalTasks: number;
  progress: number;
  tasks: Task[];
}

interface ProjectCardProps {
  project: Project;
  metrics: ProjectMetrics;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  // Merged mode props (optional)
  showOwnerBadge?: boolean;
  currentUserId?: string;
  partnerName?: string;
}

/**
 * Individual project card with terracotta theme and progress visualization
 */
export function ProjectCard({
  project,
  metrics,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  showOwnerBadge = false,
  currentUserId,
  partnerName = 'Partner',
}: ProjectCardProps): React.ReactElement {
  const colors = useThemeColors();
  const safeProject = {
    id: project.id,
    name: project.name,
    icon: project.icon,
    status: project.status,
    description: project.description ?? '',
    color: project.color,
    user_id: project.user_id
  };

  // Status badge variant mapping
  const getStatusVariant = (): 'success' | 'info' | 'warning' | 'default' => {
    switch (safeProject.status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'on-hold':
        return 'warning';
      case 'planning':
        return 'default';
      default:
        return 'default';
    }
  };
  const statusVariant = getStatusVariant();

  return (
    <div
      className="rounded-2xl p-4 shadow-sm transition-all hover:shadow-md"
      style={{
        backgroundColor: colors.bg.white,
        borderWidth: '2px',
        borderColor: colors.border.light,
      }}
    >
      {/* Project Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-3xl">{safeProject.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-semibold truncate" style={{ color: colors.text.primary }}>
              {safeProject.name}
            </h3>
            <BadgeV2 variant={statusVariant} size="sm">
              {safeProject.status === 'active' ? 'Active' :
               safeProject.status === 'completed' ? 'Done' :
               safeProject.status === 'on-hold' ? 'On Hold' :
               safeProject.status === 'planning' ? 'Planning' : 'Archived'}
            </BadgeV2>
            {showOwnerBadge && currentUserId && (
              <OwnerBadge
                userId={safeProject.user_id}
                currentUserId={currentUserId}
                partnerName={partnerName}
              />
            )}
          </div>
          {safeProject.description && (
            <p className="text-sm line-clamp-2" style={{ color: colors.text.secondary }}>
              {safeProject.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 transition-colors"
            style={{
              backgroundColor: colors.bg.secondary,
              color: colors.text.tertiary,
            }}
            aria-label="Edit project"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 transition-colors hover:bg-red-50"
            style={{
              backgroundColor: colors.bg.secondary,
              color: colors.text.tertiary,
            }}
            aria-label="Delete project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-3" style={{ borderTopWidth: '1px', borderColor: colors.border.light, paddingTop: '12px' }}>
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: colors.text.secondary }}>Progress</span>
          <span className="font-semibold" style={{ color: colors.text.primary }}>
            {metrics.completedTasks} / {metrics.totalTasks} tasks
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: colors.bg.secondary }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${metrics.progress}%`,
              background: gradients.primary,
            }}
          />
        </div>

        {/* Task List Toggle */}
        {metrics.totalTasks > 0 && (
          <button
            onClick={onToggleExpand}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: colors.bg.secondary,
              color: colors.text.primary,
            }}
            aria-label={isExpanded ? "Hide tasks" : "Show tasks"}
          >
            <span>View Tasks ({metrics.totalTasks})</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}

        {isExpanded && metrics.tasks.length > 0 && (
          <div
            className="mt-2 space-y-2 rounded-xl p-3"
            style={{
              backgroundColor: colors.bg.secondary,
              borderWidth: '1px',
              borderColor: colors.border.light,
            }}
          >
            {metrics.tasks.map((task: Task) => (
              <div
                key={task.id}
                className="flex items-start gap-2 text-sm"
              >
                {task.status === 'done' ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: colors.text.tertiary }} />
                )}
                <span
                  className={`flex-1 ${task.status === 'done' ? 'line-through' : ''}`}
                  style={{
                    color: task.status === 'done' ? colors.text.tertiary : colors.text.primary,
                  }}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
