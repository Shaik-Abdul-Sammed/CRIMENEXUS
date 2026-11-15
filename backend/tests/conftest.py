import sys
import os

# Automatically ensure project root and /app are on sys.path
tests_dir = os.path.abspath(os.path.dirname(__file__))
project_root = os.path.abspath(os.path.join(tests_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

app_dir = os.path.join(project_root, "app")
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)
