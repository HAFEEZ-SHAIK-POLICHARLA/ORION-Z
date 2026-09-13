from __future__ import annotations

import os
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
SRC_DIR = PACKAGE_DIR.parent
BACKEND_DIR = SRC_DIR.parent

_data_override = os.getenv("ORION_DATA_DIR")
_models_override = os.getenv("ORION_MODELS_DIR")

DATA_DIR = Path(_data_override).resolve() if _data_override else BACKEND_DIR / "data"
FIXTURES_DIR = DATA_DIR / "fixtures"
MODELS_DIR = Path(_models_override).resolve() if _models_override else BACKEND_DIR / "models"
