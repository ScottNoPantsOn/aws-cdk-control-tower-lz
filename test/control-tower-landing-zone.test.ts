import { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ControlTowerLandingZone } from '../src/constructs/control-tower-landing-zone';


describe('ControlTowerLandingZone', () => {

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