// Example: AWS Bedrock Enhanced Agent
// 
// This is a template showing how to create an AI-enhanced agent that uses AWS Bedrock
// instead of rule-based logic. Copy this file and customize for your specific agent type.
//
// To use:
// 1. Copy this file to a new agent (e.g., AWSBedrockSleepAgent.ts)
// 2. Implement the AWS Bedrock edge function (see AWS_INTEGRATION.md)
// 3. Customize the prompt and focus area
// 4. Register in AgentOrchestrator.ts
//
// See: ../../AWS_INTEGRATION.md for complete integration guide

import { AIAgent, AgentContext } from "./types";
import { AgentRecommendation } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export class AWSBedrockAgentExample implements AIAgent {
  id = "AWSBedrockAgentExample";
  name = "AWS Bedrock Agent (Example)";
  description = "AI-powered recommendations using AWS Bedrock models";

  /**
   * Configure the agent
   */
  private config = {
    model: "claude-3-5-sonnet", // or "llama-3.3-70b", "titan-text"
    focus: "general health optimization", // customize per agent type
    maxRecommendations: 3,
    cacheTTL: 3600000, // 1 hour cache to reduce costs
  };

  /**
   * Main analysis method
   * Calls AWS Bedrock edge function for AI-powered recommendations
   */
  async analyze(context: AgentContext): Promise<AgentRecommendation[]> {
    console.log(`[${this.name}] Starting analysis`);

    try {
      // Check cache first (implement caching to reduce AWS costs)
      const cached = this.getCachedRecommendations(context);
      if (cached) {
        console.log(`[${this.name}] Returning cached recommendations`);
        return cached;
      }

      // Call AWS Bedrock edge function
      const { data, error } = await supabase.functions.invoke('aws-bedrock-chat', {
        body: {
          context: this.prepareContext(context),
          focus: this.config.focus,
          model: this.config.model,
          maxRecommendations: this.config.maxRecommendations,
        }
      });

      if (error) {
        console.error(`[${this.name}] Bedrock API error:`, error);
        return this.fallbackRecommendations(context);
      }

      const recommendations = data.recommendations as AgentRecommendation[];
      
      // Cache the results
      this.cacheRecommendations(context, recommendations);

      console.log(`[${this.name}] Generated ${recommendations.length} recommendations`);
      return recommendations;

    } catch (error) {
      console.error(`[${this.name}] Unexpected error:`, error);
      return this.fallbackRecommendations(context);
    }
  }

  /**
   * Prepare context data for AI prompt
   * Customize this to include relevant data for your agent type
   */
  private prepareContext(context: AgentContext) {
    return {
      profile: {
        name: context.profile.name,
        age: context.profile.age,
        goal: context.profile.goal,
        chronotype: context.profile.chronotype,
        examPhase: context.profile.examPhase,
      },
      today: context.today,
      last7Days: context.last7Days,
      baseline: context.baseline,
      
      // Add computed metrics
      trends: this.computeTrends(context),
    };
  }

  /**
   * Compute trends for better AI context
   */
  private computeTrends(context: AgentContext) {
    const { last7Days, baseline } = context;

    const avgHRV = last7Days.reduce((sum, m) => sum + m.hrv, 0) / last7Days.length;
    const avgSleep = last7Days.reduce((sum, m) => sum + m.sleepHours, 0) / last7Days.length;
    const avgStress = last7Days.reduce((sum, m) => sum + m.stressScore, 0) / last7Days.length;

    return {
      hrvTrend: avgHRV > baseline.hrv ? "improving" : "declining",
      sleepTrend: avgSleep > baseline.sleepHours ? "improving" : "declining",
      stressTrend: avgStress < baseline.stressScore ? "improving" : "worsening",
      hrvChange: ((avgHRV - baseline.hrv) / baseline.hrv * 100).toFixed(1),
      sleepChange: ((avgSleep - baseline.sleepHours) / baseline.sleepHours * 100).toFixed(1),
      stressChange: ((avgStress - baseline.stressScore) / baseline.stressScore * 100).toFixed(1),
    };
  }

  /**
   * Fallback recommendations if AWS Bedrock fails
   * Use simple rule-based logic as backup
   */
  private fallbackRecommendations(context: AgentContext): AgentRecommendation[] {
    console.log(`[${this.name}] Using fallback recommendations`);

    const { today, baseline } = context;
    const recommendations: AgentRecommendation[] = [];

    // Example fallback logic
    if (today.hrv < baseline.hrv * 0.9) {
      recommendations.push({
        id: `${this.id}-fallback-${Date.now()}`,
        createdAt: new Date().toISOString(),
        agent: "AWSBedrockAgent",
        type: "alert",
        title: "HRV significantly below baseline",
        rationale: "Your HRV is low, indicating possible overtraining or stress. Consider a rest day.",
        priority: "high",
        actions: [
          { label: "Take Rest Day", kind: "accept" },
          { label: "Ignore", kind: "reject" }
        ]
      });
    }

    return recommendations;
  }

  /**
   * Cache management to reduce API costs
   * Store recommendations in memory or localStorage
   */
  private getCachedRecommendations(context: AgentContext): AgentRecommendation[] | null {
    // TODO: Implement caching logic
    // - Use context date + agent ID as cache key
    // - Check if cache is still valid (within TTL)
    // - Return cached recommendations if valid
    return null;
  }

  private cacheRecommendations(context: AgentContext, recommendations: AgentRecommendation[]) {
    // TODO: Implement caching logic
    // - Store recommendations with timestamp
    // - Include cache expiry time
  }
}

/**
 * Usage example in AgentOrchestrator:
 * 
 * import { AWSBedrockSleepAgent } from "./AWSBedrockSleepAgent";
 * 
 * private registerDefaultAgents() {
 *   // Existing agents...
 *   
 *   // AWS-enhanced agents (optional)
 *   if (this.config.enableAWSAgents) {
 *     this.registerAgent(new AWSBedrockSleepAgent());
 *   }
 * }
 */
