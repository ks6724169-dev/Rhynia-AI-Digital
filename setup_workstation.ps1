# ============================================
# AI Training Workstation - One-Click Setup
# OpenAI/Google style computer setup
# Chalane ke liye:  powershell -ExecutionPolicy Bypass -File setup_workstation.ps1
# ============================================

Write-Host "=== AI WORKSTATION SETUP SHURU ===" -ForegroundColor Cyan

$py = "ai_env\Scripts\python.exe"

# --- 1. Core AI/ML Stack (HuggingFace ecosystem) ---
Write-Host "`n[1/5] HuggingFace AI stack install ho raha hai..." -ForegroundColor Yellow
& $py -m pip install --upgrade pip
& $py -m pip install transformers datasets tokenizers accelerate safetensors sentencepiece huggingface-hub

# --- 2. Monitoring / Logging ---
Write-Host "`n[2/5] Monitoring tools (TensorBoard, W&B)..." -ForegroundColor Yellow
& $py -m pip install tensorboard wandb

# --- 3. Jupyter Notebook + API serving ---
Write-Host "`n[3/5] Jupyter + FastAPI..." -ForegroundColor Yellow
& $py -m pip install jupyter ipykernel fastapi uvicorn
& $py -m ipykernel install --user --name digital-ai --display-name "Digital AI (Python)"

# --- 4. VS Code Extensions ---
Write-Host "`n[4/5] VS Code extensions install..." -ForegroundColor Yellow
$exts = @(
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-toolsai.jupyter",
    "ms-toolsai.vscode-jupyter-cell-tags",
    "ms-azuretools.vscode-docker",
    "eamodio.gitlens",
    "usernamehw.errorlens",
    "mechatroner.rainbow-csv",
    "ms-vscode-remote.remote-wsl"
)
foreach ($e in $exts) {
    Write-Host "  Installing $e ..." -ForegroundColor Gray
    code --install-extension $e 2>$null
}

# --- 5. Verification ---
Write-Host "`n[5/5] Verification..." -ForegroundColor Yellow
& $py -c "import torch; print('PyTorch:', torch.__version__)"
& $py -c "import transformers; print('Transformers:', transformers.__version__)"
& $py -c "import datasets; print('Datasets:', datasets.__version__)"
& $py -c "import accelerate; print('Accelerate OK')"

Write-Host "`n=== SETUP COMPLETE! ===" -ForegroundColor Green
Write-Host "Ab ye karo:" -ForegroundColor Cyan
Write-Host "1. https://huggingface.co/join  - account banao (free models + datasets)"
Write-Host "2. https://wandb.ai/signup      - training monitoring ke liye"
Write-Host "3. https://colab.research.google.com - FREE GPU training"
Write-Host "4. https://www.kaggle.com/account-signup - FREE GPU (30 hrs/week)"
Write-Host "5. https://github.com/signup - code hosting"
