import { AIAgent, AgentContext } from "./types";
import { AgentRecommendation } from "@/types";
import { computeBurnoutRisk, detectAnomalies } from "@/lib/metrics";

export class BurnoutGuardianAgent implements AIAgent {
  id = "burnout-guardian";
  name = "BurnoutGuardianAgent";
  description = "Monitors for signs of burnout and overtraining, provides preventive interventions";

  analyze(context: AgentContext): AgentRecommendation[] {
    const { today, last7Days, baseline } = context;
    const recommendations: AgentRecommendation[] = [];

    const burnout = computeBurnoutRisk(last7Days, baseline);
    const anomalies = detectAnomalies(today, baseline);

    // Burnout risk alerts
    if (burnout.level === "Yellow" || burnout.level === "Red") {
      recommendations.push({
        id: `burnout-${Date.now()}`,
        createdAt: new Date().toISOString(),
        agent: "BurnoutGuardianAgent",
        type: "stress",
        title: `Burnout Risk: ${burnout.level}`,
        rationale: burnout.rationale.join(". "),
        priority: "high",
        actions: [
          { label: "View Actions", kind: "accept" },
          { label: "Dismiss", kind: "reject" },
        ],
      });
    }

    // Stress alerts
    if (today.stressScore > 70) {
      recommendations.push({
        id: `stress-${Date.now()}`,
        createdAt: new Date().toISOString(),
        agent: "BurnoutGuardianAgent",
        type: "stress",
        title: "Stress Relief Needed",
        rationale: "Your stress is elevated. Try a 5-min breathing exercise.",
        priority: "medium",
        actions: [
          { label: "Start Breathing", kind: "accept" },
          { label: "Later", kind: "snooze" },
        ],
      });
    }

    // Anomaly alerts
    anomalies.forEach((anomaly, idx) => {
      recommendations.push({
        id: `anomaly-${Date.now()}-${idx}`,
        createdAt: new Date().toISOString(),
        agent: "BurnoutGuardianAgent",
        type: "alert",
        title: `Alert: ${anomaly.metric}`,
        rationale: `${anomaly.deviation}. ${anomaly.cause}. Suggestion: ${anomaly.suggestion}`,
        priority: "high",
      });
    });

    return recommendations;
  }
}
