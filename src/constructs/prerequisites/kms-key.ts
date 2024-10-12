import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

/**
 * Create a KMS key used by the Control Tower Landing Zone.
 * The KMS key is used for data encryption with Control Tower enabled services(AWS CloudTrail, AWS Config) and the associated AWS S3 data.
 */
export class ControlTowerKmsKey extends Construct {
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create the KMS key.
    this.kmsKey = new kms.Key(this, 'ControlTowerLandingZoneKmsKey', {
      enableKeyRotation: true,
      alias: 'control-tower-landing-zone',
      enabled: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Add limited permissions for CloudTrail to use the key.
    this.kmsKey.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'Allow CloudTrail to encrypt/decrypt logs',
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
      actions: ['kms:GenerateDataKey*', 'kms:Decrypt'],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:${Stack.of(this).partition}:cloudtrail:${Stack.of(this).region}:${Stack.of(this).account}:trail/aws-controltower-BaselineCloudTrail`,
        },
        StringLike: {
          'kms:EncryptionContext:aws:cloudtrail:arn': `arn:${Stack.of(this).partition}:cloudtrail:*:${Stack.of(this).account}:trail/*`,
        },
      },
    }));

    // Add limited permissions for Config to use the key.
    this.kmsKey.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'Allow AWS Config to encrypt/decrypt logs',
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('config.amazonaws.com')],
      actions: ['kms:GenerateDataKey', 'kms:Decrypt'],
      resources: ['*'],
    }));
  }
}