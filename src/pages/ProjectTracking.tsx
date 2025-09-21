import React from 'react';

const ProjectTracking: React.FC = () => {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Project tracking</h1>
      <p className="text-sm text-slate-600">
        A slimmer project view is on the roadmap. For now, keep task-level progress flowing from the Tasks and Goals sections—those feed the
        dashboard summaries automatically.
      </p>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-slate-500">
        Kanban lanes, swimlanes, and dependency visualisation will return once the database schema is finalised.
      </div>
    </div>
  );
};

export default ProjectTracking;
