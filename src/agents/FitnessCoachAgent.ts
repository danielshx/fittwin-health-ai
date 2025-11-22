import { AIAgent, AgentContext } from "./types";
import { AgentRecommendation } from "@/types";
import { computeReadiness, computeBurnoutRisk } from "@/lib/metrics";

export class FitnessCoachAgent implements AIAgent {
  id = "fitness-coach";
  name = "FitnessCoachAgent";
  description = "Provides training recommendations based on readiness and recovery status";

  analyze(context: AgentContext): AgentRecommendation[] {
    const { profile, today, last7Days, baseline } = context;
    const recommendations: AgentRecommendation[] = [];

    const readiness = computeReadiness(today, baseline, last7Days);
    const burnout = computeBurnoutRisk(last7Days, baseline);

    // Determine training recommendation
    if (burnout.level === "Red" || readiness.score < 40) {
      recommendations.push({
        id: `fitness-${Date.now()}`,
        createdAt: new Date().toISOString(),
        agent: "FitnessCoachAgent",
        type: "training",
        title: "Recovery Day Recommended",
        rationale: "Your body needs rest. Light walking or stretching only today.",
        priority: "high",
        actions: [
          { label: "Accept Rest Day", kind: "accept" },
          { label: "Light Activity", kind: "snooze" },
        ],
      });
    } else if (readiness.score >= 80 && today.trainingLoad < 60) {
      const intensity = Math.random() > 0.5 ? "HIIT" : "Strength";
      recommendations.push({
        id: `fitness-${Date.now()}`,
        createdAt: new Date().toISOString(),
        agent: "FitnessCoachAgent",
        type: "training",
        title: `${intensity} Session Today`,
        rationale: "You're well-recovered. Great day for a quality session.",
        priority: "medium",
        actions: [
          { label: "Start Workout", kind: "accept" },
          { label: "Do Later", kind: "snooze" },
        ],
      });
    }

    return recommendations;
  }
}
