import os
import sys
import traceback

repo_root = os.path.dirname(os.path.abspath(__file__))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

if __name__ == "__main__":
    import uvicorn

    port_env = os.environ.get("PORT", "10000")
    try:
        port = int(port_env)
    except Exception:
        port = 10000

    print(f"🚀 Rhynia Backend launching on 0.0.0.0:{port}...", flush=True)

    app_to_run = None
    startup_error = None

    try:
        from services.rhynia_saas.backend.main import app
        app_to_run = app
        print("✅ Backend FastAPI app loaded successfully!", flush=True)
    except Exception as e:
        startup_error = traceback.format_exc()
        print(f"❌ ERROR IMPORTING MAIN APP:\n{startup_error}", flush=True)

    if app_to_run is None:
        # Emergency diagnostic app to prevent container crash and expose traceback
        from fastapi import FastAPI
        from fastapi.responses import JSONResponse

        emergency_app = FastAPI(title="Rhynia Emergency Diagnostic")

        @emergency_app.get("/")
        @emergency_app.get("/api/v1/health")
        def health():
            return JSONResponse(
                status_code=200,
                content={
                    "status": "degraded",
                    "error": "Startup import failed",
                    "traceback": startup_error,
                },
            )

        app_to_run = emergency_app

    uvicorn.run(app_to_run, host="0.0.0.0", port=port, log_level="info")
