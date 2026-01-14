#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { QaAutomationStack } from '../lib/qa-stack';

const app = new cdk.App();
new QaAutomationStack(app, 'QaAutomationStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
