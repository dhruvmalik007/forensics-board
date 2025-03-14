import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils';
import { 
  NeptuneGraphClient, 
  ExecuteQueryCommand,
  ExecuteQueryCommandInput
} from "@aws-sdk/client-neptune-graph";

/**
 * GraphDatabase service for agentic operations using AWS Neptune
 */
export class GraphDatabase {
  private client: NeptuneGraphClient;
  private isConnected: boolean = false;

  /**
   * Create a new GraphDatabase instance
   * @param endpoint Neptune endpoint URL
   */
  constructor(
    private endpoint: string = process.env.NEPTUNE_ENDPOINT || '',
    private region: string = process.env.AWS_REGION || 'us-east-1'
  ) {
    if (!this.endpoint) {
      logger.warn('No Neptune endpoint provided. Graph database operations will not work.');
    }

    // Initialize the Neptune Graph client
    this.client = new NeptuneGraphClient({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  /**
   * Connect to the Neptune database
   */
  async connect(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    try {
      if (!this.endpoint) {
        throw new Error('Neptune endpoint is required for connection');
      }

      logger.info(`Connecting to Neptune at ${this.endpoint}`);
      
      // Test connection with a simple query
      await this.executeGremlinQuery('g.V().limit(1).count()');
      
      this.isConnected = true;
      logger.info('Successfully connected to Neptune');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to connect to Neptune: ${errorMessage}`);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Execute a Gremlin query
   * @param query Gremlin query string
   * @param parameters Query parameters
   * @returns Query results
   */
  private async executeGremlinQuery(query: string, parameters: Record<string, any> = {}): Promise<any> {
    const input: ExecuteGremlinQueryCommandInput = {
      gremlinQuery: query,
      parameters: parameters
    };

    const command = new ExecuteGremlinQueryCommand(input);
    const response = await this.client.send(command);
    
    return response.result;
  }

  /**
   * Execute a Cypher query
   * @param query Cypher query string
   * @param parameters Query parameters
   * @returns Query results
   */
  private async executeCypherQuery(query: string, parameters: Record<string, any> = {}): Promise<any> {
    const input: ExecuteOpenCypherQueryCommandInput = {
      openCypherQuery: query,
      parameters: parameters
    };

    const command = new ExecuteOpenCypherQueryCommand(input);
    const response = await this.client.send(command);
    
    return response.result;
  }

  /**
   * Ensure connection is established before performing operations
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to Neptune database');
      }
    }
  }

  /**
   * Add a node to the graph
   * @param label Node label
   * @param properties Node properties
   * @returns The created node ID
   */
  async addNode(label: string, properties: Record<string, any>): Promise<string> {
    await this.ensureConnection();
    
    try {
      // Generate a unique ID if not provided
      const nodeId = properties.id || uuidv4();
      properties.id = nodeId;
      
      // Add timestamp if not provided
      if (!properties.createdAt) {
        properties.createdAt = new Date().toISOString();
      }
      
      logger.info(`Adding node with label ${label} and ID ${nodeId}`);
      
      // Create the node using Gremlin
      const query = `g.addV('${label}').property('id', '${nodeId}')`;
      
      // Add all properties
      const propertyQueries = Object.entries(properties)
        .filter(([key]) => key !== 'id') // id is already added
        .map(([key, value]) => {
          const valueStr = typeof value === 'string' ? `'${value}'` : value;
          return `.property('${key}', ${valueStr})`;
        })
        .join('');
      
      const fullQuery = query + propertyQueries;
      await this.executeGremlinQuery(fullQuery);
      
      return nodeId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to add node: ${errorMessage}`);
      throw new Error(`Failed to add node: ${errorMessage}`);
    }
  }

  /**
   * Add an edge between two nodes
   * @param fromNodeId Source node ID
   * @param toNodeId Target node ID
   * @param label Edge label
   * @param properties Edge properties
   * @returns The created edge ID
   */
  async addEdge(
    fromNodeId: string, 
    toNodeId: string, 
    label: string, 
    properties: Record<string, any> = {}
  ): Promise<string> {
    await this.ensureConnection();
    
    try {
      // Generate a unique ID if not provided
      const edgeId = properties.id || uuidv4();
      properties.id = edgeId;
      
      // Add timestamp if not provided
      if (!properties.createdAt) {
        properties.createdAt = new Date().toISOString();
      }
      
      logger.info(`Adding edge with label ${label} from ${fromNodeId} to ${toNodeId}`);
      
      // Create the edge using Gremlin
      let query = `g.V().has('id', '${fromNodeId}').addE('${label}').to(g.V().has('id', '${toNodeId}')).property('id', '${edgeId}')`;
      
      // Add all properties
      const propertyQueries = Object.entries(properties)
        .filter(([key]) => key !== 'id') // id is already added
        .map(([key, value]) => {
          const valueStr = typeof value === 'string' ? `'${value}'` : value;
          return `.property('${key}', ${valueStr})`;
        })
        .join('');
      
      const fullQuery = query + propertyQueries;
      await this.executeGremlinQuery(fullQuery);
      
      return edgeId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to add edge: ${errorMessage}`);
      throw new Error(`Failed to add edge: ${errorMessage}`);
    }
  }

  /**
   * Get a node by ID
   * @param nodeId Node ID
   * @returns The node properties
   */
  async getNode(nodeId: string): Promise<Record<string, any> | null> {
    await this.ensureConnection();
    
    try {
      logger.info(`Getting node with ID ${nodeId}`);
      
      const query = `g.V().has('id', '${nodeId}').valueMap(true)`;
      const result = await this.executeGremlinQuery(query);
      
      if (!result || result.length === 0) {
        return null;
      }
      
      return this.formatNodeResult(result[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get node: ${errorMessage}`);
      throw new Error(`Failed to get node: ${errorMessage}`);
    }
  }

  /**
   * Get nodes by label
   * @param label Node label
   * @param limit Maximum number of nodes to return
   * @returns Array of node properties
   */
  async getNodesByLabel(label: string, limit: number = 100): Promise<Record<string, any>[]> {
    await this.ensureConnection();
    
    try {
      logger.info(`Getting nodes with label ${label} (limit: ${limit})`);
      
      const query = `g.V().hasLabel('${label}').limit(${limit}).valueMap(true)`;
      const result = await this.executeGremlinQuery(query);
      
      if (!result || result.length === 0) {
        return [];
      }
      
      return result.map((node: any) => this.formatNodeResult(node));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get nodes by label: ${errorMessage}`);
      throw new Error(`Failed to get nodes by label: ${errorMessage}`);
    }
  }

  /**
   * Get nodes connected to a node
   * @param nodeId Node ID
   * @param direction 'out' for outgoing edges, 'in' for incoming edges, 'both' for both
   * @param edgeLabel Optional edge label to filter by
   * @param limit Maximum number of nodes to return
   * @returns Array of connected nodes with their edge properties
   */
  async getConnectedNodes(
    nodeId: string, 
    direction: 'out' | 'in' | 'both' = 'out',
    edgeLabel?: string,
    limit: number = 100
  ): Promise<Array<{node: Record<string, any>, edge: Record<string, any>}>> {
    await this.ensureConnection();
    
    try {
      logger.info(`Getting ${direction} connected nodes for ${nodeId}`);
      
      let query = `g.V().has('id', '${nodeId}')`;
      
      if (direction === 'out') {
        query += edgeLabel 
          ? `.outE('${edgeLabel}').as('e').inV().as('v')`
          : `.outE().as('e').inV().as('v')`;
      } else if (direction === 'in') {
        query += edgeLabel 
          ? `.inE('${edgeLabel}').as('e').outV().as('v')`
          : `.inE().as('e').outV().as('v')`;
      } else {
        query += edgeLabel 
          ? `.bothE('${edgeLabel}').as('e').otherV().as('v')`
          : `.bothE().as('e').otherV().as('v')`;
      }
      
      query += `.select('v', 'e').by(valueMap(true)).by(valueMap(true)).limit(${limit})`;
      
      const result = await this.executeGremlinQuery(query);
      
      if (!result || result.length === 0) {
        return [];
      }
      
      return result.map((item: any) => ({
        node: this.formatNodeResult(item.v),
        edge: this.formatEdgeResult(item.e)
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get connected nodes: ${errorMessage}`);
      throw new Error(`Failed to get connected nodes: ${errorMessage}`);
    }
  }

