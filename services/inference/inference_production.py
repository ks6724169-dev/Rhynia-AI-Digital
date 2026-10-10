"""
Production-Grade Inference System
Similar to OpenAI API / Google AI serving infrastructure
"""

import torch
import torch.nn as nn
from typing import Dict, List, Optional, Union
import json
from pathlib import Path
import time
from dataclasses import dataclass
from transformers import AutoTokenizer

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import JSONResponse
    from pydantic import BaseModel
    import uvicorn
    API_AVAILABLE = True
except ImportError:
    API_AVAILABLE = False

from ml.models.base.model_production import GPTStyleModel


@dataclass
class GenerationConfig:
    """Configuration for text generation"""
    temperature: float = 0.7
    top_k: Optional[int] = 50
    top_p: float = 0.9
    max_new_tokens: int = 512
    do_sample: bool = True
    num_return_sequences: int = 1
    repetition_penalty: float = 1.0
    length_penalty: float = 1.0
    early_stopping: bool = False


class ProductionInferenceEngine:
    """
    Production-grade inference engine
    Similar to OpenAI's inference infrastructure
    """
    
    def __init__(
        self,
        model_path: str,
        tokenizer_name: str = 'gpt2',
        device: str = 'cuda',
        max_batch_size: int = 32
    ):
        self.model_path = model_path
        self.tokenizer_name = tokenizer_name
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')
        self.max_batch_size = max_batch_size
        
        # Load model and tokenizer
        self.model = None
        self.tokenizer = None
        self.load_model()
        
        # Performance metrics
        self.total_requests = 0
        self.total_tokens_generated = 0
        self.total_inference_time = 0.0
        
    def load_model(self):
        """Load trained model and tokenizer"""
        print(f"Loading model from {self.model_path}...")
        
        # Load tokenizer
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.tokenizer_name)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            print(f"Tokenizer loaded: {self.tokenizer_name}")
        except Exception as e:
            print(f"Warning: Could not load tokenizer: {e}")
            print("Inference will require manual tokenization")
        
        # Load model
        model_path = Path(self.model_path)
        if model_path.suffix == '.pt':
            # Load PyTorch checkpoint
            checkpoint = torch.load(model_path, map_location=self.device)
            model_config = checkpoint.get('config', {}).get('model', {})
            
            self.model = GPTStyleModel(**model_config)
            model_state = checkpoint.get('model_state_dict')
            if model_state:
                self.model.load_state_dict(model_state)
                
        elif model_path.exists():
            # Try loading as HuggingFace model
            try:
                from transformers import AutoModelForCausalLM
                self.model = AutoModelForCausalLM.from_pretrained(str(model_path))
            except:
                raise ValueError(f"Could not load model from {model_path}")
        else:
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        self.model.to(self.device)
        self.model.eval()
        
        print(f"Model loaded successfully on {self.device}")
        print(f"Model parameters: {self.model.get_num_params():,}")
    
    def generate(
        self,
        prompts: Union[str, List[str]],
        config: Optional[GenerationConfig] = None
    ) -> Union[str, List[str]]:
        """
        Generate text from prompts
        
        Args:
            prompts: Single prompt or list of prompts
            config: Generation configuration
        
        Returns:
            Generated text(s)
        """
        if config is None:
            config = GenerationConfig()
        
        # Handle single prompt
        single_prompt = isinstance(prompts, str)
        if single_prompt:
            prompts = [prompts]
        
        # Tokenize prompts
        if self.tokenizer:
            input_ids_list = []
            attention_masks = []
            
            for prompt in prompts:
                encoding = self.tokenizer(
                    prompt,
                    return_tensors='pt',
                    padding=True,
                    truncation=True,
                    max_length=2048
                )
                input_ids_list.append(encoding['input_ids'])
                attention_masks.append(encoding['attention_mask'])
            
            # Pad to same length
            max_len = max(ids.size(1) for ids in input_ids_list)
            padded_input_ids = []
            padded_attention_masks = []
            
            for input_ids, attention_mask in zip(input_ids_list, attention_masks):
                pad_len = max_len - input_ids.size(1)
                padded_ids = torch.cat([
                    input_ids,
                    torch.full((1, pad_len), self.tokenizer.pad_token_id, dtype=input_ids.dtype)
                ], dim=1)
                padded_mask = torch.cat([
                    attention_mask,
                    torch.zeros((1, pad_len), dtype=attention_mask.dtype)
                ], dim=1)
                padded_input_ids.append(padded_ids)
                padded_attention_masks.append(padded_mask)
            
            input_ids = torch.cat(padded_input_ids, dim=0).to(self.device)
            attention_mask = torch.cat(padded_attention_masks, dim=0).to(self.device)
        else:
            raise ValueError("Tokenizer not loaded. Cannot perform inference.")
        
        # Generate
        start_time = time.time()
        
        with torch.no_grad():
            generated_ids = self.model.generate(
                input_ids,
                max_new_tokens=config.max_new_tokens,
                temperature=config.temperature,
                top_k=config.top_k,
                top_p=config.top_p,
                do_sample=config.do_sample
            )
        
        inference_time = time.time() - start_time
        
        # Decode generated text
        generated_texts = []
        for i in range(generated_ids.size(0)):
            # Remove prompt from generated text
            prompt_length = input_ids[i].size(0)
            new_tokens = generated_ids[i, prompt_length:]
            
            generated_text = self.tokenizer.decode(new_tokens, skip_special_tokens=True)
            generated_texts.append(generated_text)
        
        # Update metrics
        self.total_requests += len(prompts)
        self.total_tokens_generated += sum(len(text.split()) for text in generated_texts)
        self.total_inference_time += inference_time
        
        # Return single string if input was single prompt
        if single_prompt:
            return generated_texts[0]
        
        return generated_texts
    
    def batch_generate(
        self,
        prompts: List[str],
        config: Optional[GenerationConfig] = None,
        batch_size: Optional[int] = None
    ) -> List[str]:
        """
        Generate text for multiple prompts in batches
        
        Args:
            prompts: List of prompts
            config: Generation configuration
            batch_size: Batch size (default: self.max_batch_size)
        
        Returns:
            List of generated texts
        """
        if batch_size is None:
            batch_size = self.max_batch_size
        
        all_results = []
        
        # Process in batches
        for i in range(0, len(prompts), batch_size):
            batch_prompts = prompts[i:i + batch_size]
            batch_results = self.generate(batch_prompts, config)
            all_results.extend(batch_results)
        
        return all_results
    
    def get_performance_metrics(self) -> Dict[str, float]:
        """Get inference performance metrics"""
        if self.total_requests == 0:
            return {
                'total_requests': 0,
                'total_tokens_generated': 0,
                'total_inference_time': 0.0,
                'avg_tokens_per_second': 0.0,
                'avg_inference_time': 0.0
            }
        
        return {
            'total_requests': self.total_requests,
            'total_tokens_generated': self.total_tokens_generated,
            'total_inference_time': self.total_inference_time,
            'avg_tokens_per_second': self.total_tokens_generated / self.total_inference_time,
            'avg_inference_time': self.total_inference_time / self.total_requests
        }
    
    def stream_generate(
        self,
        prompt: str,
        config: Optional[GenerationConfig] = None
    ):
        """
        Stream generated text token by token
        Generator function for streaming responses
        """
        if config is None:
            config = GenerationConfig()
        
        # Tokenize prompt
        if not self.tokenizer:
            raise ValueError("Tokenizer not loaded")
        
        encoding = self.tokenizer(prompt, return_tensors='pt')
        input_ids = encoding['input_ids'].to(self.device)
        
        generated_ids = input_ids.clone()
        
        self.model.eval()
        with torch.no_grad():
            for _ in range(config.max_new_tokens):
                # Generate next token
                logits, _ = self.model(generated_ids)
                next_token_logits = logits[:, -1, :] / config.temperature
                
                # Sample next token
                probs = torch.softmax(next_token_logits, dim=-1)
                next_token = torch.multinomial(probs, num_samples=1)
                
                # Append to sequence
                generated_ids = torch.cat([generated_ids, next_token], dim=1)
                
                # Decode and yield new token
                new_token = self.tokenizer.decode(next_token[0], skip_special_tokens=True)
                yield new_token
                
                # Check for end of sequence
                if next_token.item() == self.tokenizer.eos_token_id:
                    break


