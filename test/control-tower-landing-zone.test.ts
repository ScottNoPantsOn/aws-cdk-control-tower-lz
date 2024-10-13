import { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ControlTowerLandingZone, DEFAULT_LANDING_ZONE_VERSION } from '../src/constructs/control-tower-landing-zone';

describe('ControlTowerLandingZone', () => {
  describe('Default create all resources', () => {
    let stack: Stack;
    let template: Template;

    beforeEach(() => {
      stack = new Stack();
      new ControlTowerLandingZone(stack, 'ControlTowerLandingZone', {
        createOrganization: true,
        governedRegions: ['ap-southeast-2', 'us-east-1'],
        encryption: true,
        securityAccountEmail: 'security@example.email',
        loggingAccountEmail: 'logging@example.email',
      });
      template = Template.fromStack(stack);
    });

    // test('Debug: Print Template', () => {
    //   console.log(JSON.stringify(template.toJSON(), null, 2));
    // });

    test('Creates AWS::Organizations::Organization', () => {
      template.resourceCountIs('AWS::Organizations::Organization', 1);
    });

    test('Creates shared accounts', () => {
      template.resourceCountIs('AWS::Organizations::Account', 2);
    });

    test('Creates AWS::ControlTower::LandingZone resource', () => {
      template.resourceCountIs('AWS::ControlTower::LandingZone', 1);
    });

    test('LandingZone has correct governed regions', () => {
      template.hasResourceProperties('AWS::ControlTower::LandingZone', {
        Manifest: {
          governedRegions: ['ap-southeast-2', 'us-east-1'],
        },
      });
    });

    test('LandingZone has correct organizationStructure configuration', () => {
      template.hasResourceProperties('AWS::ControlTower::LandingZone', {
        Manifest: {
          organizationStructure: {
            security: {
              name: 'Security',
            },
            sandbox: {
              name: 'Sandbox',
            },
          },
        },
      });
    });

    test('LandingZone manifest has correct logging account ID', () => {
      template.hasResourceProperties('AWS::ControlTower::LandingZone', {
        Manifest: {
          centralizedLogging: {
            accountId: Match.anyValue(),
          },
        },
      });
    });

    test('LandingZone manifest has correct security account ID', () => {
      template.hasResourceProperties('AWS::ControlTower::LandingZone', {
        Manifest: {
          securityRoles: {
            accountId: Match.anyValue(),
          },
        },
      });
    });

    test('Creates KMS Key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('Creates KMS Alias', () => {
      template.resourceCountIs('AWS::KMS::Alias', 1);
    });

    test('Creates IAM Roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 4);
    });

    test('Creates IAM Policies', () => {
      template.resourceCountIs('AWS::IAM::Policy', 3);
    });

    test('KMS Key has correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Enabled: true,
      });
    });

    test('KMS Alias has correct name', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/control-tower-landing-zone',
      });
    });
  });

  describe('Other configurations', () => {
    test('LandingZone does not create an organization when not set', () => {
      const stack = new Stack();
      new ControlTowerLandingZone(stack, 'ControlTowerLandingZone', {
        governedRegions: ['ap-southeast-2', 'us-east-1'],
        encryption: true,
        securityAccountEmail: 'security@example.email',
        loggingAccountEmail: 'logging@example.email',
      });
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::Organizations::Organization', 0);
    });

    test('LandingZone uses custom OU names when provided', () => {
      const stack = new Stack();
      new ControlTowerLandingZone(stack, 'ControlTowerLandingZone', {
        governedRegions: ['ap-southeast-2', 'us-east-1'],
        encryption: true,
        securityAccountEmail: 'security@example.email',
        loggingAccountEmail: 'logging@example.email',
        coreOU: 'CustomSecurity',
        customOU: 'CustomSandbox',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ControlTower::LandingZone', {
        Manifest: {
          organizationStructure: {
            security: {
              name: 'CustomSecurity',
            },
            sandbox: {
              name: 'CustomSandbox',
            },
          },
        },
      });
    });

    test('LandingZone uses provided KMS key ARN', () => {
      const stack = new Stack();
      new ControlTowerLandingZone(stack, 'ControlTowerLandingZone', {
        governedRegions: ['ap-southeast-2', 'us-east-1'],
        encryption: true,
        securityAccountEmail: 'security@example.email',
        loggingAccountEmail: 'logging@example.email',
        kmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/mrk-1234567890abcdef0',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ControlTower::LandingZone', {
        Manifest: {
          centralizedLogging: {
            configurations: {
              kmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/mrk-1234567890abcdef0',
            },
          },
        },
      });
    });

    test('LandingZone has no KMS key when encryption is disabled', () => {
      const stack = new Stack();
      new ControlTowerLandingZone(stack, 'ControlTowerLandingZone', {
        governedRegions: ['ap-southeast-2', 'us-east-1'],
        encryption: false,
        securityAccountEmail: 'security@example.email',
        loggingAccountEmail: 'logging@example.email',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ControlTower::LandingZone', {
        Manifest: {
          centralizedLogging: {
            configurations: {
              kmsKeyArn: Match.absent(),
            },
          },
        },
      });
    });

    test('LandingZone uses custom version when provided', () => {
      const stack = new Stack();
      new ControlTowerLandingZone(stack, 'ControlTowerLandingZone', {
        governedRegions: ['ap-southeast-2', 'us-east-1'],
        encryption: true,
        securityAccountEmail: 'security@example.email',
        loggingAccountEmail: 'logging@example.email',
        landingZoneVersion: '3.1',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ControlTower::LandingZone', {
        Version: '3.1',
      });
    });

    test('LandingZone uses default version when not provided', () => {
      const stack = new Stack();
      new ControlTowerLandingZone(stack, 'ControlTowerLandingZone', {
        governedRegions: ['ap-southeast-2', 'us-east-1'],
        encryption: true,
        securityAccountEmail: 'security@example.email',
        loggingAccountEmail: 'logging@example.email',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ControlTower::LandingZone', {
        Version: DEFAULT_LANDING_ZONE_VERSION,
      });
    });

    test('LandingZone is created after the logging account', () => {
      const stack = new Stack();
      new ControlTowerLandingZone(stack, 'ControlTowerLandingZone', {
        createOrganization: true,
        governedRegions: ['ap-southeast-2', 'us-east-1'],
        encryption: true,
        securityAccountEmail: 'security@example.email',
        loggingAccountEmail: 'logging@example.email',
      });
      const template = Template.fromStack(stack);

      template.hasResource('AWS::Organizations::Account', {
        Properties: {
          AccountName: 'Log Archive',
        },
      });

      template.resourceCountIs('AWS::ControlTower::LandingZone', 1);

      // Ensure the LandingZone is created after the logging account
      template.hasResource('AWS::ControlTower::LandingZone', {
        Properties: {
          Manifest: {
            centralizedLogging: {
              accountId: {
                'Fn::GetAtt': [Match.stringLikeRegexp('ControlTowerLandingZoneOrganizationLoggingAccount'), 'AccountId'],
              },
            },
          },
        },
      });
    });

    test('LandingZone is created after the security account', () => {
      const stack = new Stack();
      new ControlTowerLandingZone(stack, 'ControlTowerLandingZone', {
        createOrganization: true,
        governedRegions: ['ap-southeast-2', 'us-east-1'],
        encryption: true,
        securityAccountEmail: 'security@example.email',
        loggingAccountEmail: 'logging@example.email',
      });
      const template = Template.fromStack(stack);

      template.hasResource('AWS::Organizations::Account', {
        Properties: {
          AccountName: 'Audit',
        },
      });

      template.resourceCountIs('AWS::ControlTower::LandingZone', 1);

      // Ensure the LandingZone is created after the security account
      template.hasResource('AWS::ControlTower::LandingZone', {
        Properties: {
          Manifest: {
            securityRoles: {
              accountId: {
                'Fn::GetAtt': [Match.stringLikeRegexp('ControlTowerLandingZoneOrganizationSecurityAccount'), 'AccountId'],
              },
            },
          },
        },
      });
    });

  });
});