  /**
   * Search for nodes by property value
   * @param property Property name
   * @param value Property value
   * @param limit Maximum number of nodes to return
   * @returns Array of matching nodes
   */
  async searchNodes(property: string, value: any, limit: number = 100): Promise<Record<string, any>[]> {
    await this.ensureConnection();
    
    try {
      logger.info(`Searching nodes with ${property}=${value}`);
      
      const valueStr = typeof value === 'string' ? `'${value}'` : value;
      const query = `g.V().has('${property}', ${valueStr}).limit(${limit}).valueMap(true)`;
      
      const result = await this.executeGremlinQuery(query);
      
      if (!result || result.length === 0) {
        return [];
      }
      
      return result.map((node: any) => this.formatNodeResult(node));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to search nodes: ${errorMessage}`);
      throw new Error(`Failed to search nodes: ${errorMessage}`);
    }
  }

  /**
   * Find paths between two nodes
   * @param fromNodeId Source node ID
   * @param toNodeId Target node ID
   * @param maxDepth Maximum path depth
   * @returns Array of paths, each containing nodes and edges
   */
  async findPaths(
    fromNodeId: string, 
    toNodeId: string, 
    maxDepth: number = 5
  ): Promise<Array<{nodes: Record<string, any>[], edges: Record<string, any>[]}>
  > {
    await this.ensureConnection();
    
    try {
      logger.info(`Finding paths from ${fromNodeId} to ${toNodeId} (max depth: ${maxDepth})`);
      
      // Use path finding algorithm
      const query = `
        g.V().has('id', '${fromNodeId}')
          .repeat(both().simplePath())
          .until(has('id', '${toNodeId}').or().loops().is(gt(${maxDepth})))
          .hasId('${toNodeId}')
          .path()
      `;
      
      const result = await this.executeGremlinQuery(query);
      
      if (!result || result.length === 0) {
        return [];
      }
      
      // Format the results
      return result.map((path: any) => {
        const pathObjects = path.objects;
        const nodes: Record<string, any>[] = [];
        const edges: Record<string, any>[] = [];
        
        pathObjects.forEach((obj: any, index: number) => {
          if (index % 2 === 0) {
            // Even indices are vertices
            nodes.push(this.formatNodeResult(obj));
          } else {
            // Odd indices are edges
            edges.push(this.formatEdgeResult(obj));
          }
        });
        
        return { nodes, edges };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to find paths: ${errorMessage}`);
      throw new Error(`Failed to find paths: ${errorMessage}`);
    }
  }

  /**
   * Delete a node and all its edges
   * @param nodeId Node ID
   * @returns True if successful
   */
  async deleteNode(nodeId: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      logger.info(`Deleting node with ID ${nodeId}`);
      
      const query = `g.V().has('id', '${nodeId}').drop()`;
      await this.executeGremlinQuery(query);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to delete node: ${errorMessage}`);
      throw new Error(`Failed to delete node: ${errorMessage}`);
    }
  }

  /**
   * Delete an edge
   * @param edgeId Edge ID
   * @returns True if successful
   */
  async deleteEdge(edgeId: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      logger.info(`Deleting edge with ID ${edgeId}`);
      
      const query = `g.E().has('id', '${edgeId}').drop()`;
      await this.executeGremlinQuery(query);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to delete edge: ${errorMessage}`);
      throw new Error(`Failed to delete edge: ${errorMessage}`);
    }
  }

  /**
   * Store transaction data in the graph database
   * @param transaction Transaction data
   * @returns The transaction node ID
   */
  async storeTransaction(transaction: {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: string;
    chain: string;
    blockNumber: number;
    category?: string;
  }): Promise<string> {
    await this.ensureConnection();
    
    try {
      logger.info(`Storing transaction ${transaction.hash}`);
      
      // Create or get sender node
      let senderNode = await this.getNode(transaction.from);
      if (!senderNode) {
        await this.addNode('Address', {
          id: transaction.from,
          address: transaction.from,
          type: 'address',
          firstSeen: transaction.timestamp,
          chains: [transaction.chain]
        });
      } else if (senderNode.chains && !senderNode.chains.includes(transaction.chain)) {
        // Update chains if this is a new chain for this address
        const chains = [...senderNode.chains, transaction.chain];
        await this.updateNodeProperty(transaction.from, 'chains', chains);
      }
      
      // Create or get receiver node
      let receiverNode = await this.getNode(transaction.to);
      if (!receiverNode) {
        await this.addNode('Address', {
          id: transaction.to,
          address: transaction.to,
          type: 'address',
          firstSeen: transaction.timestamp,
          chains: [transaction.chain]
        });
      } else if (receiverNode.chains && !receiverNode.chains.includes(transaction.chain)) {
        // Update chains if this is a new chain for this address
        const chains = [...receiverNode.chains, transaction.chain];
        await this.updateNodeProperty(transaction.to, 'chains', chains);
      }
      
      // Create transaction node
      const txNodeId = await this.addNode('Transaction', {
        id: transaction.hash,
        hash: transaction.hash,
        value: transaction.value,
        timestamp: transaction.timestamp,
        chain: transaction.chain,
        blockNumber: transaction.blockNumber,
        category: transaction.category || 'transfer'
      });
      
      // Create edges
      await this.addEdge(transaction.from, txNodeId, 'SENT', {
        timestamp: transaction.timestamp
      });
      
      await this.addEdge(txNodeId, transaction.to, 'RECEIVED', {
        timestamp: transaction.timestamp
      });
      
      return txNodeId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to store transaction: ${errorMessage}`);
      throw new Error(`Failed to store transaction: ${errorMessage}`);
    }
  }

  /**
   * Update a property on a node
   * @param nodeId Node ID
   * @param property Property name
   * @param value New property value
   * @returns True if successful
   */
  async updateNodeProperty(nodeId: string, property: string, value: any): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      logger.info(`Updating property ${property} on node ${nodeId}`);
      
      const valueStr = typeof value === 'string' 
        ? `'${value}'` 
        : Array.isArray(value) 
          ? JSON.stringify(value) 
          : value;
      
      const query = `g.V().has('id', '${nodeId}').property('${property}', ${valueStr})`;
      await this.executeGremlinQuery(query);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to update node property: ${errorMessage}`);
      throw new Error(`Failed to update node property: ${errorMessage}`);
    }
  }

  /**
   * Format node result from Neptune
   * @param nodeResult Raw node result from Neptune
   * @returns Formatted node properties
   */
  private formatNodeResult(nodeResult: any): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Handle different response formats
    if (typeof nodeResult === 'object' && nodeResult !== null) {
      // Extract all properties
      Object.entries(nodeResult).forEach(([key, value]) => {
        if (key === 'T.label') {
          result.label = Array.isArray(value) ? value[0] : value;
        } else if (key === 'T.id') {
          result.neptune_id = Array.isArray(value) ? value[0] : value;
        } else {
          result[key] = Array.isArray(value) && value.length === 1 ? value[0] : value;
        }
      });
    }
    
    return result;
  }

  /**
   * Format edge result from Neptune
   * @param edgeResult Raw edge result from Neptune
   * @returns Formatted edge properties
   */
  private formatEdgeResult(edgeResult: any): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Handle different response formats
    if (typeof edgeResult === 'object' && edgeResult !== null) {
      // Extract all properties
      Object.entries(edgeResult).forEach(([key, value]) => {
        if (key === 'T.label') {
          result.label = Array.isArray(value) ? value[0] : value;
        } else if (key === 'T.id') {
          result.neptune_id = Array.isArray(value) ? value[0] : value;
        } else {
          result[key] = Array.isArray(value) && value.length === 1 ? value[0] : value;
        }
      });
    }
    
    return result;
  }
} 