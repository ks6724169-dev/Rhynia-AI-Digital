# Digital AI - Production-Grade AI Training System

> **Current layout:** The project is now organised as an AI-company monorepo. Use `apps/control_center/` for the owner dashboard, `ml/` for AI lifecycle work, `services/` for backend services, `scripts/ingestion/` for PDF processing, and `infrastructure/` for cloud assets. The tree below is a legacy reference.

Complete production-level setup for training AI models similar to Kimi 3, OpenAI's GPT, and Google's Gemini. This system follows industry-standard practices used by major AI companies.

## 🚀 Project Structure

```
DIGITAL AI/
├── config/
│   ├── config.yaml                # Basic configuration
│   └── production_config.yaml     # Production-grade configuration
├── data/
│   ├── train.jsonl                # Training data
│   ├── val.jsonl                  # Validation data
│   ├── test.jsonl                 # Test data
│   └── large/                     # Large-scale datasets
├── src/
│   ├── __init__.py                # Package initialization
│   ├── model.py                   # Basic model architecture
│   ├── model_production.py        # Production-grade transformer model
│   ├── data.py                    # Basic data processing
│   ├── data_production.py         # Production data pipeline
│   ├── train.py                   # Basic training loop
│   ├── train_production.py        # Production training system
│   ├── inference.py               # Basic inference
│   ├── inference_production.py    # Production inference system
│   └── evaluate.py                # Evaluation metrics
├── deploy/
│   ├── aws_deployment.py          # AWS cloud deployment
│   ├── gcp_deployment.py          # GCP cloud deployment
│   └── README.md                  # Deployment guide
├── models/                        # Saved models
├── checkpoints/                   # Training checkpoints
├── logs/                          # Training logs
├── outputs/                       # Production outputs
├── requirements.txt               # Basic dependencies
├── requirements-production.txt    # Production dependencies
└── README.md                      # This file
```

## 📋 Setup Instructions

### 1. Environment Setup

```bash
# Activate virtual environment
ai_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Install Deep Learning Framework

Choose one based on your preference:

**Option A: PyTorch (Recommended)**
```bash
# CPU version
pip install torch torchvision torchaudio

# GPU version (CUDA)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Option B: TensorFlow**
```bash
pip install tensorflow
```

### 3. Configuration

Edit `ml/training/configs/config.yaml` to customize:
- Model architecture (layers, dimensions, etc.)
- Training parameters (batch size, learning rate, epochs)
- Data paths and preprocessing options

## 🎯 Usage

### Basic Training (Educational)

```bash
# Activate environment
ai_env\Scripts\activate

# Run basic training
python -m ml.training.train

# Run basic inference
python -m services.inference.inference

# Run evaluation
python -m ml.evaluation.evaluate

# Test data processing
python -m ml.data.processing.data
```

### Production Training (Real AI Training)

```bash
# Install production dependencies
pip install -r requirements-production.txt

# Run production training
python -m ml.training.train_production --config ml/training/configs/production_config.yaml

# Run production inference
python -m services.inference.inference_production

# Deploy to cloud
python infrastructure/cloud/aws_deployment.py  # AWS
python infrastructure/cloud/gcp_deployment.py  # GCP
```

## 🔧 Model Architecture

### Basic Implementation
- **Transformer-based architecture** (similar to GPT)
- **Configurable model size** (vocab size, embedding dimensions, layers)
- **Simple tokenizer** for text processing
- **Training loop** with checkpointing
- **Evaluation metrics** (perplexity, accuracy, BLEU)

### Production Implementation (Kimi 3 Style)
- **Real PyTorch Transformer** with multi-head attention
- **GPT-style autoregressive modeling**
- **Advanced features**:
  - Mixed precision training (FP16)
  - Gradient accumulation
  - Learning rate scheduling
  - Distributed training support
  - Gradient clipping
  - Optimized memory usage
- **Model scales** from 96M to billions of parameters
- **Professional architecture** similar to Kimi 3, GPT-3, Gemini

## 📊 Production Features

### 🏗️ Infrastructure
- **Cloud Deployment**: AWS and GCP configurations
- **Distributed Training**: Multi-GPU and multi-node support
- **Scalability**: From single GPU to large clusters
- **Monitoring**: TensorBoard and Weights & Biases integration
- **API Serving**: FastAPI-based inference API

### 🚀 Performance
- **Mixed Precision**: FP16/BF16 training for speed
- **Gradient Accumulation**: Larger effective batch sizes
- **Optimized Data Loading**: Multi-worker data pipelines
- **Memory Optimization**: Gradient checkpointing, CPU offloading
- **Flash Attention**: Faster attention mechanisms

### 🌐 Cloud Integration
- **AWS**: EC2, S3, ECS, Lambda deployment
- **GCP**: Vertex AI, Cloud Storage, Compute Engine
- **Auto-scaling**: Dynamic resource allocation
- **Cost Optimization**: Spot instances, preemptible VMs

## 📊 Next Steps

### For Production Deployment:
1. **Install PyTorch with CUDA support**
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```

2. **Set up cloud account** (AWS/GCP) and configure credentials

3. **Upload training data** to cloud storage

4. **Launch training** on cloud instances

5. **Monitor training** with TensorBoard/WandB

6. **Deploy inference API** for serving

## 🛠️ Current Status

✅ **Completed:**
- Project structure
- Configuration system
- Basic model architecture
- Data processing pipeline
- Training loop framework
- Inference engine
- Evaluation metrics

⏳ **In Progress:**
- Deep learning framework integration
- Real model implementation

## 📝 Configuration Examples

### Basic Configuration
```yaml
model:
  vocab_size: 50000
  max_sequence_length: 2048
  embedding_dim: 768
  num_heads: 12
  num_layers: 12

training:
  batch_size: 32
  learning_rate: 0.0001
  epochs: 10
```

### Production Configuration (Kimi 3 Style)
```yaml
model:
  vocab_size: 100000              # Large vocabulary
  max_sequence_length: 4096      # Long context
  embedding_dim: 2048             # Large embeddings
  num_heads: 32                  # Many attention heads
  num_layers: 32                 # Deep network
  ff_dim: 8192                   # Large FFN

training:
  batch_size: 32
  gradient_accumulation_steps: 8  # Effective batch size = 256
  mixed_precision: true          # FP16 training
  max_steps: 1000000             # Large-scale training
  distributed: true              # Multi-GPU
```

## 🤝 Contributing

This is a production-grade learning project. Feel free to modify and extend the codebase for your specific needs.

## 📄 License

This is a personal learning project for educational purposes.

## 🎓 Learning Resources

### To understand AI training at scale:
- **Paper**: "Attention Is All You Need" (Transformer architecture)
- **Paper**: "Language Models are Few-Shot Learners" (GPT-3)
- **Course**: Deep Learning Specialization (Andrew Ng)
- **Book**: "Hands-On Machine Learning" (Aurélien Géron)

### For production deployment:
- **AWS Documentation**: EC2, S3, SageMaker
- **GCP Documentation**: Vertex AI, Cloud Storage
- **Best Practices**: MLOps frameworks (Kubeflow, MLflow)

---

**Note**: This setup provides both educational (basic) and production-grade implementations. The production version follows industry standards used by OpenAI, Google, and other major AI companies. For real large-scale training, you'll need substantial cloud resources and proper cloud account setup.
