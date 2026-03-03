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
  /** Colors keyed by category name, sourced from the DB Category.color field */
  categoryColors?: Record<string, string>;
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
  linkHatSrc: number;
  linkHatTgt: number;
}

// Special-node colors that aren't user-defined categories
const SPECIAL_COLORS: Record<string, string> = {
  income:          '#3b82f6', // blue  — income source bars
  'Total Income':  '#3b82f6',
  savings:         '#10b981', // green — savings bar
  'Savings':       '#10b981',
  'Other':         '#94a3b8', // slate — grouped tail categories
  default:         '#64748b',
};

// Layout constants
const LEFT_PAD  = 170; // room for income source labels (left of nodes)
const RIGHT_PAD = 200; // room for expense category labels (right of nodes)
const TOP_PAD   = 24;
const BOT_PAD   = 24;
const NODE_W    = 16;
const NODE_GAP  = 10;  // vertical gap between sibling nodes
const MIN_NODE_H = 6;  // minimum visible height for tiny categories

const SankeyChart: React.FC<SankeyChartProps> = ({
  data,
  categoryColors = {},
  width = 800,
  height = 480,
  className = '',
}) => {
  const { nodes, links } = useMemo(() => {
    if (!data || data.length === 0) return { nodes: [], links: [] };

    // ── gather nodes & values ──────────────────────────────────────────────
    const nodeIds = new Set<string>();
    const outgoing = new Map<string, number>();
    const incoming = new Map<string, number>();
    for (const link of data) {
      nodeIds.add(link.source);
      nodeIds.add(link.target);
      outgoing.set(link.source, (outgoing.get(link.source) ?? 0) + link.value);
      incoming.set(link.target, (incoming.get(link.target) ?? 0) + link.value);
    }
    // Display value per node:
    //   income sources → how much they send out (= their income amount)
    //   Total Income   → how much flows IN (actual income, not doubled by expenses)
    //   expense nodes  → how much flows in (what was allocated to them)
    const nodeValues = new Map<string, number>();
    for (const id of nodeIds) {
      const out = outgoing.get(id) ?? 0;
      const inc = incoming.get(id) ?? 0;
      nodeValues.set(id, id === 'Total Income' ? inc : (out || inc));
    }

    // ── assign levels ──────────────────────────────────────────────────────
    const isIncomeSource = (id: string) => data.some(d => d.source === id && d.target === 'Total Income');
    const isTotalIncome  = (id: string) => id === 'Total Income';
    const isSavings      = (id: string) => id === 'Savings';
    const isExpense      = (id: string) => data.some(d => d.source === 'Total Income' && d.target === id) && !isSavings(id);

    const levels = new Map<string, number>();
    for (const id of nodeIds) {
      if (isIncomeSource(id))            levels.set(id, 0);
      else if (isTotalIncome(id))        levels.set(id, 1);
      else if (isExpense(id) || isSavings(id)) levels.set(id, 2);
    }

    const nodesByLevel = new Map<number, string[]>();
    for (const [id, level] of levels) {
      nodesByLevel.set(level, [...(nodesByLevel.get(level) ?? []), id]);
    }

    // ── column X positions ─────────────────────────────────────────────────
    const innerW = width - LEFT_PAD - RIGHT_PAD;
    const colX = [
      LEFT_PAD,                                  // level 0: income sources
      LEFT_PAD + innerW / 2 - NODE_W / 2,        // level 1: total income (centered)
      width - RIGHT_PAD - NODE_W,                 // level 2: expense categories
    ];

    const availH = height - TOP_PAD - BOT_PAD;

    // ── position nodes — each column scaled independently ──────────────────
    // This prevents overflow when expenses exceed income (deficit months).
    // Every column fills exactly availH regardless of absolute values.
    const processedNodes: ProcessedNode[] = [];
    const nodeMap = new Map<string, ProcessedNode>();

    for (let lvl = 0; lvl <= 2; lvl++) {
      const ids = nodesByLevel.get(lvl) ?? [];
      const gapTotal = NODE_GAP * Math.max(0, ids.length - 1);
      const heightPool = availH - gapTotal;

      // Sum of display values in this column
      const colTotal = ids.reduce((s, id) => s + (nodeValues.get(id) ?? 0), 0);

      let curY = TOP_PAD;

      for (const id of ids) {
        const value = nodeValues.get(id) ?? 0;
        // Scale proportionally within the column so they always fill availH
        const nodeH = colTotal > 0
          ? Math.max(MIN_NODE_H, (value / colTotal) * heightPool)
          : MIN_NODE_H;

        let color = SPECIAL_COLORS.default;
        if (isIncomeSource(id) || isTotalIncome(id)) color = SPECIAL_COLORS.income;
        else if (isSavings(id)) color = SPECIAL_COLORS.savings;
        else color = categoryColors[id] ?? SPECIAL_COLORS[id] ?? SPECIAL_COLORS.default;

        const node: ProcessedNode = {
          id, x: colX[lvl], y: curY, height: nodeH, value, color, level: lvl,
        };
        processedNodes.push(node);
        nodeMap.set(id, node);
        curY += nodeH + NODE_GAP;
      }
    }

    // ── create links ───────────────────────────────────────────────────────
    // Use the actual outgoing total for each source to proportion link heights.
    // This ensures links never overflow the source bar even in deficit months.
    const processedLinks: ProcessedLink[] = [];
    const linkOffsets = new Map<string, number>();

    for (const link of data) {
      const src = nodeMap.get(link.source);
      const tgt = nodeMap.get(link.target);
      if (!src || !tgt) continue;

      const srcOutgoing = outgoing.get(link.source) ?? src.value;
      const tgtIncoming = incoming.get(link.target) ?? tgt.value;
      const srcOff = linkOffsets.get(link.source) ?? 0;
      const tgtOff = linkOffsets.get(link.target) ?? 0;

      // Link height proportional to share of the source's total outgoing
      const linkHatSrc = (link.value / srcOutgoing) * src.height;
      // Link height proportional to share of the target's total incoming
      const linkHatTgt = (link.value / tgtIncoming) * tgt.height;

      processedLinks.push({
        source: src, target: tgt, value: link.value,
        sourceY: src.y + srcOff, targetY: tgt.y + tgtOff,
        color: src.color,
        linkHatSrc,
        linkHatTgt,
      });

      linkOffsets.set(link.source, srcOff + linkHatSrc);
      linkOffsets.set(link.target, tgtOff + linkHatTgt);
    }

    return { nodes: processedNodes, links: processedLinks };
  }, [data, width, height]);

  // ── label collision avoidance for right column ─────────────────────────
  // Compute label Y positions, pushing down when nodes are too close together
  const rightLabelYs = useMemo(() => {
    const rightNodes = nodes.filter(n => n.level === 2);
    const LINE_H = 13; // px per text line
    const positions: Map<string, { nameY: number; valueY: number; show: boolean }> = new Map();

    let minNextY = -Infinity;
    for (const node of rightNodes) {
      const midY = node.y + node.height / 2;
      const nameY = Math.max(midY - LINE_H / 2, minNextY);
      const valueY = nameY + LINE_H;
      const show = nameY < node.y + node.height + 20; // don't show if wildly displaced
      positions.set(node.id, { nameY, valueY, show });
      minNextY = valueY + 4;
    }
    return positions;
  }, [nodes]);

  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-slate-500">No data available for visualization</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <svg width={width} height={height}>
        {/* Links */}
        <g>
          {links.map((link, i) => {
            const sx = link.source.x + NODE_W;
            const tx = link.target.x;
            const sy = link.sourceY;
            const ty = link.targetY;
            const sh = link.linkHatSrc; // height at source end
            const th = link.linkHatTgt; // height at target end
            const cp = (tx - sx) * 0.5;
            // Tapered bezier: different heights at source vs target ends
            const path = [
              `M ${sx} ${sy}`,
              `C ${sx + cp} ${sy}, ${tx - cp} ${ty}, ${tx} ${ty}`,
              `L ${tx} ${ty + th}`,
              `C ${tx - cp} ${ty + th}, ${sx + cp} ${sy + sh}, ${sx} ${sy + sh}`,
              'Z',
            ].join(' ');
            return (
              <path
                key={i} d={path}
                fill={link.color} opacity={0.22}
                stroke="none"
                className="transition-opacity hover:opacity-50"
              />
            );
          })}
        </g>

        {/* Nodes + Labels */}
        <g>
          {nodes.map((node, i) => {
            const midY = node.y + node.height / 2;
            const isLeft   = node.level === 0;
            const isMiddle = node.level === 1;
            const isRight  = node.level === 2;

            // Label positioning
            const labelX  = isLeft ? node.x - 10 : isRight ? node.x + NODE_W + 10 : node.x + NODE_W / 2;
            const anchor   = isLeft ? 'end' : isRight ? 'start' : 'middle';

            // Middle node: white text inside bar
            if (isMiddle) {
              return (
                <g key={i}>
                  <rect x={node.x} y={node.y} width={NODE_W} height={node.height} fill={node.color} rx={3} />
                  <text x={labelX} y={midY - 7} dy="0.35em" textAnchor={anchor} fill="#ffffff" fontSize="11" fontWeight="600">
                    Total Income
                  </text>
                  <text x={labelX} y={midY + 7} dy="0.35em" textAnchor={anchor} fill="#dbeafe" fontSize="11" fontWeight="700">
                    {formatCurrency(node.value)}
                  </text>
                </g>
              );
            }

            // Left (income sources): two lines centered on mid
            if (isLeft) {
              return (
                <g key={i}>
                  <rect x={node.x} y={node.y} width={NODE_W} height={node.height} fill={node.color} rx={3} />
                  <text x={labelX} y={midY - 7} dy="0.35em" textAnchor={anchor} fill="#1e293b" fontSize="11" fontWeight="600">
                    {node.id}
                  </text>
                  <text x={labelX} y={midY + 7} dy="0.35em" textAnchor={anchor} fill={node.color} fontSize="11" fontWeight="700">
                    {formatCurrency(node.value)}
                  </text>
                </g>
              );
            }

            // Right (expense categories): collision-avoided positions
            const pos = rightLabelYs.get(node.id);
            if (!pos?.show) {
              return (
                <g key={i}>
                  <rect x={node.x} y={node.y} width={NODE_W} height={node.height} fill={node.color} rx={3} />
                </g>
              );
            }
            return (
              <g key={i}>
                <rect x={node.x} y={node.y} width={NODE_W} height={node.height} fill={node.color} rx={3} />
                <text x={labelX} y={pos.nameY} dy="0.35em" textAnchor={anchor} fill="#1e293b" fontSize="11" fontWeight="600">
                  {node.id}
                </text>
                <text x={labelX} y={pos.valueY} dy="0.35em" textAnchor={anchor} fill={node.color} fontSize="11" fontWeight="700">
                  {formatCurrency(node.value)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default SankeyChart;
