import { CfnLandingZone } from 'aws-cdk-lib/aws-controltower';
import { Construct } from 'constructs';
import { ControlTowerIamRoles } from './prerequisites/iam-roles';
import { ControlTowerKmsKey } from './prerequisites/kms-key';
import { Organization } from './prerequisites/organization';

// TODO: Replace when API supports retrieval of latest version
export const DEFAULT_LANDING_ZONE_VERSION = '3.3';

/**
 * Interface for defining a ControlTowerLandingZone construct
 */
export interface IControlTowerLandingZoneProps {
  /**
   * Optionally create a new Organization.
   */
  createOrganization?: boolean;
  /**
   * The email address for the centralized logging account.
   */
  loggingAccountEmail: string;
  /**
   * The name of the centralized logging account.
   * @default 'Log Archive'
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
  securityAccountEmail: string;
  /**
   * The name of the security tooling account.
   * @default 'Audit'
   */
  securityAccountName?: string;
  /**
   * Optionally provide an existing account ID for the security tooling account.
   * If an account ID is provided, the construct will use this and not create a new AWS account.
   */
  securityAccountId?: string;
  /**
   * Set the Control Tower governed regions.
   */
  governedRegions: string[];
  /**
   * Set the Control Tower landing zone version.
   */
  landingZoneVersion?: string;
  /**
   * Set the standard account log retention for Control Tower in days.
   * @default 365
   */
  loggingBucketRetentionPeriod?: string;
  /**
   * Set the access log retention for Control Tower in days.
   * @default 3600
   */
  accessLoggingBucketRetentionPeriod?: string;
  /**
   * Enable KMS encryption for Control Tower enabled services(AWS CloudTrail, AWS Config) and the associated AWS S3 data.
   * @default true
   */
  encryption: boolean;
  /**
   * Optionally provide your own KMS key for encryption. Takes the ARN of a customer managed key.
   * The key must meet the {@link https://docs.aws.amazon.com/controltower/latest/userguide/configure-kms-keys.html necessary requirements}.
   * If no key is provided, the construct will create one for you.
   * @optional
   */
  kmsKeyArn?: string;
  /**
   * Set the name of the core OU.
   * @default 'Security'
   * @optional
   */
  coreOU?: string;
  /**
   * Set the name of the custom OU.
   * @default 'Sandbox'
   * @optional
   */
  customOU?: string;
}

/**
 * Deploy a Control Tower landing zone.
 * The construct expects you to have enabled IAM Identity Center with AWS Organizations.
 */
export class ControlTowerLandingZone extends Construct {
  public readonly controlTowerLandingZone: CfnLandingZone;
  /**
   * Constructor for the ControlTowerLandingZone construct class.
   * @param scope The scope in which to define the construct.
   * @param id The scoped construct identifier.
   * @param props Properties for the ControlTowerLandingZone construct.
   */
  constructor(scope: Construct, id: string, props: IControlTowerLandingZoneProps) {
    super(scope, id);

    // Pass props to the Organization construct to create organization resources as necessary.
    const org = new Organization(this, 'Organization', {
      createOrganization: props.createOrganization,
      loggingAccountEmail: props.loggingAccountEmail,
      loggingAccountName: props.loggingAccountName,
      loggingAccountId: props.loggingAccountId,
      securityAccountEmail: props.securityAccountEmail,
      securityAccountName: props.securityAccountName,
      securityAccountId: props.securityAccountId,
    });

    // IAM roles and policies for Control Tower.
    new ControlTowerIamRoles(this, 'ControlTowerIamRoles');

    // Create or retrieve the KMS key if encryption is enabled.
    let kmsKeyArn;
    if (props.encryption) {
      if (props.kmsKeyArn) {
        kmsKeyArn = props.kmsKeyArn;
      } else {
        kmsKeyArn = new ControlTowerKmsKey(this, 'ControlTowerKmsKey').kmsKey.keyArn;
      }
    }

    // Create the Control Tower landing zone.
    this.controlTowerLandingZone = new CfnLandingZone(this, id, {
      version: props.landingZoneVersion || DEFAULT_LANDING_ZONE_VERSION,
      manifest: {
        governedRegions: props.governedRegions,
        organizationStructure: {
          security: {
            name: props.coreOU || 'Security',
          },
          sandbox: {
            name: props.customOU || 'Sandbox',
          },
        },
        centralizedLogging: {
          accountId: org.loggingAccountId,
          configurations: {
            loggingBucket: {
              retentionDays: props.loggingBucketRetentionPeriod || 365,
            },
            accessLoggingBucket: {
              retentionDays: props.accessLoggingBucketRetentionPeriod || 3600,
            },
            kmsKeyArn: kmsKeyArn,
          },
          enabled: true,
        },
        securityRoles: {
          accountId: org.securityAccountId,
        },
        accessManagement: {
          enabled: true,
        },
      },
    });

    // Set dependencies to ensure Control Tower deploys after accounts are created
    if (org.newLoggingAccount) {
      this.controlTowerLandingZone.addDependency(org.newLoggingAccount);
    }
    if (org.newSecurityAccount) {
      this.controlTowerLandingZone.addDependency(org.newSecurityAccount);
    }
  }
}