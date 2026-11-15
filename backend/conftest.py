import sys
import os

# Automatically ensure project root and /app are on sys.path
root_dir = os.path.abspath(os.path.dirname(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

app_dir = os.path.join(root_dir, "app")
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)
