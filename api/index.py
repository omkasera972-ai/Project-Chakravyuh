import sys
import os

# Set sys.path for Vercel Serverless Function Execution Environment
sys_path_backend = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys_path_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

if sys_path_backend not in sys.path:
    sys.path.insert(0, sys_path_backend)
if sys_path_root not in sys.path:
    sys.path.insert(0, sys_path_root)

from backend.main import app
