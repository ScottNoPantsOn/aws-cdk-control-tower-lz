import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Organization } from '../src/constructs/prerequisites/organization';

describe('Organization', () => {
  let stack: Stack;
  let template: Template;

  test('Creates organization when createOrganization is true', () => {
    stack = new Stack();
    new Organization(stack, 'TestOrganization', {
      createOrganization: true,
      loggingAccountEmail: 'logging@example.com',
      securityAccountEmail: 'security@example.com',
    });
    template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Organizations::Organization', 1);
    template.hasResourceProperties('AWS::Organizations::Organization', {
      FeatureSet: 'ALL',
    });
  });

  test('Does not create organization when createOrganization is false', () => {
    stack = new Stack();
    new Organization(stack, 'TestOrganization', {
      createOrganization: false,
      loggingAccountEmail: 'logging@example.com',
      securityAccountEmail: 'security@example.com',
    });
    template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Organizations::Organization', 0);
  });

  test('Creates logging account when loggingAccountId is not provided', () => {
    stack = new Stack();
    new Organization(stack, 'TestOrganization', {
      loggingAccountEmail: 'logging@example.com',
      securityAccountEmail: 'security@example.com',
    });
    template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Organizations::Account', 2);
    template.hasResourceProperties('AWS::Organizations::Account', {
      AccountName: 'Log Archive',
      Email: 'logging@example.com',
    });
  });

  test('Does not create logging account when loggingAccountId is provided', () => {
    stack = new Stack();
    new Organization(stack, 'TestOrganization', {
      loggingAccountId: '123456789012',
      securityAccountEmail: 'security@example.com',
    });
    template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Organizations::Account', 1); // Only security account
  });

  test('Creates security account when securityAccountId is not provided', () => {
    stack = new Stack();
    new Organization(stack, 'TestOrganization', {
      loggingAccountEmail: 'logging@example.com',
      securityAccountEmail: 'security@example.com',
    });
    template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Organizations::Account', 2);
    template.hasResourceProperties('AWS::Organizations::Account', {
      AccountName: 'Audit',
      Email: 'security@example.com',
    });
  });

  test('Does not create security account when securityAccountId is provided', () => {
    stack = new Stack();
    new Organization(stack, 'TestOrganization', {
      loggingAccountEmail: 'logging@example.com',
      securityAccountId: '123456789012',
    });
    template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Organizations::Account', 1); // Only logging account
  });

  test('Throws error when neither loggingAccountId nor loggingAccountEmail is provided', () => {
    expect(() => {
      new Organization(new Stack(), 'TestOrganization', {
        securityAccountEmail: 'security@example.com',
      });
    }).toThrow('You must provide an email to create the logging account or the account ID of an existing AWS account.');
  });

  test('Throws error when neither securityAccountId nor securityAccountEmail is provided', () => {
    expect(() => {
      new Organization(new Stack(), 'TestOrganization', {
        loggingAccountEmail: 'logging@example.com',
      });
    }).toThrow('You must provide an email to create the security tooling account or the account ID of an existing AWS account.');
  });

  test('Throws error when invalid loggingAccountId is provided', () => {
    expect(() => {
      new Organization(new Stack(), 'TestOrganization', {
        loggingAccountId: '123', // Invalid ID
        securityAccountEmail: 'security@example.com',
      });
    }).toThrow('The security account ID is not valid. It must be a 12-digit string');
  });

  test('Throws error when invalid securityAccountId is provided', () => {
    expect(() => {
      new Organization(new Stack(), 'TestOrganization', {
        loggingAccountEmail: 'logging@example.com',
        securityAccountId: '123', // Invalid ID
      });
    }).toThrow('The security account ID is not valid. It must be a 12-digit string');
  });
});
