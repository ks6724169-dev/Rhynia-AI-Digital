import kagglehub
import shutil
import os

print("Starting download...")
path = kagglehub.model_download("zxcjiya123/rhynia-v1/gguf/default")
print("Downloaded to:", path)

# Find the .gguf file and copy it to ml/models/rhynia_v1.gguf
gguf_files = [f for f in os.listdir(path) if f.endswith('.gguf')]
if gguf_files:
    src = os.path.join(path, gguf_files[0])
    dst = "ml/models/rhynia_v1.gguf"
    print(f"Copying {src} to {dst}...")
    shutil.copy(src, dst)
    print(f"Successfully copied to {dst}")
else:
    print("No GGUF file found in the downloaded path.")
