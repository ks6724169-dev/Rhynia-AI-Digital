import os
import sys

# Ensure repository root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    import uvicorn

    port_env = os.environ.get("PORT", "10000")
    try:
        port = int(port_env)
    except Exception:
        port = 10000

    print(f"🚀 Rhynia Backend launching on 0.0.0.0:{port}...", flush=True)
    uvicorn.run("services.rhynia_saas.backend.main:app", host="0.0.0.0", port=port, log_level="info")
