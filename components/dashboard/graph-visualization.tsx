'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

type Node = {
  id: string;
  label: string;
  type: 'main' | 'alt_wallet' | 'cex' | 'defi' | 'bridge' | 'mixer' | 'contract' | 'flagged';
  x?: number;
  y?: number;
};

type Edge = {
  id: string;
  source: string;
  target: string;
  type: 'token_transfer' | 'nft_transfer' | 'bridge_transaction' | 'liquidity_provision';
};

type GraphVisualizationProps = {
  nodes: Node[];
  edges: Edge[];
  onNodeSelect: (nodeId: string) => void;
  selectedNode?: string;
};

const typeColors = {
  main: '#4f46e5', // indigo
  alt_wallet: '#f59e0b', // amber
  cex: '#10b981', // emerald
  defi: '#3b82f6', // blue
  bridge: '#8b5cf6', // violet
  mixer: '#ef4444', // red
  contract: '#6b7280', // gray
  flagged: '#b91c1c', // dark red
};

export function GraphVisualization({ nodes, edges, onNodeSelect, selectedNode }: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [positionedNodes, setPositionedNodes] = useState<Node[]>([]);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);

  // Position nodes immediately when they change
  useEffect(() => {
    console.log("Nodes changed:", nodes);
    if (!nodes.length) {
      setPositionedNodes([]);
      return;
    }

    // Get the SVG dimensions for proper centering
    const svgWidth = svgRef.current?.clientWidth || 800;
    const svgHeight = svgRef.current?.clientHeight || 600;

    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    
    // Create a copy of nodes to avoid mutating props
    const newNodes = [...nodes].map(node => ({...node}));
    
    // First, check if we have any existing positioned nodes to preserve their positions
    if (positionedNodes.length > 0) {
      // Create a map of existing node positions by ID
      const existingNodePositions = new Map(
        positionedNodes.map(node => [node.id, { x: node.x, y: node.y }])
      );
      
      // Apply existing positions to new nodes if available
      newNodes.forEach(node => {
        const existingPosition = existingNodePositions.get(node.id);
        if (existingPosition) {
          node.x = existingPosition.x;
          node.y = existingPosition.y;
        }
      });
    }
    
    // Only position nodes that don't have positions yet
    const unpositionedNodes = newNodes.filter(node => node.x === undefined || node.y === undefined);
    
    if (unpositionedNodes.length === 0) {
      // All nodes already have positions, just update the state
      console.log("All nodes already positioned:", newNodes);
      setPositionedNodes(newNodes);
      return;
    }
    
    // Position the main node in the center if it doesn't have a position
    const mainNode = newNodes.find(n => n.type === 'main');
    if (mainNode && (mainNode.x === undefined || mainNode.y === undefined)) {
      mainNode.x = centerX;
      mainNode.y = centerY;
    }
    
    // Build a graph structure to determine node layers
    const graph = new Map<string, string[]>();
    
    // Initialize graph with all nodes
    newNodes.forEach(node => {
      if (!graph.has(node.id)) {
        graph.set(node.id, []);
      }
    });
    
    // Add connections based on edges
    edges.forEach(edge => {
      // Add both directions to make it easier to traverse
      if (graph.has(edge.source)) {
        graph.get(edge.source)?.push(edge.target);
      }
      if (graph.has(edge.target)) {
        graph.get(edge.target)?.push(edge.source);
      }
    });
    
    // Calculate node layers using BFS from the main node
    const layers = new Map<string, number>();
    const visited = new Set<string>();
    
    if (mainNode) {
      // BFS to assign layers
      const queue: [string, number][] = [[mainNode.id, 0]];
      visited.add(mainNode.id);
      layers.set(mainNode.id, 0);
      
      while (queue.length > 0) {
        const [nodeId, layer] = queue.shift()!;
        const neighbors = graph.get(nodeId) || [];
        
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            layers.set(neighbor, layer + 1);
            queue.push([neighbor, layer + 1]);
          }
        }
      }
      
      // For any nodes not visited (disconnected), assign a random layer
      newNodes.forEach(node => {
        if (!layers.has(node.id)) {
          // Assign a random layer between -2 and 2 (excluding 0)
          const randomLayer = Math.floor(Math.random() * 4) + 1;
          layers.set(node.id, Math.random() > 0.5 ? randomLayer : -randomLayer);
        }
      });
      
      // Group nodes by layer
      const nodesByLayer = new Map<number, Node[]>();
      newNodes.forEach(node => {
        const layer = layers.get(node.id) || 0;
        if (!nodesByLayer.has(layer)) {
          nodesByLayer.set(layer, []);
        }
        nodesByLayer.get(layer)?.push(node);
      });
      
      // Position nodes by layer
      nodesByLayer.forEach((layerNodes, layerNum) => {
        // Skip nodes that already have positions
        const unpositionedLayerNodes = layerNodes.filter(
          node => node.x === undefined || node.y === undefined
        );
        
        if (unpositionedLayerNodes.length === 0) return;
        
        // Calculate minimum radius needed for this layer based on node count and 100px minimum distance
        const nodeCount = unpositionedLayerNodes.length;
        const minCircumference = nodeCount * 100; // Minimum 100px between nodes
        const minRadius = minCircumference / (2 * Math.PI);
        
        // Layer radius increases with layer number (positive or negative)
        // Ensure it's at least the minimum radius needed for proper spacing
        const baseRadius = Math.min(svgWidth, svgHeight) * (0.15 + Math.abs(layerNum) * 0.1);
        const layerRadius = Math.max(baseRadius, minRadius);
        
        // Position nodes in this layer in a circle
        unpositionedLayerNodes.forEach((node, i) => {
          // Distribute nodes evenly around the circle
          const angle = (i / Math.max(unpositionedLayerNodes.length, 1)) * 2 * Math.PI;
          
          // Add a small random offset to avoid perfect circles, but not too much to maintain minimum distance
          const radiusOffset = (Math.random() * 0.1 + 0.95) * layerRadius;
          const angleOffset = (Math.random() * 0.1 - 0.05) + angle;
          
          node.x = centerX + radiusOffset * Math.cos(angleOffset);
          node.y = centerY + radiusOffset * Math.sin(angleOffset);
        });
      });
    } else {
      // If there's no main node, position all unpositioned nodes randomly
      // Ensure minimum distance between nodes using a simple force-directed approach
      unpositionedNodes.forEach(node => {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * Math.min(svgWidth, svgHeight) * 0.3;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      });
    }
    
    // Apply force-directed algorithm to ensure minimum distance between all nodes
    const MIN_DISTANCE = 100; // Minimum 100px between nodes
    const ITERATIONS = 15; // Increased number of iterations for force-directed adjustment
    
    for (let iter = 0; iter < ITERATIONS; iter++) {
      let moved = false;
      
      // For each pair of nodes, check distance and push apart if too close
      for (let i = 0; i < newNodes.length; i++) {
        const nodeA = newNodes[i];
        if (nodeA.x === undefined || nodeA.y === undefined) continue;
        
        for (let j = i + 1; j < newNodes.length; j++) {
          const nodeB = newNodes[j];
          if (nodeB.x === undefined || nodeB.y === undefined) continue;
          
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < MIN_DISTANCE) {
            moved = true;
            // Calculate repulsion force
            const force = (MIN_DISTANCE - distance) / distance;
            
            // Apply force to both nodes in opposite directions
            const forceX = dx * force * 0.5;
            const forceY = dy * force * 0.5;
            
            // Move nodes apart (if not the main node)
            if (nodeA.type !== 'main') {
              nodeA.x -= forceX;
              nodeA.y -= forceY;
            }
            
            if (nodeB.type !== 'main') {
              nodeB.x += forceX;
              nodeB.y += forceY;
            }
          }
        }
      }
      
      // If no nodes were moved, we can stop early
      if (!moved) break;
    }

    console.log("Positioned nodes:", newNodes);
    setPositionedNodes(newNodes);

    // Reset pan to center the graph when nodes change
    // This ensures the graph is always centered in the viewport
    setPan({ x: 0, y: 0 });
  }, [nodes, edges]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      // If we're dragging a specific node
      if (draggingNode) {
        // Find the node in our positioned nodes
        const nodeIndex = positionedNodes.findIndex(n => n.id === draggingNode);
        if (nodeIndex >= 0) {
          // Calculate the new position in SVG coordinates
          const svgPoint = svgCoordinates(e.clientX, e.clientY);

          // Update the node position
          const updatedNodes = [...positionedNodes];
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            x: svgPoint.x,
            y: svgPoint.y
          };

          setPositionedNodes(updatedNodes);
        }
      } else {
        // Otherwise, pan the entire graph
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingNode(null);
  };

  // Convert screen coordinates to SVG coordinates
  const svgCoordinates = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    // Get SVG's transformation matrix and invert it
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    const inverseCtm = ctm.inverse();

    // Transform the point from screen to SVG coordinates
    const transformedPoint = point.matrixTransform(inverseCtm);

    // Adjust for current pan and zoom
    return {
      x: (transformedPoint.x - pan.x) / zoom,
      y: (transformedPoint.y - pan.y) / zoom
    };
  };

  // Handle node drag start
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent graph panning
    setDraggingNode(nodeId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const getNodeColor = (type: Node['type']) => {
    return typeColors[type] || '#6b7280';
  };

  const getNodeIcon = (type: Node['type']) => {
    switch (type) {
      case 'main':
        return '★';
      case 'alt_wallet':
        return '?';
      case 'cex':
        return 'C';
      case 'defi':
        return 'D';
      case 'bridge':
        return 'B';
      case 'mixer':
        return 'M';
      case 'contract':
        return '⌘';
      case 'flagged':
        return '⚠';
      default:
        return '';
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button 
          onClick={handleZoomIn} 
          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"
          aria-label="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
        <button 
          onClick={handleZoomOut} 
          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"
          aria-label="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
        <button 
          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"
          onClick={() => setPan({ x: 0, y: 0 })} // Reset pan to center the graph
          aria-label="Center"
        >
          <Move size={18} />
        </button>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={draggingNode ? "cursor-grabbing" : "cursor-move"}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Draw edges */}
          {edges.map((edge, index) => {
            const source = positionedNodes.find(n => n.id === edge.source);
            const target = positionedNodes.find(n => n.id === edge.target);

            if (!source || !target || source.x === undefined || source.y === undefined || 
                target.x === undefined || target.y === undefined) {
              return null;
            }

            // All edges are now grey
            const strokeColor = '#9ca3af'; // Grey color
            
            // Calculate the angle for the arrowhead
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Calculate the position for the arrowhead
            // Position it slightly before the target node to avoid overlap
            const nodeRadius = 20; // Approximate node radius
            const distance = Math.sqrt(dx * dx + dy * dy);
            const ratio = (distance - nodeRadius) / distance;
            
            const arrowX = source.x + dx * ratio;
            const arrowY = source.y + dy * ratio;

            return (
              <g key={`edge-${edge.id}-${index}`}>
                {/* Main edge line */}
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />
                
                {/* Arrowhead */}
                <polygon 
                  points="0,-4 8,0 0,4" 
                  transform={`translate(${arrowX},${arrowY}) rotate(${angle})`}
                  fill={strokeColor}
                />
              </g>
            );
          })}

          {/* Draw nodes */}
          {positionedNodes.map((node, index) => {
            if (node.x === undefined || node.y === undefined) return null;

            const isSelected = node.id === selectedNode;
            const nodeRadius = isSelected ? 20 : 15;
            const isDraggable = true; // All nodes are draggable

            return (
              <g 
                key={`node-${node.id}-${index}`} 
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeSelect(node.id);
                }}
                onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                className={isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
              >
                <circle
                  r={nodeRadius}
                  fill={getNodeColor(node.type)}
                  stroke={isSelected ? 'white' : 'transparent'}
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={12}
                >
                  {getNodeIcon(node.type)}
                </text>
                <text
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  y={nodeRadius + 5}
                  fill="white"
                  fontSize={10}
                >
                  {node.label.length > 10 ? `${node.label.substring(0, 6)}...${node.label.substring(node.label.length - 4)}` : node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {positionedNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <p>No data to visualize. Start an investigation to see the graph.</p>
        </div>
      )}
    </div>
  );
}
