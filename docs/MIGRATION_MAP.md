# Completed Migration Map

All listed project files have been moved and their active Python imports/configuration paths updated.

| Current location | Target location |
|---|---|
| `read_pdf.py`, `save_pdf_content.py`, `save_pdf_md.py` | `scripts/ingestion/` |
| `AI_PROJECT_PDF_CONTENT/` | `ml/data/raw/ai_project_pdf/` |
| `data/` | `ml/data/datasets/` |
| `src/train_real.py`, `src/train_production.py` | `ml/training/` |
| `src/model.py`, `src/model_production.py` | `ml/models/base/` |
| `src/data.py`, `src/data_production.py` | `ml/data/processing/` |
| `src/inference.py`, `src/inference_production.py` | `services/inference/` |
| `deploy/` | `infrastructure/cloud/` |
| `config/` | `ml/training/configs/` |
