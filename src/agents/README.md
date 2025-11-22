# HealthTwin AI Agent System

This directory contains the modular AI agent architecture that powers HealthTwin's intelligent recommendations.

## Architecture

### Core Concepts

1. **AIAgent Interface** (`types.ts`)
   - Every agent implements the `AIAgent` interface
   - Simple `analyze()` method that takes context and returns recommendations
   - Easy to understand and extend

2. **AgentOrchestrator** (`AgentOrchestrator.ts`)
   - Central coordinator that manages all agents
   - Handles agent registration/unregistration
   - Runs all agents and collects their recommendations

3. **AgentContext** (`types.ts`)
   - Standardized data structure passed to all agents
   - Contains user profile, metrics, and baseline data

## Built-in Agents

1. **PlannerAgent** - Generates daily plans and prioritizes tasks
2. **SleepAgent** - Monitors sleep patterns and provides sleep optimization
3. **FitnessCoachAgent** - Training recommendations based on readiness
4. **BurnoutGuardianAgent** - Monitors for burnout and provides interventions

## Adding Your Own Agent

### Step 1: Create Your Agent File

Create a new file like `src/agents/MyCustomAgent.ts`:

```typescript
import { AIAgent, AgentContext } from "./types";
import { AgentRecommendation } from "@/types";

export class MyCustomAgent implements AIAgent {
  id = "my-custom-agent";
  name = "MyCustomAgent";
  description = "What your agent does";

  analyze(context: AgentContext): AgentRecommendation[] {
    const { profile, today, last7Days, baseline } = context;
    const recommendations: AgentRecommendation[] = [];

    // Your logic here
    if (/* some condition */) {
      recommendations.push({
        id: `my-agent-${Date.now()}`,
        createdAt: new Date().toISOString(),
        agent: "MyCustomAgent", // Must match one of the AgentType values
        type: "training", // or "sleep", "stress", "nutrition", etc.
        title: "Your Recommendation Title",
        rationale: "Why this recommendation is being made",
        priority: "high", // or "medium" or "low"
        actions: [
          { label: "Accept", kind: "accept" },
          { label: "Dismiss", kind: "reject" },
        ],
      });
    }

    return recommendations;
  }
}
```

### Step 2: Register Your Agent

In `AgentOrchestrator.ts`, add your agent to the `registerDefaultAgents()` method:

```typescript
import { MyCustomAgent } from "./MyCustomAgent";

private registerDefaultAgents() {
  this.registerAgent(new PlannerAgent());
  this.registerAgent(new SleepAgent());
  this.registerAgent(new FitnessCoachAgent());
  this.registerAgent(new BurnoutGuardianAgent());
  this.registerAgent(new MyCustomAgent()); // Add your agent
}
```

### Step 3: Add Agent Type (if needed)

If your agent uses a new type name, add it to `src/types/index.ts`:

```typescript
export type AgentType = 
  | "PlannerAgent" 
  | "SleepAgent" 
  | "FitnessCoachAgent" 
  | "BurnoutGuardianAgent"
  | "MyCustomAgent"; // Add your type
```

## Dynamic Agent Registration

You can also register agents dynamically at runtime:

```typescript
import { getAgentOrchestrator } from "@/agents/AgentOrchestrator";
import { MyCustomAgent } from "@/agents/MyCustomAgent";

const orchestrator = getAgentOrchestrator();
orchestrator.registerAgent(new MyCustomAgent());
```

## Example: Nutrition Agent

Here's a complete example of a nutrition tracking agent:

```typescript
import { AIAgent, AgentContext } from "./types";
import { AgentRecommendation } from "@/types";

export class NutritionAgent implements AIAgent {
  id = "nutrition";
  name = "NutritionAgent";
  description = "Provides nutrition recommendations based on training load";

  analyze(context: AgentContext): AgentRecommendation[] {
    const { today, last7Days } = context;
    const recommendations: AgentRecommendation[] = [];

    // Check if high training load but potentially low nutrition
    const avgTrainingLoad = last7Days.reduce((sum, m) => sum + m.trainingLoad, 0) / 7;
    const avgEnergy = last7Days.reduce((sum, m) => sum + m.energyScore, 0) / 7;

    if (avgTrainingLoad > 70 && avgEnergy < 3) {
      recommendations.push({
        id: `nutrition-${Date.now()}`,
        createdAt: new Date().toISOString(),
        agent: "NutritionAgent",
        type: "nutrition",
        title: "Fuel Your Training",
        rationale: "Your training load is high but energy is low. Consider your nutrition timing and quality.",
        priority: "medium",
        actions: [
          { label: "View Meal Ideas", kind: "accept" },
          { label: "Later", kind: "snooze" },
        ],
      });
    }

    return recommendations;
  }
}
```

## Best Practices

1. **Keep agents focused** - Each agent should have one clear responsibility
2. **Use meaningful IDs** - Agent IDs should be unique and descriptive
3. **Provide context** - Always explain why a recommendation is being made
4. **Handle edge cases** - Check for missing or invalid data
5. **Test thoroughly** - Verify your agent works with different data scenarios
6. **Document your logic** - Add comments explaining your decision criteria

## Configuration

You can configure the orchestrator when initializing:

```typescript
import { getAgentOrchestrator } from "@/agents/AgentOrchestrator";

const orchestrator = getAgentOrchestrator({
  analysisInterval: 60000, // How often to run analysis (ms)
  enableProactiveMonitoring: true,
  alertThresholds: {
    hrvDropPercent: 15,
    hrIncreasePercent: 10,
    minSleepHours: 6,
    maxStressScore: 70,
  },
});
```

## Available Data in AgentContext

- `profile: UserProfile` - User's profile settings
- `today: DailyMetrics` - Today's health metrics
- `last7Days: DailyMetrics[]` - Last 7 days of metrics
- `baseline: Baseline` - Calculated baseline values
- `allMetrics: DailyMetrics[]` - All historical metrics

## Need Help?

Check the existing agents for examples, or refer to the type definitions in `types.ts` and `src/types/index.ts`.
