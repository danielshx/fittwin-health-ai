# AWS Setup Guide for HealthTwin

Step-by-step guide to set up AWS services for HealthTwin integration.

## Prerequisites
- AWS Account
- Credit card for AWS billing
- Basic understanding of AWS IAM

---

## Step 1: Create AWS Account

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the registration process
4. Verify your email and payment method

---

## Step 2: Create IAM User for HealthTwin

### Why IAM User?
- Don't use root account credentials in applications
- IAM users have limited permissions
- Easy to rotate credentials if compromised

### Create IAM User

1. **Login to AWS Console** → https://console.aws.amazon.com
2. **Navigate to IAM** → Search for "IAM" in top search bar
3. **Users** → Click "Users" in left sidebar
4. **Create User**:
   - Click "Create user"
   - User name: `healthtwin-app`
   - Select "Provide user access to the AWS Management Console" → Optional
   - Click "Next"

5. **Set Permissions**:
   - Select "Attach policies directly"
   - Add these policies:
     - ✅ `AmazonBedrockFullAccess` (for AI models)
     - ✅ `AmazonS3FullAccess` (for storage)
   - Click "Next"
   - Click "Create user"

### Create Access Keys

1. **Click on the user** you just created
2. **Security credentials** tab
3. **Create access key**:
   - Select "Application running outside AWS"
   - Click "Next"
   - Description: "HealthTwin App Integration"
   - Click "Create access key"

4. **⚠️ SAVE CREDENTIALS IMMEDIATELY**:
   - Access Key ID: `AKIAIOSFODNN7EXAMPLE`
   - Secret Access Key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
   - **Download CSV** or copy to secure location
   - ⚠️ You cannot view the secret again after closing this page!

---

## Step 3: Enable AWS Bedrock Models

### Navigate to Bedrock

1. **AWS Console** → Search for "Bedrock"
2. **Click "Amazon Bedrock"**
3. **Left sidebar** → "Model access"

### Request Model Access

1. **Click "Manage model access"** (orange button)
2. **Select models** you want to enable:

   **Recommended for HealthTwin**:
   - ✅ **Anthropic Claude 3.5 Sonnet** (best reasoning)
   - ✅ **Meta Llama 3.3 70B** (fast, cost-effective)
   - ⚠️ **Amazon Titan Text** (optional, AWS native)

3. **Review and submit**:
   - Scroll to bottom
   - Accept terms of service for each model
   - Click "Submit"

4. **Wait for approval**:
   - Most models: Instant approval
   - Some models: May take 1-24 hours
   - Check status in "Model access" page

### Verify Access

```bash
# Use AWS CLI to test (optional)
aws bedrock list-foundation-models --region us-east-1

# Should show enabled models
```

---

## Step 4: Create S3 Bucket

### Navigate to S3

1. **AWS Console** → Search for "S3"
2. **Click "Create bucket"**

### Bucket Configuration

**General Configuration**:
- **Bucket name**: `healthtwin-data-{your-unique-id}`
  - Must be globally unique
  - Example: `healthtwin-data-john-doe-2025`
- **AWS Region**: `us-east-1` (or your preferred region)
  - ⚠️ Use same region as Bedrock for faster performance

**Object Ownership**:
- ✅ ACLs disabled (recommended)

**Block Public Access**:
- ✅ Block all public access (keep private)
- HealthTwin accesses via IAM credentials only

**Bucket Versioning**:
- ⚠️ Optional: Enable if you want to keep file history
- Recommended: Disabled (simpler, lower cost)

**Tags** (optional):
- Key: `Project`, Value: `HealthTwin`
- Key: `Environment`, Value: `Production`

**Default encryption**:
- ✅ Enable (SSE-S3 or SSE-KMS)
- SSE-S3 is free and sufficient

**Click "Create bucket"**

### Configure Bucket for HealthTwin

1. **Click on your bucket**
2. **Permissions** tab
3. **Bucket policy** (optional - only if you need direct public access to specific files):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowHealthTwinAppAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/healthtwin-app"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::healthtwin-data-your-id/*",
        "arn:aws:s3:::healthtwin-data-your-id"
      ]
    }
  ]
}
```

**Replace**:
- `YOUR_ACCOUNT_ID`: Your AWS account ID (found in top-right corner)
- `healthtwin-data-your-id`: Your actual bucket name

---

## Step 5: Add Credentials to HealthTwin

### Option 1: Lovable Cloud UI (Recommended)

1. **Open your HealthTwin project in Lovable**
2. **Settings** → **Integrations** → **Secrets**
3. **Add the following secrets**:

```
AWS_ACCESS_KEY_ID = AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION = us-east-1
AWS_S3_BUCKET_NAME = healthtwin-data-your-id
```

4. **Save** each secret

### Option 2: Supabase CLI (Alternative)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
supabase secrets set AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
supabase secrets set AWS_REGION=us-east-1
supabase secrets set AWS_S3_BUCKET_NAME=healthtwin-data-your-id
```

