import { AIAgent, AgentContext } from "./types";
import { AgentRecommendation } from "@/types";

export class SleepAgent implements AIAgent {
  id = "sleep";
  name = "SleepAgent";
  description = "Monitors sleep patterns and provides sleep optimization recommendations";

  analyze(context: AgentContext): AgentRecommendation[] {
    const { last7Days, baseline } = context;
    const recommendations: AgentRecommendation[] = [];

    const sleepDebt = baseline.sleepHours * 7 - last7Days.reduce((sum, m) => sum + m.sleepHours, 0);

    if (sleepDebt > 3) {
      recommendations.push({
        id: `sleep-${Date.now()}`,
        createdAt: new Date().toISOString(),
        agent: "SleepAgent",
        type: "sleep",
        title: "Sleep Debt Detected",
        rationale: `You're ${sleepDebt.toFixed(1)}hrs behind on sleep this week. This affects recovery and performance.`,
        priority: "high",
        actions: [
          { label: "Set Early Bedtime", kind: "accept" },
          { label: "Remind Me Later", kind: "snooze" },
        ],
      });
    }

    // Check sleep efficiency
    const avgSleepEfficiency = last7Days.reduce((sum, m) => sum + m.sleepEfficiency, 0) / last7Days.length;
    if (avgSleepEfficiency < 80) {
      recommendations.push({
        id: `sleep-efficiency-${Date.now()}`,
        createdAt: new Date().toISOString(),
        agent: "SleepAgent",
        type: "sleep",
        title: "Poor Sleep Quality",
        rationale: `Your average sleep efficiency is ${avgSleepEfficiency.toFixed(0)}%. Try improving your sleep hygiene.`,
        priority: "medium",
        actions: [
          { label: "View Tips", kind: "accept" },
          { label: "Dismiss", kind: "reject" },
        ],
      });
    }

    return recommendations;
  }
}
