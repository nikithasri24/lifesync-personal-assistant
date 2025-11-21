/**
 * Goal Templates Browser
 * Browse and create goals from pre-defined templates
 */

import React, { useEffect, useState } from 'react';
import { Target, Zap, Clock, Tag, TrendingUp, Award, BookOpen, X } from 'lucide-react';
import { getGoalTemplates, createGoalFromTemplate } from '../api/lifeGoalsAPI';
import type { LifeGoalWithMilestones } from '../types/lifeGoals';
import { logger } from '../../services/logger';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedDurationDays: number;
  defaultMilestones: any[];
  suggestedTags: string[];
  tips: string;
  resources: string[];
  usageCount: number;
}

interface GoalTemplatesProps {
  onGoalCreated: (goal: LifeGoalWithMilestones) => void;
  onClose: () => void;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  hard: 'bg-orange-100 text-orange-800 border-orange-300',
  extreme: 'bg-red-100 text-red-800 border-red-300',
};

const categoryIcons: Record<string, any> = {
  fitness: TrendingUp,
  health: Award,
  career: Target,
  financial: Zap,
  personal: BookOpen,
};

const GoalTemplates: React.FC<GoalTemplatesProps> = ({ onGoalCreated, onClose }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const data = await getGoalTemplates();
        setTemplates(data.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          difficulty: t.difficulty,
          estimatedDurationDays: t.estimated_duration_days,
          defaultMilestones: t.default_milestones || [],
          suggestedTags: t.suggested_tags || [],
          tips: t.tips,
          resources: t.resources || [],
          usageCount: t.usage_count,
        })));
      } catch (error) {
        logger.error('Error loading templates:', { error });
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      setCreating(true);
      const goal = await createGoalFromTemplate(templateId);
      onGoalCreated(goal);
      onClose();
    } catch (error) {
      logger.error('Error creating goal from template:', { error });
      alert('Failed to create goal. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const categories = ['all', 'fitness', 'health', 'career', 'financial', 'personal'];
  const filteredTemplates = filterCategory === 'all'
    ? templates
    : templates.filter(t => t.category === filterCategory);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-8">
          <div className="flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Goal Templates</h2>
            <p className="text-sm text-slate-600 mt-1">Quick-start your goals with proven templates</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Category filter */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Templates grid */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No templates found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(template => {
                const CategoryIcon = categoryIcons[template.category] || Target;

                return (
                  <div
                    key={template.id}
                    className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <CategoryIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{template.name}</h3>
                          <p className="text-xs text-slate-500">{template.category}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${difficultyColors[template.difficulty]}`}>
                        {template.difficulty}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{template.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.estimatedDurationDays} days
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {template.defaultMilestones.length} milestones
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {template.usageCount} uses
                      </span>
                    </div>

                    {template.suggestedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.suggestedTags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs flex items-center gap-1">
                            <Tag className="h-2.5 w-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div>
      </div>

      {/* Template details modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 py-8">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{selectedTemplate.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="p-2 rounded-lg hover:bg-slate-100"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${difficultyColors[selectedTemplate.difficulty]}`}>
                    {selectedTemplate.difficulty}
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                    {selectedTemplate.category}
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {selectedTemplate.estimatedDurationDays} days
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Milestones */}
                {selectedTemplate.defaultMilestones.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-indigo-600" />
                      Milestones ({selectedTemplate.defaultMilestones.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedTemplate.defaultMilestones.map((milestone: any, index: number) => (
                        <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{milestone.title}</p>
                            {milestone.description && (
                              <p className="text-xs text-slate-600 mt-1">{milestone.description}</p>
                            )}
                            {milestone.estimatedDays && (
                              <p className="text-xs text-slate-500 mt-1">~{milestone.estimatedDays} days</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {selectedTemplate.tips && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      Tips for Success
                    </h4>
                    <p className="text-sm text-slate-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      {selectedTemplate.tips}
                    </p>
                  </div>
                )}

                {/* Resources */}
                {selectedTemplate.resources.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      Helpful Resources
                    </h4>
                    <ul className="space-y-1">
                      {selectedTemplate.resources.map((resource: string, index: number) => (
                        <li key={index} className="text-sm text-blue-600 hover:underline">
                          • {resource}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {selectedTemplate.suggestedTags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-purple-600" />
                      Suggested Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.suggestedTags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button
                  onClick={() => handleCreateFromTemplate(selectedTemplate.id)}
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Goal from Template'}
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalTemplates;
