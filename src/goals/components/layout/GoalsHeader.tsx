import React from 'react';
import { Plus, Sparkles, Target } from 'lucide-react';
import { PageHeaderV2 } from '../../../components/v2';
import { Button } from '../../../components/v2';

interface GoalsHeaderProps {
  onNewGoal: () => void;
  onNewDream: () => void;
}

/**
 * Header for Goals & Dreams page with action buttons - V2 Design
 */
export function GoalsHeader({ onNewGoal, onNewDream }: GoalsHeaderProps): React.ReactElement {
  return (
    <PageHeaderV2
      title="Goals & Dreams"
      subtitle="Track meaningful progress and celebrate future aspirations."
      icon={Target}
      actions={
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={onNewGoal}
          >
            <Plus className="h-4 w-4" />
            New goal
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onNewDream}
          >
            <Sparkles className="h-4 w-4" />
            New dream
          </Button>
        </div>
      }
    />
  );
}
