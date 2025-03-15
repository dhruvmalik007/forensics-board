import { DuneClient, RunQueryArgs, QueryParameter } from "@duneanalytics/client-sdk";
import { constructCachedAsyncFn } from "./CachedFunction";

// Initialize Dune client
const getDuneClient = () => {
  const duneApiKey = process.env.DUNE_API_KEY;
  if (!duneApiKey) {
    throw new Error("DUNE_API_KEY environment variable is required");
  }
  return new DuneClient(duneApiKey);
};

// Base function to run a Dune query
const runDuneQueryBase = async (args: RunQueryArgs) => {
  const client = getDuneClient();
  const response = await client.runQuery(args);
  return response;
};

// Cache time for Dune queries (5 days by default)
const DUNE_CACHE_TIME = 432000; // seconds

/**
 * Runs a Dune query with caching
 * Cache key is generated from the query ID and parameters
 * Cache duration is 5 minutes by default
 */
export const runDuneQuery = constructCachedAsyncFn(
  runDuneQueryBase,
  DUNE_CACHE_TIME,
  // Custom serialization for cache key to handle complex query parameters
  (args: RunQueryArgs) => {
    const { queryId, query_parameters } = args;
    // Create a deterministic string from query ID and parameters
    return `dune:${queryId}:${JSON.stringify(query_parameters || {})}`
  }
); 