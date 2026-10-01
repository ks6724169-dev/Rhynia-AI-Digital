import os
import sys
import traceback

# Ensure repository root is in sys.path
repo_root = os.path.dirname(os.path.abspath(__file__))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

if __name__ == "__main__":
    try:
        import uvicorn

        port_env = os.environ.get("PORT", "10000")
        try:
            port = int(port_env)
        except Exception:
            port = 10000

        print(f"🚀 Rhynia Backend launching on 0.0.0.0:{port}...", flush=True)
        from services.rhynia_saas.backend.main import app
        print("✅ Backend FastAPI app loaded successfully!", flush=True)
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
    except Exception as e:
        print("❌ FATAL CRASH ON STARTUP:", e, flush=True)
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()
        sys.exit(1)
