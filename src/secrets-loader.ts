import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

const secretCache: Record<string, string> = {};

export async function getSecret(secretName: string): Promise<string> {
  // Check cache first
  if (secretCache[secretName]) {
    return secretCache[secretName];
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await client.send(command);
    
    if (response.SecretString) {
      secretCache[secretName] = response.SecretString;
      return response.SecretString;
    }

    throw new Error(`Secret ${secretName} has no string value`);
  } catch (error) {
    console.error(`Error fetching secret ${secretName}:`, error);
    throw error;
  }
}

export async function loadEnvironmentFromSecrets(): Promise<void> {
  // Load all secrets and set as environment variables
  const secrets = [
    { key: 'TEST_USER_EMAIL', secret: 'qa-automation/test-user-email' },
    { key: 'TEST_USER_PASSWORD', secret: 'qa-automation/test-user-password' },
    { key: 'ACTIVE_SUB_EMAIL', secret: 'qa-automation/active-sub-email' },
    { key: 'INACTIVE_SUB_EMAIL', secret: 'qa-automation/inactive-sub-email' },
    { key: 'SLACK_WEBHOOK_URL', secret: 'qa-automation/slack-webhook-url' },
  ];

  for (const { key, secret } of secrets) {
    try {
      const value = await getSecret(secret);
      process.env[key] = value;
    } catch (error) {
      console.warn(`Failed to load secret ${secret}:`, error);
    }
  }
}

export async function setupGoogleAuthState(): Promise<string | null> {
  try {
    const authState = await getSecret('qa-automation/google-auth-state');
    const fs = require('fs');
    const path = '/tmp/google.json';
    fs.writeFileSync(path, authState);
    console.log('Google auth state written to /tmp/google.json');
    return path;
  } catch (error) {
    console.warn('Failed to setup Google auth state:', error);
    return null;
  }
}
