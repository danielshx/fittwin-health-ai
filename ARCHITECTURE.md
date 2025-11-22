# HealthTwin Architecture

## Project Overview

HealthTwin is a proactive multi-agent AI health companion that helps users optimize their fitness, recovery, and prevent burnout through intelligent health monitoring and personalized recommendations.

## Key Changes (Latest Refactoring)

### 1. **Project Rename: FitTwin → HealthTwin**
All references throughout the codebase have been updated to reflect the new name.

### 2. **New Modular AI Agent System**

The project now features a modern, extensible agent architecture that makes it easy to add custom AI agents.

#### Core Components

**`src/agents/`** - New directory containing the agent system:

- **`types.ts`** - Core interfaces and types
  - `AIAgent` interface - Base interface all agents must implement
  - `AgentContext` - Standardized data structure passed to agents
  - `AgentConfig` - Configuration options for the agent system

- **`AgentOrchestrator.ts`** - Central coordinator
  - Manages agent registration/unregistration
  - Runs all agents and collects recommendations
  - Singleton pattern for global access

- **Built-in Agents:**
  - `PlannerAgent.ts` - Daily planning and task prioritization
  - `SleepAgent.ts` - Sleep optimization and monitoring
  - `FitnessCoachAgent.ts` - Training recommendations
  - `BurnoutGuardianAgent.ts` - Burnout prevention and stress management

- **`README.md`** - Complete guide for adding custom agents

#### Key Features

✅ **Easy to Extend** - Simple interface to implement custom agents  
✅ **Modular** - Each agent is independent and focused  
✅ **Dynamic Registration** - Add/remove agents at runtime  
✅ **Type-Safe** - Full TypeScript support  
✅ **Backwards Compatible** - Legacy code still works  

## How to Add Your Own AI Agent

1. Create a new file in `src/agents/` (e.g., `MyAgent.ts`)
2. Implement the `AIAgent` interface
3. Register it in `AgentOrchestrator.ts`
4. Your agent will automatically run with the others!

See `src/agents/README.md` for detailed instructions and examples.

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         AgentOrchestrator               │
│  (Coordinates all AI agents)            │
└───────────┬─────────────────────────────┘
            │
            ├──────► PlannerAgent
            │        (Daily planning)
            │
            ├──────► SleepAgent
            │        (Sleep optimization)
            │
            ├──────► FitnessCoachAgent
            │        (Training recommendations)
            │
            ├──────► BurnoutGuardianAgent
            │        (Burnout prevention)
            │
            └──────► [Your Custom Agent]
                     (Add your own logic!)
```

## File Structure

```
src/
├── agents/                    # NEW: Modular AI agent system
│   ├── types.ts              # Core interfaces
│   ├── AgentOrchestrator.ts  # Central coordinator
│   ├── PlannerAgent.ts       # Daily planning
│   ├── SleepAgent.ts         # Sleep monitoring
│   ├── FitnessCoachAgent.ts  # Fitness coaching
│   ├── BurnoutGuardianAgent.ts # Burnout prevention
│   └── README.md             # Agent development guide
│
├── components/               # UI components
│   ├── ui/                  # shadcn components
│   ├── ReadinessCard.tsx
│   ├── TwinAvatar.tsx
│   ├── BurnoutRiskCard.tsx
│   ├── DailyPlanCard.tsx
│   ├── AgentRecommendationCard.tsx
│   ├── CoachSelector.tsx
│   ├── ProactiveMonitor.tsx
│   └── ...
│
├── lib/                      # Utilities
│   ├── agentLoop.ts         # REFACTORED: Now uses AgentOrchestrator
│   ├── agentMonitoring.ts   # Proactive health monitoring
│   ├── metrics.ts           # NEW: Metric calculations
│   ├── storage.ts           # Local storage
│   ├── calendarParser.ts    # Calendar integration
│   └── mockData.ts
│
├── pages/                    # Application pages
│   ├── Dashboard.tsx
│   ├── Coach.tsx
│   ├── Timeline.tsx
│   ├── Insights.tsx
│   ├── Simulate.tsx
│   ├── Settings.tsx         # NEW: Settings page
│   ├── Onboarding.tsx
│   └── ...
│
├── types/                    # Type definitions
│   ├── index.ts             # Core types
│   └── coach.ts             # Coach personalities
│
└── App.tsx                   # Main app component
```

## Data Flow

```
User Data (Metrics, Profile)
        ↓
AgentOrchestrator.analyze()
        ↓
AgentContext (standardized data)
        ↓
┌───────────────────────────────┐
│ Each Agent analyzes context   │
│ and returns recommendations   │
└───────────────────────────────┘
        ↓
Combined Recommendations
        ↓
UI displays recommendations
```

## Technology Stack

- **Framework:** React + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **State:** React Query + Local Storage
- **Routing:** React Router
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Backend:** Supabase (Lovable Cloud)
- **AI:** OpenAI (for voice agent)

## Key Metrics

The system tracks these daily metrics:
- Sleep hours & efficiency
- HRV (Heart Rate Variability)
- Resting heart rate
- Steps
- Training load
- Stress score
- Mood & energy scores

## Next Steps

1. **Add Your First Custom Agent**
   - See `src/agents/README.md`
   - Example: Nutrition tracking, hydration monitoring, etc.

2. **Enhance Existing Agents**
   - Add more sophisticated logic
   - Integrate external data sources
   - Implement ML models

3. **Extend the UI**
   - Create visualizations for agent insights
   - Add agent configuration interface
   - Build agent performance dashboard

## Contributing

When adding new features:
1. Keep agents focused and modular
2. Use TypeScript for type safety
3. Follow the existing code style
4. Update this documentation
5. Test thoroughly with different data scenarios

## Support

For questions about the agent system, refer to:
- `src/agents/README.md` - Agent development guide
- `src/agents/types.ts` - Interface definitions
- Existing agents - Real working examples
