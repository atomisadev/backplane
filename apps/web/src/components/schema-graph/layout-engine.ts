import { Node, Edge } from "@xyflow/react";

const LAYOUT_CONFIG = {
  X_SPACING: 50,
  Y_SPACING: 80,
  CHAR_WIDTH: 9,
  BASE_PADDING: 40,
  HEADER_HEIGHT: 50,
  ROW_HEIGHT: 32,
  FOOTER_HEIGHT: 45,
  CONTAINER_PADDING: 20,
  TARGET_ROW_WIDTH: 1400,
};

const getNodeDimensions = (node: Node) => {
  if (node.measured && node.measured.width && node.measured.height) {
    return {
      width: node.measured.width,
      height: node.measured.height,
    };
  }

  const tableData = node.data.table as any;

  const maxTableLen = tableData.name.length;
  const maxColLen = tableData.columns.reduce((max: number, col: any) => {
    const len = col.name.length + col.type.length + 5;
    return Math.max(max, len);
  }, 0);

  const estimatedWidth = Math.max(
    280,
    Math.max(maxTableLen, maxColLen) * LAYOUT_CONFIG.CHAR_WIDTH +
      LAYOUT_CONFIG.BASE_PADDING,
  );

  const estimatedHeight =
    LAYOUT_CONFIG.HEADER_HEIGHT +
    tableData.columns.length * LAYOUT_CONFIG.ROW_HEIGHT +
    LAYOUT_CONFIG.CONTAINER_PADDING +
    LAYOUT_CONFIG.FOOTER_HEIGHT;

  return { width: estimatedWidth, height: estimatedHeight };
};

export const performAutoLayout = (nodes: Node[], edges: Edge[]) => {
  const adjacency: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const nodeDimensions: Record<string, { width: number; height: number }> = {};

  nodes.forEach((node) => {
    adjacency[node.id] = [];
    inDegree[node.id] = 0;
    nodeDimensions[node.id] = getNodeDimensions(node);
  });

  edges.forEach((edge) => {
    if (adjacency[edge.source]) {
      adjacency[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }
  });

  const levels: Record<string, number> = {};
  const queue: string[] = [];

  nodes.forEach((node) => {
    if (inDegree[node.id] === 0) {
      levels[node.id] = 0;
      queue.push(node.id);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    levels[nodes[0].id] = 0;
    queue.push(nodes[0].id);
  }

  const visited = new Set<string>();
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const currentLevel = levels[nodeId];
    const neighbors = adjacency[nodeId] || [];

    neighbors.forEach((neighborId) => {
      levels[neighborId] = Math.max(levels[neighborId] || 0, currentLevel + 1);
      queue.push(neighborId);
    });
  }

  nodes.forEach((node) => {
    if (levels[node.id] === undefined) {
      levels[node.id] = 0;
    }
  });

  const levelGroups: Record<number, Node[]> = {};
  let maxLevel = 0;

  nodes.forEach((node) => {
    const lvl = levels[node.id];
    maxLevel = Math.max(maxLevel, lvl);
    if (!levelGroups[lvl]) levelGroups[lvl] = [];
    levelGroups[lvl].push(node);
  });

  let currentYCursor = 0;
  const newNodes: Node[] = [];

  const sortedLevels = Object.keys(levelGroups)
    .map(Number)
    .sort((a, b) => a - b);

  sortedLevels.forEach((lvl) => {
    const group = levelGroups[lvl];

    group.sort((a, b) => {
      return a.id.localeCompare(b.id);
    });

    let currentRowX = 0;
    let currentRowY = currentYCursor;
    let maxRowHeight = 0;

    group.forEach((node) => {
      const dim = nodeDimensions[node.id];

      if (
        currentRowX > 0 &&
        currentRowX + dim.width > LAYOUT_CONFIG.TARGET_ROW_WIDTH
      ) {
        currentRowX = 0;
        currentRowY += maxRowHeight + LAYOUT_CONFIG.Y_SPACING;
        maxRowHeight = 0;
      }

      newNodes.push({
        ...node,
        position: {
          x: currentRowX,
          y: currentRowY,
        },
      });

      currentRowX += dim.width + LAYOUT_CONFIG.X_SPACING;
      maxRowHeight = Math.max(maxRowHeight, dim.height);
    });

    currentYCursor = currentRowY + maxRowHeight + LAYOUT_CONFIG.Y_SPACING * 1.5;
  });

  return newNodes;
};
