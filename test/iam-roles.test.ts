import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ControlTowerIamRoles } from '../src/constructs/prerequisites/iam-roles';


describe('ControlTowerIamRoles', () => {
  let stack: Stack;
  let template: Template;

  beforeEach(() => {
    stack = new Stack();
    new ControlTowerIamRoles(stack, 'TestControlTowerIamRoles');
    template = Template.fromStack(stack);
  });

  // test('Debug: Print IAM Roles', () => {
  //   const roles = template.findResources('AWS::IAM::Role');
  //   console.log(JSON.stringify(roles, null, 2));
  // });

  describe('ControlTowerIamRoles', () => {

    beforeEach(() => {
      stack = new Stack();
      new ControlTowerIamRoles(stack, 'TestControlTowerIamRoles');
      template = Template.fromStack(stack);
    });

    test('Creates AWSControlTowerAdmin role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'controltower.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/AWSControlTowerServiceRolePolicy',
              ],
            ],
          },
        ],
        Path: '/service-role/',
        RoleName: 'AWSControlTowerAdmin',
      });
    });

    test('Creates AWSControlTowerCloudTrailRole', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        Path: '/service-role/',
        RoleName: 'AWSControlTowerCloudTrailRole',
      });
    });

    test('Creates AWSControlTowerConfigAggregatorRoleForOrganizations', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/AWSConfigRoleForOrganizations',
              ],
            ],
          },
        ],
        Path: '/service-role/',
        RoleName: 'AWSControlTowerConfigAggregatorRoleForOrganizations',
      });
    });

    test('Creates AWSControlTowerStackSetRole', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudformation.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        Path: '/service-role/',
        RoleName: 'AWSControlTowerStackSetRole',
      });
    });

    test('Creates exactly 4 IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 4);
    });
  });


});
