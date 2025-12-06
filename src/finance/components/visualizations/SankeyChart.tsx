/**
 * Sankey Chart Component
 *
 * Visualizes cash flow from income sources through categories to expenses/savings.
 * Uses custom SVG rendering for full control.
 */

import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/currency';

export interface SankeyNode {
  source: string;
  target: string;
  value: number;
}

interface SankeyChartProps {
  data: SankeyNode[];
  width?: number;
  height?: number;
  className?: string;
}

interface ProcessedNode {
  id: string;
  x: number;
  y: number;
  height: number;
  value: number;
  color: string;
  level: number;
}

interface ProcessedLink {
  source: ProcessedNode;
  target: ProcessedNode;
  value: number;
  sourceY: number;
  targetY: number;
  color: string;
}

// Color palette for different node types
interface ColorConfig {
  income: string;
  expenses: string;
  savings: string;
  categories: Record<string, string>;
}

const COLORS: ColorConfig = {
  income: '#3b82f6',      // Blue
  expenses: '#ef4444',    // Red
  savings: '#10b981',     // Green
  categories: {
    'Housing': '#f59e0b',           // Amber
    'Food & Dining': '#ec4899',     // Pink
    'Transportation': '#8b5cf6',    // Purple
    'Bills & Utilities': '#06b6d4', // Cyan
    'Shopping': '#f97316',          // Orange
    'Entertainment': '#a855f7',     // Purple
    'Health & Fitness': '#14b8a6',  // Teal
    'Groceries': '#84cc16',         // Lime
    'Travel & Lifestyle': '#6366f1', // Indigo
    'Financial': '#0ea5e9',         // Sky
    'Auto & Transport': '#7c3aed',  // Violet
    'default': '#64748b',           // Slate
  },
};

