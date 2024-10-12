import { Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * Create the IAM roles required for the Control Tower Landing Zone.
 * These roles are used by the Control Tower service to perform various tasks.
 */
export class ControlTowerIamRoles extends Construct {
  public readonly controlTowerAdminRole: iam.Role;
  public readonly controlTowerCloudTrailRole: iam.Role;
  public readonly controlTowerConfigAggregatorRoleForOrganizations: iam.Role;
  public readonly controlTowerStackSetRole: iam.Role;

  /**
   * Constructor for the ControlTowerIamRoles class.
   * @param {Construct} scope The scope in which to define the construct.
   * @param {string} id The unique identifier for the construct.
   */
  constructor(scope: Construct, id: string) {
    super(scope, id);
    // The Control Tower Admin role.
    this.controlTowerAdminRole = new iam.Role(this, 'AWSControlTowerAdmin', {
      roleName: 'AWSControlTowerAdmin',
      assumedBy: new iam.ServicePrincipal('controltower.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSControlTowerServiceRolePolicy'),
      ],
      path: '/service-role/',
    });
    this.controlTowerAdminRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ec2:DescribeAvailabilityZones'],
      resources: ['*'],
    }));

    // The Control Tower CloudTrail role.
    this.controlTowerCloudTrailRole = new iam.Role(this, 'AWSControlTowerCloudTrailRole', {
      roleName: 'AWSControlTowerCloudTrailRole',
      assumedBy: new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
      path: '/service-role/',
    });
    this.controlTowerCloudTrailRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: [`arn:${Stack.of(this).partition}:logs:*:*:log-group:aws-controltower/CloudTrailLogs:*`],
    }));

    // Config Aggregator Role for Organizations.
    this.controlTowerConfigAggregatorRoleForOrganizations = new iam.Role(this, 'AWSControlTowerConfigAggregatorRoleForOrganizations', {
      roleName: 'AWSControlTowerConfigAggregatorRoleForOrganizations',
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSConfigRoleForOrganizations'),
      ],
      path: '/service-role/',
    });

    // The Control Tower Stack Set role.
    this.controlTowerStackSetRole = new iam.Role(this, 'AWSControlTowerStackSetRole', {
      roleName: 'AWSControlTowerStackSetRole',
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      path: '/service-role/',
    });
    this.controlTowerStackSetRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      resources: [`arn:${Stack.of(this).partition}:iam::*:role/AWSControlTowerExecution`],
    }));
  }
}

