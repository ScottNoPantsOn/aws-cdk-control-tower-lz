import { CfnAccount, CfnOrganization } from 'aws-cdk-lib/aws-organizations';
import { Construct } from 'constructs';

/**
 * Interface for defining an Organization and its accounts.
 */
export interface IOrganizationProps {
  /**
   * Optionally create a new Organization.
   */
  createOrganization?: boolean;
  /**
   * The email address for the centralized logging account.
   */
  loggingAccountEmail?: string;
  /**
   * The name of the centralized logging account.
   */
  loggingAccountName?: string;
  /**
   * Optionally provide an existing account ID for the centralized logging account.
   * If an account ID is provided, the construct will use this and not create a new AWS account.
   */
  loggingAccountId?: string;
  /**
   * The email address for the security tooling account.
   */
  securityAccountEmail?: string;
  /**
   * The name of the security tooling account.
   */
  securityAccountName?: string;
  /**
   * Optionally provide an existing account ID for the security tooling account.
   * If an account ID is provided, the construct will use this and not create a new AWS account.
   */
  securityAccountId?: string;
}

/**
 * Deploy an AWS Organization and its accounts.
 * If an account ID is provided for a shared account, it will return that account ID and not create a new AWS account.
 */
export class Organization extends Construct {
  public readonly organization: CfnOrganization | undefined;
  public readonly loggingAccountId: string;
  public readonly newLoggingAccount: CfnAccount | undefined;
  public readonly securityAccountId: string;
  public readonly newSecurityAccount: CfnAccount | undefined;

  /**
   * Constructor for the Organization construct class.
   * @param {Construct} scope The parent construct.
   * @param {string} id The construct ID.
   * @param {IOrganizationProps} props The construct properties.
   */
  constructor(scope: Construct, id: string, props: IOrganizationProps) {
    super(scope, id);

    // Verify either loggingAccountId or loggingAccountEmail is provided
    if (!props.loggingAccountId && !props.loggingAccountEmail) {
      throw new Error('You must provide an email to create the logging account or the account ID of an existing AWS account.');
    }

    // Validate the loggingAccountId is a 12 digit string
    if (props.loggingAccountId && !/^\d{12}$/.test(props.loggingAccountId)) {
      throw new Error('The security account ID is not valid. It must be a 12-digit string');
    }

    // Verify either securityAccountId or securityAccountEmail is provided
    if (!props.securityAccountId && !props.securityAccountEmail) {
      throw new Error('You must provide an email to create the security tooling account or the account ID of an existing AWS account.');
    }

    // Validate the securityAccountId is a 12 digit string
    if (props.securityAccountId && !/^\d{12}$/.test(props.securityAccountId)) {
      throw new Error('The security account ID is not valid. It must be a 12-digit string');
    }

    // Create an organization if createOrganization: true
    if (props.createOrganization) {
      this.organization = new CfnOrganization(this, 'Organization', {
        featureSet: 'ALL',
      });
    }

    // Create the logging account if no account ID is provided
    let loggingAccountId;

    if (props.loggingAccountId) {
      loggingAccountId = props.loggingAccountId;
    } else {
      if (props.loggingAccountEmail) {
        const account = new CfnAccount(this, 'LoggingAccount', {
          accountName: props.loggingAccountName || 'Log Archive',
          email: props.loggingAccountEmail,
        });
        loggingAccountId = account.attrAccountId;
      }
    }
    this.loggingAccountId = loggingAccountId!;

    // Create the security account if no account ID is provided
    let securityAccountId;

    if (props.securityAccountId) {
      securityAccountId = props.securityAccountId;
    } else {
      if (props.securityAccountEmail) {
        const account = new CfnAccount(this, 'SecurityAccount', {
          accountName: props.securityAccountName || 'Audit',
          email: props.securityAccountEmail,
        });
        securityAccountId = account.attrAccountId;
      }
    }
    this.securityAccountId = securityAccountId!;
  }
}