const SankeyChart: React.FC<SankeyChartProps> = ({
  data,
  width = 800,
  height = 400,
  className = '',
}) => {
  const { nodes, links } = useMemo(() => {
    if (!data || data.length === 0) {
      return { nodes: [], links: [] };
    }

    // Build node list
    const nodeIds = new Set<string>();
    const nodeValues = new Map<string, number>();

    for (const link of data) {
      nodeIds.add(link.source);
      nodeIds.add(link.target);

      // Sum values for each node
      nodeValues.set(
        link.source,
        (nodeValues.get(link.source) ?? 0) + link.value
      );
      nodeValues.set(
        link.target,
        (nodeValues.get(link.target) ?? 0) + link.value
      );
    }

    // Determine node levels (source -> middle -> target)
    const levels = new Map<string, number>();

    // Special nodes
    const isIncomeSource = (id: string): boolean => {
      return data.some(d => d.source === id && d.target === 'Total Income');
    };
    const isTotalIncome = (id: string): boolean => id === 'Total Income';
    const isSavings = (id: string): boolean => id === 'Savings';
    const isExpenseCategory = (id: string): boolean => {
      return data.some(d => d.source === 'Total Income' && d.target === id) && !isSavings(id);
    };

    // Assign levels
    for (const id of nodeIds) {
      if (isIncomeSource(id)) {
        levels.set(id, 0); // Left column
      } else if (isTotalIncome(id)) {
        levels.set(id, 1); // Middle column
      } else if (isExpenseCategory(id) || isSavings(id)) {
        levels.set(id, 2); // Right column
      }
    }

    // Group nodes by level
    const nodesByLevel = new Map<number, string[]>();
    for (const [id, level] of levels) {
      const existing = nodesByLevel.get(level) ?? [];
      nodesByLevel.set(level, [...existing, id]);
    }

    // Layout parameters
    const padding = 40;
    const nodePadding = 20;
    const _nodeWidth = 20;
    const levelCount = Math.max(...levels.values()) + 1;
    const levelWidth = (width - 2 * padding) / (levelCount + 1);

    // Calculate node heights based on values
    const totalValue = Math.max(...nodeValues.values());
    const availableHeight = height - 2 * padding;

    const processedNodes: ProcessedNode[] = [];
    const nodeMap = new Map<string, ProcessedNode>();

    // Position nodes
    for (let level = 0; level <= 2; level++) {
      const levelNodes = nodesByLevel.get(level) ?? [];
      const _totalLevelValue = levelNodes.reduce(
        (sum, id) => sum + (nodeValues.get(id) ?? 0),
        0
      );

      let currentY = padding;
      const levelX = padding + level * levelWidth;

      for (const id of levelNodes) {
        const value = nodeValues.get(id) ?? 0;
        const nodeHeight = (value / totalValue) * availableHeight * 0.8;

        // Determine color
        let color = COLORS.categories.default;
        if (isIncomeSource(id) || isTotalIncome(id)) {
          color = COLORS.income;
        } else if (isSavings(id)) {
          color = COLORS.savings;
        } else if (isExpenseCategory(id)) {
          color = COLORS.categories[id] ?? COLORS.categories.default;
        }

        const node: ProcessedNode = {
          id,
          x: levelX,
          y: currentY,
          height: nodeHeight,
          value,
          color,
          level,
        };

        processedNodes.push(node);
        nodeMap.set(id, node);

        currentY += nodeHeight + nodePadding;
      }
    }

    // Create links
    const processedLinks: ProcessedLink[] = [];
    const linkOffsets = new Map<string, number>(); // Track Y offset for each node

    for (const link of data) {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);

      if (!sourceNode || !targetNode) continue;

      const linkHeight = (link.value / sourceNode.value) * sourceNode.height;

      const sourceOffset = linkOffsets.get(link.source) ?? 0;
      const targetOffset = linkOffsets.get(link.target) ?? 0;

      processedLinks.push({
        source: sourceNode,
        target: targetNode,
        value: link.value,
        sourceY: sourceNode.y + sourceOffset,
        targetY: targetNode.y + targetOffset,
        color: sourceNode.color,
      });

      linkOffsets.set(link.source, sourceOffset + linkHeight);
      linkOffsets.set(link.target, targetOffset + linkHeight);
    }

    return { nodes: processedNodes, links: processedLinks };
  }, [data, width, height]);

  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-slate-500">No data available for visualization</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Links */}
        <g className="links">
          {links.map((link, i) => {
            const sourceX = link.source.x + 20;
            const targetX = link.target.x;
            const sourceY = link.sourceY;
            const targetY = link.targetY;
            const linkHeight = (link.value / link.source.value) * link.source.height;

            // Cubic bezier path for smooth flow
            const controlPointOffset = (targetX - sourceX) / 2;
            const path = `
              M ${sourceX} ${sourceY}
              C ${sourceX + controlPointOffset} ${sourceY},
                ${targetX - controlPointOffset} ${targetY},
                ${targetX} ${targetY}
              L ${targetX} ${targetY + linkHeight}
              C ${targetX - controlPointOffset} ${targetY + linkHeight},
                ${sourceX + controlPointOffset} ${sourceY + linkHeight},
                ${sourceX} ${sourceY + linkHeight}
              Z
            `;

            return (
              <path
                key={`link-${i}`}
                d={path}
                fill={link.color}
                opacity={0.3}
                stroke="none"
                className="transition-opacity hover:opacity-50"
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodes.map((node, i) => (
            <g key={`node-${i}`} className="group cursor-pointer">
              <rect
                x={node.x}
                y={node.y}
                width={20}
                height={node.height}
                fill={node.color}
                rx={3}
                className="transition-all group-hover:brightness-110"
              />
              <text
                x={node.level === 0 ? node.x - 8 : node.level === 2 ? node.x + 28 : node.x + 10}
                y={node.y + node.height / 2}
                dy="0.35em"
                textAnchor={node.level === 0 ? 'end' : node.level === 2 ? 'start' : 'middle'}
                fill="#ffffff"
                fontSize="12"
                fontWeight="700"
              >
                {node.id}
              </text>
              <text
                x={node.level === 0 ? node.x - 8 : node.level === 2 ? node.x + 28 : node.x + 10}
                y={node.y + node.height / 2 + 12}
                dy="0.35em"
                textAnchor={node.level === 0 ? 'end' : node.level === 2 ? 'start' : 'middle'}
                fill="#ffffff"
                fontSize="14"
                fontWeight="600"
              >
                {formatCurrency(node.value)}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default SankeyChart;
