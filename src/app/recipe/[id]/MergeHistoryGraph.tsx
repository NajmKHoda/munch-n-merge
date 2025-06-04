import dagre from 'dagre';
import Link from 'next/link';
import { getRecipeMergeHistory } from '@/lib/actions/recipe';

interface MergeHistoryNode {
    id: number;
    name: string;
    parentIds: number[];
}

interface GraphNode {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isOriginal: boolean;
}

interface GraphEdge {
    from: string;
    to: string;
    points: { x: number; y: number }[];
}

async function calculateLayout(history: MergeHistoryNode[]) {
    // Create a new directed graph
    const g = new dagre.graphlib.Graph();
    
    // Set the graph's default properties
    g.setGraph({
        rankdir: 'TB', // Top to bottom layout
        ranksep: 80,   // Separation between ranks
        nodesep: 40,   // Separation between nodes
        edgesep: 20,   // Separation between edges
        marginx: 20,
        marginy: 20
    });

    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes to the graph
    history.forEach(node => {
        const isOriginal = node.parentIds.length === 0;
        // Calculate width based on text length with reduced padding
        const textLength = node.name.length;
        const nodeWidth = Math.max(80, textLength * 7 + 20); // Reduced minimum and padding
        
        g.setNode(node.id.toString(), {
            width: nodeWidth,
            height: 50, // Reduced height for less vertical padding
            label: node.name,
            isOriginal
        });
    });

    // Add edges to the graph
    history.forEach(node => {
        node.parentIds.forEach(parentId => {
            g.setEdge(parentId.toString(), node.id.toString());
        });
    });

    // Run the layout algorithm
    dagre.layout(g);

    // Extract the positioned nodes and edges
    const nodes: GraphNode[] = g.nodes().map(nodeId => {
        const node = g.node(nodeId);
        const nodeData = node as any;
        return {
            id: nodeId,
            label: nodeData.label || 'Unknown',
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            isOriginal: nodeData.isOriginal || false
        };
    });

    const edges: GraphEdge[] = g.edges().map(edgeId => {
        const edge = g.edge(edgeId);
        return {
            from: edgeId.v,
            to: edgeId.w,
            points: edge.points || []
        };
    });

    return { nodes, edges, graph: g.graph() };
}

export default async function MergeHistoryGraph({ recipeId }: { recipeId: number }) {
    const historyResult = await getRecipeMergeHistory(recipeId);
    
    if ('error' in historyResult) {
        if (historyResult.error === 'not-found') {
            return null; // Don't show anything if no merge history
        }
        return (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg">
                Failed to load merge history
            </div>
        );
    }

    const { history } = historyResult;
    
    // If only one recipe (the current one) and no parents, don't show the graph
    if (history.length <= 1) {
        return null;
    }

    const { nodes, edges, graph } = await calculateLayout(history);
    
    // Calculate SVG dimensions based on the graph
    const svgWidth = graph.width || 400;
    const svgHeight = graph.height || 300;

    return (
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Recipe Merge History
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                    This diagram shows how this recipe was created by merging other recipes. Click on any recipe to view its details.
                </p>
                
                <div className="overflow-x-auto">
                    <svg 
                        width={svgWidth} 
                        height={svgHeight} 
                        className="mx-auto"
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    >
                        {/* Define gradients and patterns */}
                        <defs>
                            <linearGradient id="originalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                            <linearGradient id="mergedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon
                                    points="0 0, 10 3.5, 0 7"
                                    fill="#6b7280"
                                />
                            </marker>
                        </defs>

                        {/* Render edges */}
                        {edges.map((edge, index) => {
                            const fromNode = nodes.find(n => n.id === edge.from);
                            const toNode = nodes.find(n => n.id === edge.to);
                            
                            if (!fromNode || !toNode) return null;

                            // Simple straight line from bottom of parent to top of child
                            const x1 = fromNode.x;
                            const y1 = fromNode.y + fromNode.height / 2;
                            const x2 = toNode.x;
                            const y2 = toNode.y - toNode.height / 2;

                            return (
                                <line
                                    key={index}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke="#6b7280"
                                    strokeWidth="2"
                                    markerEnd="url(#arrowhead)"
                                />
                            );
                        })}

                        {/* Render nodes */}
                        {nodes.map(node => (
                            <g key={node.id}>
                                <Link href={`/recipe/${node.id}`}>
                                    <g className="cursor-pointer hover:opacity-80 transition-opacity">
                                        <title>{`Click to view ${node.label}`}</title>
                                        <rect
                                            x={node.x - node.width / 2}
                                            y={node.y - node.height / 2}
                                            width={node.width}
                                            height={node.height}
                                            rx="6"
                                            ry="6"
                                            fill={node.isOriginal ? "url(#originalGradient)" : "url(#mergedGradient)"}
                                            stroke={node.isOriginal ? "#10b981" : "#6366f1"}
                                            strokeWidth="2"
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fill="white"
                                            fontSize="13"
                                            fontWeight="600"
                                            className="select-none"
                                        >
                                            {/* Display full label without truncation */}
                                            {node.label}
                                        </text>
                                    </g>
                                </Link>
                            </g>
                        ))}
                    </svg>
                </div>
                
                <div className="mt-4 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-green-600"></div>
                        <span className="text-gray-600">Original Recipe</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-indigo-600"></div>
                        <span className="text-gray-600">Merged Recipe</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
