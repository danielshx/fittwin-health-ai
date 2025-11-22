import { DailyMetrics, UserProfile, Baseline, AgentRecommendation } from "@/types";

/**
 * Base interface that all AI agents must implement
 * This makes it easy to add new custom agents
 */
export interface AIAgent {
  /** Unique identifier for the agent */
  id: string;
  
  /** Display name of the agent */
  name: string;
  
  /** Short description of what this agent does */
  description: string;
  
  /**
   * Main analysis method - each agent analyzes data and returns recommendations
   * @param context - All the data the agent needs to make decisions
   * @returns Array of recommendations from this agent
   */
  analyze(context: AgentContext): AgentRecommendation[];
}

/**
 * Context passed to each agent containing all necessary data
 */
export interface AgentContext {
  profile: UserProfile;
  today: DailyMetrics;
  last7Days: DailyMetrics[];
  baseline: Baseline;
  allMetrics: DailyMetrics[];
}

/**
 * Configuration for the agent system
 */
export interface AgentConfig {
  /** How often to run agent analysis (in milliseconds) */
  analysisInterval?: number;
  
  /** Whether to enable proactive monitoring */
  enableProactiveMonitoring?: boolean;
  
  /** Threshold for triggering alerts */
  alertThresholds?: {
    hrvDropPercent?: number;
    hrIncreasePercent?: number;
    minSleepHours?: number;
    maxStressScore?: number;
  };
}
