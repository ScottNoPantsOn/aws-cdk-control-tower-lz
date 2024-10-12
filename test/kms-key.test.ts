import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ControlTowerKmsKey } from '../src/constructs/prerequisites/kms-key';


describe('ControlTowerKmsKey', () => {
  let stack: Stack;
  let template: Template;

  beforeEach(() => {
    stack = new Stack();
    new ControlTowerKmsKey(stack, 'TestControlTowerKmsKey');
    template = Template.fromStack(stack);
  });

  // test('Debug: Print Template', () => {
  //   console.log(JSON.stringify(template.toJSON(), null, 2));
  // });

  test('KMS Key is created with correct properties', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      Enabled: true,
    });
  });

  test('KMS Key policy has correct permissions for CloudTrail and AWS Config', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      KeyPolicy: {
        Statement: [
          {
            Action: 'kms:*',
            Effect: 'Allow',
            Principal: {
              AWS: {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    { Ref: 'AWS::Partition' },
                    ':iam::',
                    { Ref: 'AWS::AccountId' },
                    ':root',
                  ],
                ],
              },
            },
            Resource: '*',
          },
          {
            Sid: 'Allow CloudTrail to encrypt/decrypt logs',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: [
              'kms:GenerateDataKey*',
              'kms:Decrypt',
            ],
            Resource: '*',
            Condition: {
              StringEquals: {
                'AWS:SourceArn': {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      { Ref: 'AWS::Partition' },
                      ':cloudtrail:',
                      { Ref: 'AWS::Region' },
                      ':',
                      { Ref: 'AWS::AccountId' },
                      ':trail/aws-controltower-BaselineCloudTrail',
                    ],
                  ],
                },
              },
              StringLike: {
                'kms:EncryptionContext:aws:cloudtrail:arn': {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      { Ref: 'AWS::Partition' },
                      ':cloudtrail:*:',
                      { Ref: 'AWS::AccountId' },
                      ':trail/*',
                    ],
                  ],
                },
              },
            },
          },
          {
            Sid: 'Allow AWS Config to encrypt/decrypt logs',
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Action: [
              'kms:GenerateDataKey',
              'kms:Decrypt',
            ],
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
    });
  });

  test('KMS Key has correct alias', () => {
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/control-tower-landing-zone',
    });
  });

  test('KMS Key has correct removal policy', () => {
    template.hasResource('AWS::KMS::Key', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });

  test('Only one KMS Key is created', () => {
    template.resourceCountIs('AWS::KMS::Key', 1);
  });

});