class GenerationRequest(BaseModel):
    """API request model for text generation"""
    prompt: str
    max_tokens: int = 512
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: Optional[int] = 50
    n: int = 1  # Number of generations


class GenerationResponse(BaseModel):
    """API response model for text generation"""
    text: str
    tokens_generated: int
    inference_time: float


def create_api_app(inference_engine: ProductionInferenceEngine) -> FastAPI:
    """Create FastAPI application for inference serving"""
    
    if not API_AVAILABLE:
        raise ImportError("FastAPI not installed. Install with: pip install fastapi uvicorn")
    
    app = FastAPI(title="Kimi 3 Style Inference API")
    
    @app.get("/")
    async def root():
        return {"message": "Kimi 3 Style Inference API", "status": "running"}
    
    @app.get("/health")
    async def health():
        return {
            "status": "healthy",
            "device": str(inference_engine.device),
            "model_loaded": inference_engine.model is not None
        }
    
    @app.get("/metrics")
    async def metrics():
        return inference_engine.get_performance_metrics()
    
    @app.post("/generate", response_model=GenerationResponse)
    async def generate(request: GenerationRequest):
        try:
            config = GenerationConfig(
                max_new_tokens=request.max_tokens,
                temperature=request.temperature,
                top_p=request.top_p,
                top_k=request.top_k,
                num_return_sequences=request.n
            )
            
            start_time = time.time()
            generated_text = inference_engine.generate(request.prompt, config)
            inference_time = time.time() - start_time
            
            return GenerationResponse(
                text=generated_text,
                tokens_generated=len(generated_text.split()),
                inference_time=inference_time
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    return app


def main():
    """Test production inference"""
    print("=== Production Inference System ===")
    
    # Create a simple model for testing
    print("Creating test model...")
    from ml.models.base.model_production import create_gpt_model
    
    config = {
        'vocab_size': 50000,
        'max_sequence_length': 2048,
        'embedding_dim': 768,
        'num_heads': 12,
        'num_layers': 12
    }
    
    model = create_gpt_model(config)
    
    # Save model
    model_dir = Path("ml/experiments/outputs/models")
    model_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = model_dir / "test_model.pt"
    torch.save({
        'model_state_dict': model.state_dict(),
        'config': {'model': config}
    }, model_path)
    
    print(f"Test model saved to {model_path}")
    
    # Test inference engine
    try:
        engine = ProductionInferenceEngine(
            model_path=str(model_path),
            tokenizer_name='gpt2',
            device='cpu'  # Use CPU for testing
        )
        
        # Test generation
        test_prompts = [
            "The future of artificial intelligence is",
            "Machine learning can be used to"
        ]
        
        print("\nTesting text generation:")
        for prompt in test_prompts:
            result = engine.generate(prompt)
            print(f"Prompt: {prompt}")
            print(f"Generated: {result[:100]}...")
            print("-" * 50)
        
        # Test metrics
        metrics = engine.get_performance_metrics()
        print(f"\nPerformance Metrics:")
        for key, value in metrics.items():
            print(f"  {key}: {value}")
        
        print("\n✅ Inference test completed!")
        
    except ImportError as e:
        print(f"⚠️ Required libraries not installed: {e}")
        print("Install with: pip install transformers torch")


if __name__ == "__main__":
    main()
