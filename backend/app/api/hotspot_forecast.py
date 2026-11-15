import logging
from typing import Optional
from fastapi import APIRouter, Query
from app.ml_service.hotspot_forecaster import HotspotForecaster, get_hotspot_forecaster

logger = logging.getLogger("crimenexus.hotspot_forecast")

router = APIRouter(tags=["Micro-Hotspot Forecasting"])

@router.get("/hotspot-forecast/health", summary="Hotspot Forecast Health")
@router.get("/forecast/health", summary="Forecast Health")
def hotspot_forecast_health():
    forecaster = get_hotspot_forecaster()
    return {
        "status": "healthy",
        "service": "Place-Based Micro-Hotspot Forecasting (100m Grid Cells)",
        "model": "Spatio-Temporal Poisson Point Process & XGBoost",
        "model_engine": forecaster.engine,
        "version": "1.0.0"
    }

@router.get("/forecast/hotspots", summary="Get Micro-Hotspot Predictions")
@router.get("/hotspot-forecast/hotspots", summary="Get Micro-Hotspot Predictions")
@router.get("/hotspot-forecast", summary="Get Micro-Hotspot Predictions")
@router.get("/hotspots/forecast", summary="Get Micro-Hotspot Predictions")
def get_hotspots(
    district: Optional[str] = Query("DELHI_CENTRAL", description="District code (e.g. DELHI_CENTRAL, DELHI_SOUTH)"),
    days_ahead: Optional[int] = Query(1, description="Days ahead to forecast (1 to 7)"),
    date: Optional[str] = Query(None, description="Target date YYYY-MM-DD")
):
    forecaster = get_hotspot_forecaster()
    pred_res = forecaster.predict(district=district or "DELHI_CENTRAL", target_date=date, forecast_days_ahead=days_ahead or 1)
    results = pred_res["hotspots"]
    return {
        "district": district,
        "forecast_days_ahead": days_ahead,
        "hotspots_count": len(results),
        "hotspots": results,
        "model_engine": pred_res.get("model_engine", forecaster.engine),
        "engine": pred_res.get("engine", forecaster.engine),
        "statutory_mandate": "Preventive Beat Patrol Optimization under Section 168 BNSS"
    }
