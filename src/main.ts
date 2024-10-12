import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ControlTowerLandingZone } from './constructs/control-tower-landing-zone';

export class ControlTowerLandingZoneStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    new ControlTowerLandingZone(this, 'ControlTowerLandingZone', {
      governedRegions: ['YOUR_HOME_REGION', 'us-east-1'],
      landingZoneVersion: '3.3',
      loggingBucketRetentionPeriod: '365',
      accessLoggingBucketRetentionPeriod: '3600',
      encryption: true,
      loggingAccountEmail: 'LOGGING_ACCOUNT_EMAIL',
      securityAccountEmail: 'SECURITY_ACCOUNT_EMAIL',
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new ControlTowerLandingZoneStack(app, 'aws-cdk-control-tower-lz-dev', { env: devEnv });
// new MyStack(app, 'aws-cdk-control-tower-lz-prod', { env: prodEnv });

app.synth();