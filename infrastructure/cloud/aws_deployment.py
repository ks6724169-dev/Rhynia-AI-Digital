"""
AWS Cloud Deployment Configuration
Similar to OpenAI/Google cloud infrastructure setup
"""

import boto3
import json
from typing import Dict, Any, Optional
from pathlib import Path


class AWSDeploymentManager:
    """Manage AWS deployment for AI training"""
    
    def __init__(self, region: str = 'us-east-1', profile_name: Optional[str] = None):
        self.region = region
        self.session = boto3.Session(
            region_name=region,
            profile_name=profile_name
        )
        
        # AWS clients
        self.ec2 = self.session.client('ec2')
        self.s3 = self.session.client('s3')
        self.iam = self.session.client('iam')
        self.ecs = self.session.client('ecs')
        self.lambda_client = self.session.client('lambda')
        
    def create_training_instance(
        self,
        instance_type: str = 'p3.2xlarge',
        ami_id: str = 'ami-0c55b159cbfafe1f0',  # Deep Learning AMI
        key_name: str = 'ai-training-key',
        security_group_ids: Optional[list] = None,
        subnet_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Launch EC2 instance for AI training"""
        
        # Instance configuration
        instance_config = {
            'ImageId': ami_id,
            'InstanceType': instance_type,
            'KeyName': key_name,
            'MinCount': 1,
            'MaxCount': 1,
            'TagSpecifications': [
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'AI-Training-Instance'},
                        {'Key': 'Purpose', 'Value': 'LLM-Training'},
                        {'Key': 'Environment', 'Value': 'Production'}
                    ]
                }
            ]
        }
        
        # Add security group if provided
        if security_group_ids:
            instance_config['SecurityGroupIds'] = security_group_ids
        
        # Add subnet if provided
        if subnet_id:
            instance_config['SubnetId'] = subnet_id
        
        # Launch instance
        response = self.ec2.run_instances(**instance_config)
        
        instance_id = response['Instances'][0]['InstanceId']
        print(f"Launched EC2 instance: {instance_id}")
        print(f"Instance type: {instance_type}")
        
        return {
            'instance_id': instance_id,
            'instance_type': instance_type,
            'state': response['Instances'][0]['State']['Name']
        }
    
    def create_s3_bucket(self, bucket_name: str, region: Optional[str] = None) -> Dict[str, Any]:
        """Create S3 bucket for data storage"""
        
        region = region or self.region
        
        try:
            if region == 'us-east-1':
                # us-east-1 has a special S3 API
                response = self.s3.create_bucket(Bucket=bucket_name)
            else:
                response = self.s3.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={'LocationConstraint': region}
                )
            
            print(f"Created S3 bucket: {bucket_name}")
            
            # Set up bucket policy for public read (optional)
            bucket_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicReadGetObject",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "s3:GetObject",
                        "Resource": f"arn:aws:s3:::{bucket_name}/*"
                    }
                ]
            }
            
            self.s3.put_bucket_policy(
                Bucket=bucket_name,
                Policy=json.dumps(bucket_policy)
            )
            
            return {
                'bucket_name': bucket_name,
                'region': region,
                'status': 'created'
            }
            
        except self.s3.exceptions.BucketAlreadyExists:
            print(f"Bucket {bucket_name} already exists")
            return {'bucket_name': bucket_name, 'status': 'exists'}
    
    def upload_to_s3(self, bucket_name: str, local_path: str, s3_key: str) -> bool:
        """Upload local files to S3"""
        
        local_path = Path(local_path)
        
        if local_path.is_file():
            # Upload single file
            self.s3.upload_file(str(local_path), bucket_name, s3_key)
            print(f"Uploaded {local_path} to s3://{bucket_name}/{s3_key}")
            return True
        
        elif local_path.is_dir():
            # Upload directory
            for file_path in local_path.rglob('*'):
                if file_path.is_file():
                    relative_path = file_path.relative_to(local_path)
                    s3_file_key = f"{s3_key}/{relative_path}"
                    self.s3.upload_file(str(file_path), bucket_name, s3_file_key)
                    print(f"Uploaded {file_path} to s3://{bucket_name}/{s3_file_key}")
            return True
        
        return False
    
    def download_from_s3(self, bucket_name: str, s3_key: str, local_path: str) -> bool:
        """Download files from S3"""
        
        local_path = Path(local_path)
        local_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            self.s3.download_file(bucket_name, s3_key, str(local_path))
            print(f"Downloaded s3://{bucket_name}/{s3_key} to {local_path}")
            return True
        except Exception as e:
            print(f"Download failed: {e}")
            return False
    
    def create_iam_role_for_training(self, role_name: str) -> Dict[str, Any]:
        """Create IAM role with appropriate permissions for training"""
        
        # Trust policy for EC2
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        try:
            response = self.iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description='IAM role for AI training instances'
            )
            
            role_arn = response['Role']['Arn']
            print(f"Created IAM role: {role_name}")
            print(f"Role ARN: {role_arn}")
            
            # Attach S3 access policy
            self.iam.attach_role_policy(
                RoleName=role_name,
                PolicyArn='arn:aws:iam::aws:policy/AmazonS3FullAccess'
            )
            
            return {
                'role_name': role_name,
                'role_arn': role_arn,
                'status': 'created'
            }
            
        except self.iam.exceptions.EntityAlreadyExistsException:
            print(f"Role {role_name} already exists")
            response = self.iam.get_role(RoleName=role_name)
            return {
                'role_name': role_name,
                'role_arn': response['Role']['Arn'],
                'status': 'exists'
            }
    
    def setup_ecs_cluster(self, cluster_name: str = 'ai-training-cluster') -> Dict[str, Any]:
        """Setup ECS cluster for containerized training"""
        
        try:
            response = self.ecs.create_cluster(clusterName=cluster_name)
            
            cluster_arn = response['cluster']['clusterArn']
            print(f"Created ECS cluster: {cluster_name}")
            print(f"Cluster ARN: {cluster_arn}")
            
            return {
                'cluster_name': cluster_name,
                'cluster_arn': cluster_arn,
                'status': 'created'
            }
            
        except self.ecs.exceptions.ClusterAlreadyExistsException:
            print(f"Cluster {cluster_name} already exists")
            response = self.ecs.describe_clusters(clusters=[cluster_name])
            return {
                'cluster_name': cluster_name,
                'cluster_arn': response['clusters'][0]['clusterArn'],
                'status': 'exists'
            }
    
    def create_lambda_function(
        self,
        function_name: str,
        handler: str,
        runtime: str = 'python3.9',
        zip_file: Optional[bytes] = None,
        role_arn: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create Lambda function for inference or data processing"""
        
        if not role_arn:
            # Create default role
            role_response = self.create_iam_role_for_training(f'{function_name}-role')
            role_arn = role_response['role_arn']
        
        try:
            if zip_file:
                response = self.lambda_client.create_function(
                    FunctionName=function_name,
                    Runtime=runtime,
                    Role=role_arn,
                    Handler=handler,
                    Code={'ZipFile': zip_file},
                    Timeout=300,
                    MemorySize=1024
                )
            else:
                # Create function without code (placeholder)
                response = self.lambda_client.create_function(
                    FunctionName=function_name,
                    Runtime=runtime,
                    Role=role_arn,
                    Handler=handler,
                    Code={'ZipFile': b'def lambda_handler(event, context): return {"statusCode": 200}'},
                    Timeout=300,
                    MemorySize=1024
                )
            
            function_arn = response['FunctionArn']
            print(f"Created Lambda function: {function_name}")
            print(f"Function ARN: {function_arn}")
            
            return {
                'function_name': function_name,
                'function_arn': function_arn,
                'status': 'created'
            }
            
        except self.lambda_client.exceptions.ResourceConflictException:
            print(f"Function {function_name} already exists")
            response = self.lambda_client.get_function(FunctionName=function_name)
            return {
                'function_name': function_name,
                'function_arn': response['Configuration']['FunctionArn'],
                'status': 'exists'
            }


def setup_aws_training_environment():
    """Setup complete AWS training environment"""
    
    print("=== AWS Training Environment Setup ===")
    
    # Initialize deployment manager
    manager = AWSDeploymentManager(region='us-east-1')
    
    # Setup S3 storage
    bucket_name = 'kimi-3-training-bucket'
    manager.create_s3_bucket(bucket_name)
    
    # Setup IAM roles
    role_name = 'ai-training-role'
    manager.create_iam_role_for_training(role_name)
    
    # Setup ECS cluster
    manager.setup_ecs_cluster()
    
    print("\n✅ AWS environment setup completed!")
    print("Next steps:")
    print("1. Launch training instances with create_training_instance()")
    print("2. Upload data to S3 with upload_to_s3()")
    print("3. Configure security groups and networking")


if __name__ == "__main__":
    try:
        setup_aws_training_environment()
    except ImportError:
        print("⚠️ AWS SDK not installed. Install with: pip install boto3")
    except Exception as e:
        print(f"⚠️ AWS setup failed: {e}")
        print("Make sure AWS credentials are configured properly")
