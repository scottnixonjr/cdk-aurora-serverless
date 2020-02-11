import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as rds from "@aws-cdk/aws-rds";
/**
 * Followed these instructions: https://almirzulic.com/posts/create-serverless-aurora-cluster-with-cdk/
 */
export class CdkAuroraServerlessStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      subnetConfiguration: [ 
        { name: 'aurora_isolated_', subnetType: ec2.SubnetType.ISOLATED }
      ]
    });

    const subnetIds: string[] = [];
    vpc.isolatedSubnets.forEach((subnet, index) => {
      subnetIds.push(subnet.subnetId);
    });

    new cdk.CfnOutput(this, 'VpcSubnetIds', {
      value: JSON.stringify(subnetIds)
    });
    
    new cdk.CfnOutput(this, 'VpcDefaultSecurityGroup', {
      value: vpc.vpcDefaultSecurityGroup
    });

    const dbSubnetGroup: rds.CfnDBSubnetGroup = new rds.CfnDBSubnetGroup(this, 'AuroraSubnetGroup', {
      dbSubnetGroupDescription: 'Subnet group to access aurora',
      dbSubnetGroupName: 'aurora-serverless-subnet-group',
      subnetIds
    });

    const aurora = new rds.CfnDBCluster(this, 'AuroraServerless', {
      databaseName: 'dbname',
      dbClusterIdentifier: 'aurora-serverless',
      engine: 'aurora',
      engineMode: 'serverless',
      masterUsername: 'masteruser',
      masterUserPassword: 'IT_IS_SMART_TO_GENERATE_AND_OUTPUT_THIS',
      port: 3306,
      dbSubnetGroupName: dbSubnetGroup.dbSubnetGroupName,
      scalingConfiguration: {
        autoPause: true,
        maxCapacity: 2,
        minCapacity: 2,
        secondsUntilAutoPause: 3600
      }
    });
    
    //wait for subnet group to be created
    aurora.addDependsOn(dbSubnetGroup);

    // const auroraArn = `arnrds:${region}:${account}${aurora.dbClusterIdentifier}`;

    // new cdk.CfnOutput(this, 'AuroraClusterArn', {
    //   value: auroraArn
    // });
  }
}