---

## Step 6: Test the Integration

### Test Bedrock Access

Create a test script or edge function:

```typescript
// Test edge function
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: Deno.env.get('AWS_REGION'),
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
});

const command = new InvokeModelCommand({
  modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  body: JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 100,
    messages: [{ role: "user", content: "Say hello!" }]
  }),
  contentType: "application/json",
  accept: "application/json"
});

try {
  const response = await client.send(command);
  console.log("✅ Bedrock working:", response);
} catch (error) {
  console.error("❌ Bedrock error:", error);
}
```

### Test S3 Access

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: Deno.env.get('AWS_REGION'),
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
});

// Upload test
const putCommand = new PutObjectCommand({
  Bucket: Deno.env.get('AWS_S3_BUCKET_NAME'),
  Key: 'test/hello.txt',
  Body: 'Hello from HealthTwin!',
});

try {
  await s3Client.send(putCommand);
  console.log("✅ S3 upload working");
} catch (error) {
  console.error("❌ S3 error:", error);
}
```

---

## Common Issues

### Issue: "Access Denied" when calling Bedrock

**Solution**:
1. Check model is enabled in Bedrock console
2. Verify IAM user has `AmazonBedrockFullAccess` policy
3. Confirm correct AWS region (model availability varies by region)
4. Wait if model access is still pending approval

### Issue: "Credentials not found"

**Solution**:
1. Verify secrets are set in Supabase
2. Check edge function has access to environment variables
3. Restart edge function deployment
4. Confirm no typos in secret names

### Issue: "Bucket does not exist"

**Solution**:
1. Verify bucket name is correct (case-sensitive)
2. Check AWS region matches bucket region
3. Confirm IAM user has S3 permissions
4. Ensure bucket name in secret matches actual bucket

### Issue: High costs / Unexpected billing

**Solution**:
1. Set up AWS Budget alerts in AWS Console
2. Monitor Bedrock token usage
3. Implement caching for AI responses
4. Use cheaper models (Llama vs Claude) when appropriate
5. Check S3 storage class (use Standard, not Intelligent-Tiering for small data)

---

## Cost Estimates

### AWS Bedrock Pricing (us-east-1, approximate)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Llama 3.3 70B | $0.99 | $0.99 |
| Titan Text | $0.30 | $0.40 |

**Example**: 1000 AI recommendations/day with Claude 3.5 Sonnet
- Average 500 tokens input, 300 tokens output per request
- Monthly cost: ~$25-40

### AWS S3 Pricing (us-east-1)

| Feature | Price |
|---------|-------|
| Storage | $0.023 per GB/month |
| PUT requests | $0.005 per 1,000 requests |
| GET requests | $0.0004 per 1,000 requests |

**Example**: Store 1 year of health data for 100 users
- ~10 GB total storage
- Monthly cost: ~$0.23

**Total estimated monthly cost for small app**: $25-50

---

## Security Best Practices

### 1. Rotate Credentials Regularly
- Change access keys every 90 days
- Use AWS CLI or console to create new keys
- Update Supabase secrets with new keys
- Delete old keys after confirming new ones work

### 2. Use Least Privilege IAM Policies

Instead of `AmazonBedrockFullAccess`, create custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/*"
    }
  ]
}
```

### 3. Enable AWS CloudTrail
- Monitor all API calls to Bedrock and S3
- Detect suspicious activity
- Free tier: 90-day event history

### 4. Set Up AWS Budgets
1. AWS Console → Billing → Budgets
2. Create budget alert for $50/month
3. Get email when 80% threshold reached

### 5. Never Commit Credentials
- ✅ Use Supabase secrets
- ✅ Add `.env` to `.gitignore`
- ❌ Never push AWS keys to GitHub
- ❌ Never hardcode credentials in code

---

## Next Steps

✅ AWS account created  
✅ IAM user with credentials  
✅ Bedrock models enabled  
✅ S3 bucket created  
✅ Credentials added to Supabase secrets  

**Now proceed to**: [AWS_INTEGRATION.md](../AWS_INTEGRATION.md) for implementation details

---

## Resources

- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
