import { Node, Edge } from "@xyflow/react";

const LAYOUT_CONFIG = {
  X_SPACING: 80,
  Y_SPACING: 120,
  CHAR_WIDTH: 9,
  BASE_PADDING: 60,
  HEADER_HEIGHT: 50,
  ROW_HEIGHT: 32,
  FOOTER_HEIGHT: 45,
  CONTAINER_PADDING: 20,
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
    320,
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

  const newNodes = nodes.map((node) => {
    const lvl = levels[node.id];
    const group = levelGroups[lvl];

    let rowTotalWidth = 0;
    group.forEach((n, idx) => {
      rowTotalWidth += nodeDimensions[n.id].width;
      if (idx < group.length - 1) rowTotalWidth += LAYOUT_CONFIG.X_SPACING;
    });

    let currentX = -(rowTotalWidth / 2);

    const nodeIndex = group.indexOf(node);
    for (let i = 0; i < nodeIndex; i++) {
      currentX += nodeDimensions[group[i].id].width + LAYOUT_CONFIG.X_SPACING;
    }

    let startY = 0;
    for (let i = 0; i < lvl; i++) {
      const prevGroup = levelGroups[i] || [];
      const maxH = Math.max(
        ...prevGroup.map((n) => nodeDimensions[n.id].height),
        100,
      );
      startY += maxH + LAYOUT_CONFIG.Y_SPACING;
    }

    return {
      ...node,
      position: {
        x: currentX,
        y: startY,
      },
    };
  });

  return newNodes;
};
