# Cloud Deployment Guide

Production-level cloud deployment for Kimi 3 / OpenAI / Google style AI training.

## 🚀 AWS Deployment

### Prerequisites
```bash
pip install boto3
aws configure
```

### Usage
```python
from deploy.aws_deployment import AWSDeploymentManager

# Initialize
manager = AWSDeploymentManager(region='us-east-1')

# Create S3 bucket
manager.create_s3_bucket('kimi-3-training-bucket')

# Launch training instance
instance = manager.create_training_instance(
    instance_type='p3.2xlarge',  # V100 GPU
    key_name='your-aws-key'
)

# Upload data
manager.upload_to_s3('kimi-3-training-bucket', 'data/', 'training-data')
```

### Recommended AWS Instances
- **p3.2xlarge** - 1x V100 (16GB) - ~$3.06/hour
- **p3.8xlarge** - 4x V100 (64GB) - ~$12.24/hour  
- **p3.16xlarge** - 8x V100 (128GB) - ~$24.48/hour
- **p4d.24xlarge** - 8x A100 (40GB) - ~$32.77/hour

## 🌐 GCP Deployment

### Prerequisites
```bash
pip install google-cloud-aiplatform google-cloud-storage google-cloud-compute
gcloud auth login
gcloud config set project your-project-id
```

### Usage
```python
from deploy.gcp_deployment import GCPDeploymentManager

# Initialize
manager = GCPDeploymentManager(project_id='your-project-id')

# Create storage bucket
manager.create_storage_bucket('kimi-3-training-bucket')

# Create training job
job = manager.create_training_job(
    display_name='kimi-3-training',
    machine_type='a2-highgpu-1g'  # A100 GPU
)

# Launch compute instance
instance = manager.create_compute_instance(
    instance_name='kimi-3-trainer',
    machine_type='a2-highgpu-1g'
)
```

### Recommended GCP Instances
- **a2-highgpu-1g** - 1x A100 (40GB) - ~$3.67/hour
- **a2-highgpu-4g** - 4x A100 (160GB) - ~$14.68/hour
- **a2-megagpu-16g** - 16x A100 (640GB) - ~$58.72/hour

## 💰 Cost Estimation

### Kimi 3 Style Training (96M parameters)
- **Single GPU (V100)**: ~$3/hour × 100 hours = $300
- **4x GPUs (V100)**: ~$12/hour × 25 hours = $300
- **8x GPUs (A100)**: ~$33/hour × 10 hours = $330

### OpenAI GPT-3 Scale (175B parameters)
- **8x A100 cluster**: ~$33/hour × 1000+ hours = $33,000+
- **Distributed training**: Much higher costs

## 🔒 Security Best Practices

1. **IAM Roles**: Use least privilege principle
2. **VPC**: Isolate training infrastructure
3. **Encryption**: Enable at-rest and in-transit encryption
4. **Key Management**: Use AWS KMS or GCP KMS
5. **Network Security**: Configure security groups/firewalls

## 📊 Monitoring Setup

### AWS CloudWatch
```python
# Enable CloudWatch metrics
manager.setup_cloudwatch_alarms()
```

### GCP Cloud Monitoring
```python
# Enable Cloud Monitoring
manager.setup_cloud_monitoring()
```

## 🚀 Deployment Checklist

- [ ] Create cloud account (AWS/GCP)
- [ ] Configure authentication
- [ ] Create storage buckets
- [ ] Setup IAM roles/service accounts
- [ ] Configure VPC/networking
- [ ] Launch compute instances
- [ ] Upload training data
- [ ] Deploy training code
- [ ] Setup monitoring
- [ ] Configure cost alerts
