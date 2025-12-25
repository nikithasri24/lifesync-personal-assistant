import React from 'react';
import { BarChart3 } from 'lucide-react';
import { PageHeaderV2 } from '../../components/v2';

/**
 * Header for Analytics page - V2 Design
 */
export function AnalyticsHeader(): React.ReactElement {
  return (
    <PageHeaderV2
      title="Analytics Dashboard"
      subtitle="Track your productivity and habit performance"
      icon={BarChart3}
    />
  );
}
