# AWS Integration Guide for HealthTwin

This guide explains how to integrate AWS Bedrock (AI) and AWS S3 (Storage) with the HealthTwin agent system.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [AWS Bedrock Integration](#aws-bedrock-integration)
- [AWS S3 Integration](#aws-s3-integration)
- [Agent System Architecture](#agent-system-architecture)
- [Edge Functions Setup](#edge-functions-setup)
- [Testing](#testing)

---

## Overview

HealthTwin uses a modular AI agent system that can be enhanced with AWS services:

- **AWS Bedrock**: Use Claude, Llama, or other models for intelligent health recommendations
- **AWS S3**: Store health metrics, wearable data exports, and user files

### Current Agent System
The app uses TypeScript agents that analyze health data:
- `PlannerAgent` - Daily planning
- `SleepAgent` - Sleep optimization
- `FitnessCoachAgent` - Training recommendations
- `BurnoutGuardianAgent` - Stress monitoring
- `PredictiveAnalyticsAgent` - Future health predictions
- And 5 more specialized agents

**Integration Goal**: Enhance these agents with AWS Bedrock AI models for more intelligent recommendations.

---

## Prerequisites

### AWS Account Setup
1. Create AWS account at https://aws.amazon.com
2. Create IAM user with permissions for:
   - Amazon Bedrock (for AI models)
   - Amazon S3 (for storage)
3. Generate Access Key ID and Secret Access Key

### Required AWS Credentials
Store these as Supabase secrets (already configured in this project):

```bash
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1  # or your preferred region
AWS_S3_BUCKET_NAME=healthtwin-data
```

### Enable Bedrock Models
In AWS Console:
1. Navigate to Amazon Bedrock
2. Go to "Model access"
3. Enable models you want to use:
   - `anthropic.claude-3-5-sonnet-20241022-v2:0` (recommended)
   - `meta.llama3-3-70b-instruct-v1:0`
   - `amazon.titan-text-premier-v1:0`

---

## AWS Bedrock Integration

### Architecture Overview

```
User Request → Frontend → Edge Function → AWS Bedrock → Agent Response
                    ↓
              Supabase Database (store results)
```

### Edge Function: `aws-bedrock-chat`

**Purpose**: Call AWS Bedrock models for AI-powered health recommendations

**Location**: `supabase/functions/aws-bedrock-chat/index.ts`

**Key Features**:
- Stream responses from Bedrock models
- Handle multiple model types (Claude, Llama, Titan)
- Format health data context for AI prompts
- Return structured recommendations

**Implementation Steps**:

1. **Install AWS SDK** (add to edge function):
```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
```

2. **Initialize Bedrock Client**:
```typescript
const client = new BedrockRuntimeClient({
  region: Deno.env.get('AWS_REGION'),
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
});
```

3. **Create Prompt with Health Context**:
```typescript
const healthContext = `
User Profile: ${JSON.stringify(profile)}
Today's Metrics: ${JSON.stringify(todayMetrics)}
Last 7 Days Trend: ${JSON.stringify(last7Days)}
Baseline: ${JSON.stringify(baseline)}
`;

const prompt = `You are a health coach AI. Analyze this data and provide 3 specific recommendations:

${healthContext}

Focus on: ${focus} (e.g., "sleep optimization", "training intensity", "stress management")
`;
```

4. **Call Bedrock Model**:
```typescript
const command = new InvokeModelCommand({
  modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  body: JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  }),
  contentType: "application/json",
  accept: "application/json"
});

const response = await client.send(command);
const responseBody = JSON.parse(new TextDecoder().decode(response.body));
```

5. **Parse and Structure Response**:
```typescript
const aiRecommendations = responseBody.content[0].text;

// Convert AI text to AgentRecommendation format
const recommendations: AgentRecommendation[] = parseAIResponse(aiRecommendations);

return new Response(JSON.stringify({ recommendations }), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

### Integration with Existing Agents

**Option 1: Hybrid Approach** (Recommended)
- Keep existing TypeScript agents for fast, rule-based logic
- Use AWS Bedrock for complex reasoning and personalization

```typescript
// In AgentOrchestrator.ts
export class AgentOrchestrator {
  async analyzeWithAI(context: AgentContext, focus: string): Promise<AgentRecommendation[]> {
    // Call AWS Bedrock edge function
    const response = await supabase.functions.invoke('aws-bedrock-chat', {
      body: {
        context,
        focus,
        model: 'claude-3-5-sonnet'
      }
    });
    
    return response.data.recommendations;
  }
}
```

**Option 2: Full AI Replacement**
- Replace specific agents with AI-powered versions
- Create `AIEnhancedSleepAgent`, `AIEnhancedFitnessAgent`, etc.

```typescript
export class AIEnhancedSleepAgent implements AIAgent {
  async analyze(context: AgentContext): Promise<AgentRecommendation[]> {
    // Call Bedrock for sleep analysis
    const aiRecs = await callBedrockEdgeFunction(context, 'sleep optimization');
    return aiRecs;
  }
}
```

### Recommended Models by Use Case

| Agent Type | Best Bedrock Model | Why |
|-----------|-------------------|-----|
| SleepAgent | Claude 3.5 Sonnet | Best reasoning for complex sleep patterns |
| FitnessCoachAgent | Claude 3.5 Sonnet | Understands training periodization |
| BurnoutGuardianAgent | Claude 3.5 Sonnet | Excellent at emotional intelligence |
| PredictiveAnalyticsAgent | Claude 3.5 Sonnet | Strong at data analysis and trends |
| BreathingCoachAgent | Llama 3.3 70B | Fast responses for real-time guidance |

---

## AWS S3 Integration

### Use Cases for S3 Storage

1. **Daily Metrics Backup**
   - Auto-backup `DailyMetrics[]` to S3 daily
   - Enable long-term trend analysis
   - Export data for research or sharing

2. **Wearable Data Exports**
   - Store raw wearable data (Garmin, Whoop, Oura exports)
   - Keep full fidelity data beyond local storage limits

3. **User Files**
   - Sleep environment photos
   - Food/meal photos for nutrition tracking
   - Training logs and exercise videos

4. **Generated Reports**
   - PDF health reports
   - Monthly progress summaries
   - AI-generated insights documents

### Edge Function: `s3-upload`

**Purpose**: Upload files to S3 with proper organization

**Implementation Steps**:

1. **Install AWS SDK**:
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
```

2. **Initialize S3 Client**:
```typescript
const s3Client = new S3Client({
  region: Deno.env.get('AWS_REGION'),
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
});
```

3. **Upload with User-Specific Paths**:
```typescript
const userId = 'user-123'; // from auth context
const timestamp = new Date().toISOString();
const key = `users/${userId}/metrics/${timestamp}.json`;

const command = new PutObjectCommand({
  Bucket: Deno.env.get('AWS_S3_BUCKET_NAME'),
  Key: key,
  Body: JSON.stringify(metricsData),
  ContentType: 'application/json',
  Metadata: {
    'user-id': userId,
    'data-type': 'daily-metrics',
    'uploaded-at': timestamp
  }
});

await s3Client.send(command);
```

### Edge Function: `s3-download`

**Purpose**: Retrieve files from S3

```typescript
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const command = new GetObjectCommand({
  Bucket: Deno.env.get('AWS_S3_BUCKET_NAME'),
  Key: fileKey,
});

const response = await s3Client.send(command);
const data = await response.Body?.transformToString();
```

### Recommended S3 Bucket Structure

```
healthtwin-data/
├── users/
│   ├── {userId}/
│   │   ├── metrics/
│   │   │   ├── 2025-01-01.json
│   │   │   ├── 2025-01-02.json
│   │   ├── wearable-exports/
│   │   │   ├── garmin-2025-01.zip
│   │   │   ├── whoop-2025-01.csv
│   │   ├── photos/
│   │   │   ├── sleep-environment/
│   │   │   ├── meals/
│   │   ├── reports/
│   │   │   ├── monthly-2025-01.pdf
│   │   │   ├── annual-2024.pdf
```

### Integration with Frontend

**Upload Metrics Example**:
```typescript
// In a React component or utility function
async function backupMetricsToS3(metrics: DailyMetrics[]) {
  const { data, error } = await supabase.functions.invoke('s3-upload', {
    body: {
      data: metrics,
      path: 'metrics',
      filename: `backup-${new Date().toISOString()}.json`
    }
  });
  
  if (error) {
    console.error('S3 backup failed:', error);
    return;
  }
  
  console.log('Backed up to S3:', data.url);
}
```

---

## Agent System Architecture

### Current Implementation

```
AgentOrchestrator
├── PlannerAgent (daily planning)
├── SleepAgent (sleep optimization)
├── FitnessCoachAgent (training advice)
├── BurnoutGuardianAgent (stress monitoring)
├── PredictiveAnalyticsAgent (future predictions)
├── ContextAwarenessAgent (location/weather context)
├── BreathingCoachAgent (breathing exercises)
├── SleepEnvironmentAgent (sleep conditions)
├── RecoveryPredictionAgent (recovery timeline)
└── InjuryRiskAgent (injury prevention)
```

### Adding AWS-Enhanced Agents

1. **Create new agent files in `src/agents/`**:
```typescript
// src/agents/AWSBedrockSleepAgent.ts
import { AIAgent, AgentContext } from "./types";
import { AgentRecommendation } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export class AWSBedrockSleepAgent implements AIAgent {
  id = "AWSBedrockSleepAgent";
  name = "AWS Bedrock Sleep Agent";
  description = "AI-powered sleep recommendations using Claude 3.5 Sonnet";

  async analyze(context: AgentContext): Promise<AgentRecommendation[]> {
    try {
      const { data, error } = await supabase.functions.invoke('aws-bedrock-chat', {
        body: {
          context,
          focus: 'sleep optimization',
          agentType: 'sleep',
          model: 'claude-3-5-sonnet'
        }
      });

      if (error) throw error;
      return data.recommendations;
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return [];
    }
  }
}
```

2. **Register in AgentOrchestrator**:
```typescript
// src/agents/AgentOrchestrator.ts
import { AWSBedrockSleepAgent } from "./AWSBedrockSleepAgent";

private registerDefaultAgents() {
  // Existing agents...
  
  // AWS-enhanced agents (optional - enable via config)
  if (this.config.enableAWSAgents) {
    this.registerAgent(new AWSBedrockSleepAgent());
  }
}
```

3. **Toggle between local and AWS agents via config**:
```typescript
const orchestrator = getAgentOrchestrator({
  enableAWSAgents: true, // Use AWS Bedrock for enhanced agents
  analysisInterval: 60000,
});
```

---

## Edge Functions Setup

### Required Edge Functions

Create these in `supabase/functions/`:

1. **`aws-bedrock-chat/index.ts`** - AI recommendations
2. **`s3-upload/index.ts`** - File uploads
3. **`s3-download/index.ts`** - File retrieval
4. **`s3-list/index.ts`** - List user files

### Configuration

**`supabase/config.toml`** additions:
```toml
[functions.aws-bedrock-chat]
verify_jwt = true  # Require authentication

[functions.s3-upload]
verify_jwt = true

[functions.s3-download]
verify_jwt = true

[functions.s3-list]
verify_jwt = true
```

### Required Secrets

Add via Lovable Cloud UI or Supabase CLI:
```bash
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_S3_BUCKET_NAME
```

---

## Testing

### Test AWS Bedrock Integration

1. **Test edge function directly**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/aws-bedrock-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "profile": {...},
      "today": {...},
      "last7Days": [...],
      "baseline": {...}
    },
    "focus": "sleep optimization"
  }'
```

2. **Test from frontend**:
```typescript
const testBedrockIntegration = async () => {
  const context = {
    profile: loadProfile(),
    today: loadMetrics()[0],
    last7Days: loadMetrics().slice(-7),
    baseline: computeBaseline(loadMetrics()),
    allMetrics: loadMetrics()
  };

  const { data, error } = await supabase.functions.invoke('aws-bedrock-chat', {
    body: { context, focus: 'training intensity' }
  });

  console.log('Bedrock recommendations:', data.recommendations);
};
```

### Test S3 Integration

1. **Upload test file**:
```typescript
const testS3Upload = async () => {
  const testData = { test: 'data', timestamp: new Date().toISOString() };
  
  const { data, error } = await supabase.functions.invoke('s3-upload', {
    body: {
      data: testData,
      path: 'test',
      filename: 'test-upload.json'
    }
  });

  console.log('Upload result:', data);
};
```

2. **Verify in AWS Console**:
   - Go to S3 bucket
   - Check that file exists at expected path
   - Verify metadata and permissions

---

## Best Practices

### Cost Optimization

1. **Cache Bedrock responses**:
```typescript
// Cache AI recommendations for 1 hour
const cacheKey = `bedrock-${userId}-${focus}-${date}`;
const cached = await getCachedRecommendation(cacheKey);
if (cached) return cached;

const fresh = await callBedrock(...);
await cacheRecommendation(cacheKey, fresh, 3600);
```

2. **Use appropriate models**:
   - Claude 3.5 Sonnet: Complex reasoning only
   - Llama 3.3 70B: Faster, cheaper for simpler tasks
   - Don't call AI for every interaction - use local agents when possible

3. **Batch S3 operations**:
   - Upload metrics daily, not per entry
   - Use multipart upload for large files

### Security

1. **Never expose AWS credentials client-side**
   - Always use edge functions
   - Use Supabase RLS for access control

2. **User data isolation**:
   - S3 paths must include user ID
   - Verify user owns requested files

3. **Rate limiting**:
   - Implement rate limits on edge functions
   - Prevent abuse of expensive Bedrock calls

### Monitoring

1. **Log all AWS operations**:
```typescript
console.log('[AWS Bedrock] Request:', {
  userId,
  model,
  focus,
  timestamp: new Date().toISOString()
});
```

2. **Track costs**:
   - Monitor AWS billing dashboard
   - Set up budget alerts
   - Log token usage per request

3. **Error handling**:
   - Graceful fallback to local agents if AWS fails
   - Retry logic with exponential backoff
   - User-friendly error messages

---

## Next Steps

1. ✅ Set up AWS account and IAM user
2. ✅ Enable Bedrock model access
3. ✅ Create S3 bucket with proper permissions
4. ✅ Add AWS credentials as Supabase secrets
5. 📝 Implement `aws-bedrock-chat` edge function
6. 📝 Implement S3 edge functions
7. 📝 Create AWS-enhanced agent classes
8. 📝 Update AgentOrchestrator to use AWS agents
9. 📝 Add configuration toggle for AWS vs local agents
10. 📝 Test end-to-end integration
11. 📝 Deploy and monitor

---

## Reference Links

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Makeathon Repository](https://github.com/DataReply/makeathon)
- [Current Agent System](./src/agents/README.md)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## Support

For questions about this integration:
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
2. Review [src/agents/README.md](./src/agents/README.md) for agent details
3. Consult AWS documentation for Bedrock/S3 specifics
