"""
Production-Grade Training Script
Advanced training with distributed computing, monitoring, and optimization
Features similar to OpenAI/Google training pipelines
"""

import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler
from torch.utils.tensorboard import SummaryWriter
import yaml
import json
import os
import argparse
import time
from pathlib import Path
from typing import Dict, Any, Optional
from tqdm import tqdm
import numpy as np
from datetime import datetime

try:
    import wandb
    WANDB_AVAILABLE = True
except ImportError:
    WANDB_AVAILABLE = False

from ml.models.base.model_production import GPTStyleModel, create_gpt_model
from ml.data.processing.data_production import LargeScaleDataProcessor, TextDataset


class ProductionTrainer:
    """
    Production-grade trainer with distributed training, monitoring, and optimization
    Similar to OpenAI/Google training infrastructure
    """
    
    def __init__(self, config: Dict[str, Any], rank: int = 0, world_size: int = 1):
        self.config = config
        self.rank = rank
        self.world_size = world_size
        self.device = self._setup_device()
        
        # Training state
        self.global_step = 0
        self.current_epoch = 0
        self.best_val_loss = float('inf')
        
        # Setup directories
        self._setup_directories()
        
        # Setup logging
        self._setup_logging()
        
        # Initialize model
        self.model = None
        self.optimizer = None
        self.scheduler = None
        self.scaler = None  # For mixed precision
        
    def _setup_device(self):
        """Setup computing device (CPU/GPU/TPU)"""
        if torch.cuda.is_available():
            device = torch.device(f'cuda:{self.rank}')
            print(f"Using GPU: {torch.cuda.get_device_name(rank)}")
            print(f"GPU Memory: {torch.cuda.get_device_properties(rank).total_memory / 1e9:.2f} GB")
        else:
            device = torch.device('cpu')
            print("Using CPU")
        
        return device
    
    def _setup_directories(self):
        """Setup output directories"""
        self.output_dir = Path(self.config.get('output_dir', 'outputs'))
        self.checkpoint_dir = self.output_dir / 'checkpoints'
        self.log_dir = self.output_dir / 'logs'
        
        if self.rank == 0:
            self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
            self.log_dir.mkdir(parents=True, exist_ok=True)
    
    def _setup_logging(self):
        """Setup logging with TensorBoard and optional Weights & Biases"""
        self.writer = None
        self.wandb_run = None
        
        if self.rank == 0:
            # TensorBoard
            self.writer = SummaryWriter(self.log_dir)
            print(f"TensorBoard logs: {self.log_dir}")
            
            # Weights & Biases
            if WANDB_AVAILABLE and self.config.get('use_wandb', False):
                wandb.init(
                    project=self.config.get('wandb_project', 'ai-training'),
                    config=self.config,
                    name=f"{self.config.get('experiment_name', 'experiment')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                )
                self.wandb_run = wandb
                print("Weights & Biases logging enabled")
    
    def setup_model(self):
        """Initialize model with production architecture"""
        print("Setting up model...")
        
        # Create model
        model_config = self.config['model']
        self.model = create_gpt_model(model_config)
        self.model.to(self.device)
        
        # Wrap with DDP for distributed training
        if self.world_size > 1:
            self.model = DDP(self.model, device_ids=[self.rank])
            print(f"Model wrapped with DDP (rank {self.rank}/{self.world_size})")
        
        # Setup mixed precision training
        if self.config.get('mixed_precision', False):
            self.scaler = torch.cuda.amp.GradScaler()
            print("Mixed precision training enabled")
        
        # Print model info
        if self.rank == 0:
            model_info = self.model.get_model_size_info()
            print(f"\nModel Information:")
            for key, value in model_info.items():
                print(f"  {key}: {value}")
    
    def setup_optimizer(self):
        """Setup optimizer and learning rate scheduler"""
        print("Setting up optimizer...")
        
        training_config = self.config['training']
        
        # Optimizer
        optimizer_name = training_config.get('optimizer', 'adamw')
        learning_rate = training_config.get('learning_rate', 1e-4)
        weight_decay = training_config.get('weight_decay', 0.01)
        
        if optimizer_name == 'adamw':
            self.optimizer = torch.optim.AdamW(
                self.model.parameters(),
                lr=learning_rate,
                weight_decay=weight_decay,
                betas=(0.9, 0.999)
            )
        elif optimizer_name == 'adam':
            self.optimizer = torch.optim.Adam(
                self.model.parameters(),
                lr=learning_rate,
                weight_decay=weight_decay
            )
        else:
            raise ValueError(f"Unknown optimizer: {optimizer_name}")
        
        # Learning rate scheduler
        scheduler_type = training_config.get('scheduler', 'cosine')
        total_steps = training_config.get('max_steps', 100000)
        warmup_steps = training_config.get('warmup_steps', 1000)
        
        if scheduler_type == 'cosine':
            self.scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
                self.optimizer,
                T_max=total_steps - warmup_steps
            )
        elif scheduler_type == 'linear':
            self.scheduler = torch.optim.lr_scheduler.LinearLR(
                self.optimizer,
                start_factor=0.0,
                end_factor=1.0,
                total_iters=warmup_steps
            )
        
        print(f"Optimizer: {optimizer_name}")
        print(f"Learning rate: {learning_rate}")
        print(f"Scheduler: {scheduler_type}")
    
    def setup_data(self):
        """Setup data loaders with production data processor"""
        print("Setting up data pipeline...")
        
        data_config = self.config['data']
        
        # Initialize data processor
        self.data_processor = LargeScaleDataProcessor(
            tokenizer_name=data_config.get('tokenizer', 'gpt2'),
            max_length=data_config.get('max_length', 2048),
            cache_dir=data_config.get('cache_dir', 'ml/data/cache')
        )
        
        # Load data
        train_texts = self.data_processor.load_jsonl_data(
            data_config['train_path'],
            text_field=data_config.get('text_field', 'text')
        )
        
        val_texts = self.data_processor.load_jsonl_data(
            data_config['validation_path'],
            text_field=data_config.get('text_field', 'text')
        )
        
        # Create dataloaders
        batch_size = data_config.get('batch_size', 32)
        num_workers = data_config.get('num_workers', 4)
        
        self.train_loader, self.val_loader = self.data_processor.create_dataloaders(
            train_texts,
            val_texts,
            batch_size=batch_size,
            num_workers=num_workers
        )
        
        print(f"Training batches: {len(self.train_loader)}")
        print(f"Validation batches: {len(self.val_loader)}")
    
    def train_step(self, batch: Dict[str, torch.Tensor]) -> float:
        """Single training step with gradient accumulation"""
        self.model.train()
        
        # Move batch to device
        input_ids = batch['input_ids'].to(self.device)
        attention_mask = batch['attention_mask'].to(self.device)
        labels = batch['labels'].to(self.device)
        
        # Forward pass with mixed precision
        if self.scaler:
            with torch.cuda.amp.autocast():
                logits, loss = self.model(input_ids, attention_mask, labels)
            
            # Backward pass with gradient scaling
            self.scaler.scale(loss).backward()
        else:
            logits, loss = self.model(input_ids, attention_mask, labels)
            loss.backward()
        
        return loss.item()
    
    def train_epoch(self, epoch: int):
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        num_batches = len(self.train_loader)
        
        progress_bar = tqdm(self.train_loader, desc=f"Epoch {epoch}", disable=self.rank != 0)
        
        for batch_idx, batch in enumerate(progress_bar):
            # Gradient accumulation
            gradient_accumulation_steps = self.config['training'].get('gradient_accumulation_steps', 1)
            
            loss = self.train_step(batch)
            total_loss += loss
            
            # Update weights
            if (batch_idx + 1) % gradient_accumulation_steps == 0:
                # Gradient clipping
                if self.scaler:
                    self.scaler.unscale_(self.optimizer)
                
                max_grad_norm = self.config['training'].get('max_grad_norm', 1.0)
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_grad_norm)
                
                # Optimizer step
                if self.scaler:
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
                else:
                    self.optimizer.step()
                
                self.optimizer.zero_grad()
                
                # Update learning rate
                if self.scheduler:
                    self.scheduler.step()
                
                self.global_step += 1
                
                # Logging
                if self.rank == 0 and self.global_step % self.config['training'].get('log_interval', 10) == 0:
                    avg_loss = total_loss / (batch_idx + 1)
                    lr = self.optimizer.param_groups[0]['lr']
                    
                    # TensorBoard logging
                    if self.writer:
                        self.writer.add_scalar('train/loss', avg_loss, self.global_step)
                        self.writer.add_scalar('train/learning_rate', lr, self.global_step)
                    
                    # WandB logging
                    if self.wandb_run:
                        self.wandb_run.log({
                            'train/loss': avg_loss,
                            'train/learning_rate': lr,
                            'global_step': self.global_step
                        })
                    
                    progress_bar.set_postfix({'loss': f'{avg_loss:.4f}', 'lr': f'{lr:.6f}'})
                
                # Checkpointing
                if self.rank == 0 and self.global_step % self.config['training'].get('save_steps', 1000) == 0:
                    self.save_checkpoint(f"step_{self.global_step}")
                
                # Validation
                if self.global_step % self.config['training'].get('eval_steps', 500) == 0:
                    val_loss = self.evaluate()
                    if self.writer:
                        self.writer.add_scalar('val/loss', val_loss, self.global_step)
                    if self.wandb_run:
                        self.wandb_run.log({'val/loss': val_loss, 'global_step': self.global_step})
                    
                    # Save best model
                    if val_loss < self.best_val_loss:
                        self.best_val_loss = val_loss
                        self.save_checkpoint("best")
        
        return total_loss / num_batches
    
    @torch.no_grad()
    def evaluate(self) -> float:
        """Evaluate model on validation set"""
        self.model.eval()
        total_loss = 0
        num_batches = len(self.val_loader)
        
        progress_bar = tqdm(self.val_loader, desc="Evaluating", disable=self.rank != 0)
        
        for batch in progress_bar:
            input_ids = batch['input_ids'].to(self.device)
            attention_mask = batch['attention_mask'].to(self.device)
            labels = batch['labels'].to(self.device)
            
            if self.scaler:
                with torch.cuda.amp.autocast():
                    _, loss = self.model(input_ids, attention_mask, labels)
            else:
                _, loss = self.model(input_ids, attention_mask, labels)
            
            total_loss += loss.item()
            progress_bar.set_postfix({'loss': f'{loss.item():.4f}'})
        
        avg_loss = total_loss / num_batches
        print(f"Validation loss: {avg_loss:.4f}")
        
        return avg_loss
    
    def save_checkpoint(self, checkpoint_name: str):
        """Save training checkpoint"""
        if self.rank != 0:
            return
        
        checkpoint_path = self.checkpoint_dir / f"{checkpoint_name}.pt"
        
        # Get model state dict (unwrap DDP if needed)
        model_state = self.model.module.state_dict() if hasattr(self.model, 'module') else self.model.state_dict()
        
        checkpoint = {
            'epoch': self.current_epoch,
            'global_step': self.global_step,
            'model_state_dict': model_state,
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict() if self.scheduler else None,
            'config': self.config,
            'best_val_loss': self.best_val_loss
        }
        
        if self.scaler:
            checkpoint['scaler_state_dict'] = self.scaler.state_dict()
        
        torch.save(checkpoint, checkpoint_path)
        print(f"Checkpoint saved: {checkpoint_path}")
    
    def load_checkpoint(self, checkpoint_path: str):
        """Load training checkpoint"""
        checkpoint = torch.load(checkpoint_path, map_location=self.device)
        
        # Load model state
        model_state = checkpoint['model_state_dict']
        if hasattr(self.model, 'module'):
            self.model.module.load_state_dict(model_state)
        else:
            self.model.load_state_dict(model_state)
        
        # Load optimizer state
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        
        # Load scheduler state
        if self.scheduler and checkpoint.get('scheduler_state_dict'):
            self.scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        
        # Load scaler state
        if self.scaler and checkpoint.get('scaler_state_dict'):
            self.scaler.load_state_dict(checkpoint['scaler_state_dict'])
        
        # Restore training state
        self.current_epoch = checkpoint['epoch']
        self.global_step = checkpoint['global_step']
        self.best_val_loss = checkpoint['best_val_loss']
        
        print(f"Checkpoint loaded from {checkpoint_path}")
        print(f"Resuming from epoch {self.current_epoch}, step {self.global_step}")
    
    def train(self):
        """Main training loop"""
        print("Starting production training...")
        
        max_epochs = self.config['training'].get('max_epochs', 10)
        max_steps = self.config['training'].get('max_steps', 100000)
        
        for epoch in range(self.current_epoch, max_epochs):
            self.current_epoch = epoch
            
            # Train epoch
            train_loss = self.train_epoch(epoch)
            
            print(f"Epoch {epoch} completed. Average loss: {train_loss:.4f}")
            
            # Evaluate at end of epoch
            val_loss = self.evaluate()
            
            # Save epoch checkpoint
            if self.rank == 0:
                self.save_checkpoint(f"epoch_{epoch}")
            
            # Check stopping criteria
            if self.global_step >= max_steps:
                print(f"Reached max steps {max_steps}. Stopping training.")
                break
        
        # Save final model
        if self.rank == 0:
            self.save_checkpoint("final")
            print("Training completed successfully!")
    
    def cleanup(self):
        """Cleanup resources"""
        if self.writer:
            self.writer.close()
        if self.wandb_run:
            self.wandb_run.finish()


def setup_distributed():
    """Setup distributed training"""
    if 'RANK' in os.environ and 'WORLD_SIZE' in os.environ:
        rank = int(os.environ['RANK'])
        world_size = int(os.environ['WORLD_SIZE'])
        local_rank = int(os.environ['LOCAL_RANK'])
        
        # Initialize process group
        dist.init_process_group(backend='nccl')
        torch.cuda.set_device(local_rank)
        
        return rank, world_size
    else:
        return 0, 1


def load_config(config_path: str) -> Dict[str, Any]:
    """Load configuration from YAML file"""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config


def main():
    """Main entry point for production training"""
    parser = argparse.ArgumentParser(description='Production AI Training')
    parser.add_argument('--config', type=str, default='ml/training/configs/production_config.yaml',
                       help='Path to configuration file')
    parser.add_argument('--resume', type=str, default=None,
                       help='Path to checkpoint to resume from')
    parser.add_argument('--local_rank', type=int, default=0,
                       help='Local rank for distributed training')
    
    args = parser.parse_args()
    
    # Setup distributed training
    rank, world_size = setup_distributed()
    
    # Load configuration
    config = load_config(args.config)
    
    # Create trainer
    trainer = ProductionTrainer(config, rank, world_size)
    
    try:
        # Setup components
        trainer.setup_model()
        trainer.setup_optimizer()
        trainer.setup_data()
        
        # Resume from checkpoint if specified
        if args.resume:
            trainer.load_checkpoint(args.resume)
        
        # Start training
        trainer.train()
        
    except KeyboardInterrupt:
        print("Training interrupted by user")
    except Exception as e:
        print(f"Training failed with error: {e}")
        raise
    finally:
        trainer.cleanup()


if __name__ == "__main__":
    print("=== Production AI Training System ===")
    print("Similar to OpenAI/Google training infrastructure\n")
    
    try:
        main()
    except ImportError as e:
        print(f"⚠️ Required libraries not installed.")
        print(f"Install with: pip install torch transformers tensorboard wandb")
        print(f"Error: {e}")
