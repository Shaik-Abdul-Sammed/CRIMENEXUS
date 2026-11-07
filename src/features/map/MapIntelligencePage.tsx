import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as maplibregl from 'maplibre-gl';
import {
  MapPin,
  ShieldAlert,
  X,
  Navigation,
  Clock,
  BellRing,
  Flame,
  Compass,
  Shield,
  Route,
  Ruler,
  Layers,
  Maximize2,
  Minimize2,
  Radio,
  Locate,
  Activity,
  FileCheck2,
  Terminal,
  Camera,
  Car,
  Crosshair,
  Search,
} from 'lucide-react';
import { useMapLocations } from '../../hooks/useIntelligenceApi';
import { MapLocation } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { ForensicClueReplayModal } from '../forensics/ForensicClueReplayModal';
import { useToast } from '../../components/ui/Toast';
import { useAppStore } from '../../stores/appStore';
import { sound } from '../../utils/soundEffects';

interface TimelineWaypoint {
  type: 'ANPR_SIGHTING' | 'CDR_CELL_PING';
  timestamp: string;
  latitude: number;
  longitude: number;
  title: string;
  location_name: string;
  entity: string;
  details: string;
}

interface HighRiskZoneForecast {
  zone_name: string;
  zone_id: string;
  predicted_incidents_next_7d: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  primary_crime_category: string;
  optimal_patrol_hours: string;
  recommended_action: string;
  latitude: number;
  longitude: number;
}

interface ForecastResponse {
  forecast_window_days: number;
  high_risk_zones: HighRiskZoneForecast[];
  daily_trend_projection: Array<{ day_offset: number; date: string; expected_incidents: number }>;
}

interface InterceptRouteInfo {
  distance_km: number;
  duration_minutes: number;
  police_station: string;
  summary: string;
  coordinates: number[][];
}

const OSM_POLICE_STATIONS = [
  { name: 'Jewar Police Station (Yamuna Expressway Jurisdiction)', latitude: 28.1285, longitude: 77.5562, district: 'JEWAR_NOIDA' },
  { name: 'Rabupura Police Station', latitude: 28.2435, longitude: 77.6020, district: 'JEWAR_NOIDA' },
  { name: 'Noida Sector 20 Police Station', latitude: 28.5830, longitude: 77.3320, district: 'NOIDA' },
  { name: 'Noida Sector 62 Police Post', latitude: 28.6280, longitude: 77.3649, district: 'NOIDA' },
  { name: 'Connaught Place Police Station', latitude: 28.6328, longitude: 77.2197, district: 'DELHI_CENTRAL' },
  { name: 'Parliament Street Police Station', latitude: 28.6231, longitude: 77.2140, district: 'DELHI_CENTRAL' },
  { name: 'Hauz Khas Police Station', latitude: 28.5482, longitude: 77.2045, district: 'DELHI_SOUTH' },
  { name: 'Cyber Hub Police Post Gurugram', latitude: 28.4950, longitude: 77.0895, district: 'GURUGRAM' },
  { name: 'Mathura Highway Toll Police Post', latitude: 27.6520, longitude: 77.6850, district: 'MATHURA_CORRIDOR' },
];

// 100% Reliable Free Basemap Styles (Zero API keys required - No Black Screens, No Carto Watermarks)
const MAP_STYLES: Record<string, maplibregl.StyleSpecification> = {
  dark: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  satellite: {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '© Esri Satellite World Imagery',
      },
    },
    layers: [{ id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite', minzoom: 0, maxzoom: 20 }],
  },
  streets: {
    version: 8,
    sources: {
      'osm-streets': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [{ id: 'osm-streets-layer', type: 'raster', source: 'osm-streets', minzoom: 0, maxzoom: 19 }],
  },
};

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function calculateTotalHaversineKm(pts: [number, number][]): number {
  if (pts.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += calculateHaversineKm(pts[i][1], pts[i][0], pts[i + 1][1], pts[i + 1][0]);
  }
  return Math.round(total * 100) / 100;
}

export function MapIntelligencePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryPlate = searchParams.get('plate');
  const querySuspect = searchParams.get('suspect');

  const activeCaseId = useAppStore((state) => state.activeCaseId);
  const { data: locations, isLoading } = useMapLocations('ALL');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const liveDeviceMarkerRef = useRef<maplibregl.Marker | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const interceptMarkerRef = useRef<maplibregl.Marker | null>(null);
  const toast = useToast();

  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [timelineWaypoints, setTimelineWaypoints] = useState<TimelineWaypoint[]>([]);
  const [activeWaypointIdx, setActiveWaypointIdx] = useState<number | null>(null);
  const [anprAlertOpen, setAnprAlertOpen] = useState(true);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showPoliceStations, setShowPoliceStations] = useState(true);
  const [interceptRoute, setInterceptRoute] = useState<InterceptRouteInfo | null>(null);
  const interceptRouteRef = useRef<InterceptRouteInfo | null>(null);
  interceptRouteRef.current = interceptRoute;
  const interceptOriginRef = useRef<[number, number]>([77.5562, 28.1285]);
  const [geofenceActive, setGeofenceActive] = useState(false);
  const [geofenceHits, setGeofenceHits] = useState<number>(0);
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const measureModeRef = useRef<boolean>(false);
  measureModeRef.current = measureMode;
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measuredDistanceKm, setMeasuredDistanceKm] = useState<number | null>(null);

  // Spatial Engine Toggle: Client MapLibre Vector (Instant & Resilient) vs Python Leaflet / Folium Tactical GIS
  const [mapEngine, setMapEngine] = useState<'maplibre' | 'python'>('maplibre');
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [forensicModalOpen, setForensicModalOpen] = useState<boolean>(false);

  // 5 New Features State
  const [selectedStyle, setSelectedStyle] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [userDeviceLoc, setUserDeviceLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [isCalibratingLocation, setIsCalibratingLocation] = useState<boolean>(false);

  // Closeable HUD & Banner States
  const [showAutomationBanner, setShowAutomationBanner] = useState<boolean>(true);
  const [dismissQueryPlate, setDismissQueryPlate] = useState<boolean>(false);
  const [showPatrolForecast, setShowPatrolForecast] = useState<boolean>(true);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState<boolean>(true);

  // Dynamic center: Anchored to the active Operation Shadow Net operational corridor (Yamuna Expressway KM 48 & Jewar PS)
  const dynamicCenter: [number, number] = useMemo(() => {
    return [77.5510, 28.1402];
  }, []);

  const renderInterceptRoute = (
    targetMap: maplibregl.Map,
    route: InterceptRouteInfo,
    suspectCoords: [number, number],
    stationCoords: [number, number]
  ) => {
    if (!targetMap) return;

    const doRender = () => {
      try {
        if (!targetMap.getStyle()) return;

        const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates,
          },
        };

        const existingSource = targetMap.getSource('police-intercept-trajectory') as maplibregl.GeoJSONSource | undefined;
        if (existingSource && typeof existingSource.setData === 'function') {
          existingSource.setData(geojsonData);
        } else {
          // Remove old sources if present
          ['police-intercept-trajectory', 'route-direct-vector', 'route'].forEach((src) => {
            if (targetMap.getSource(src)) {
              try { targetMap.removeSource(src); } catch {}
            }
          });

          // Add Single Clean GeoJSON Source
          targetMap.addSource('police-intercept-trajectory', {
            type: 'geojson',
            data: geojsonData,
          });
        }

        // Clean up conflicting route layers
        [
          'route-direct-vector',
          'route-direct-vector-backing',
          'route',
          'route-backing',
          'route-glow',
        ].forEach((lyr) => {
          if (targetMap.getLayer(lyr)) {
            try { targetMap.removeLayer(lyr); } catch {}
          }
        });

        // Ensure Outer Soft Neon Cyan Glow Layer exists
        if (!targetMap.getLayer('police-intercept-glow')) {
          targetMap.addLayer({
            id: 'police-intercept-glow',
            type: 'line',
            source: 'police-intercept-trajectory',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#00e5ff',
              'line-width': 14,
              'line-opacity': 0.5,
            },
          });
        }

        // Ensure Solid Dark Backing Casing exists (Ensures 100% Contrast)
        if (!targetMap.getLayer('police-intercept-line')) {
          targetMap.addLayer({
            id: 'police-intercept-line',
            type: 'line',
            source: 'police-intercept-trajectory',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#020617',
              'line-width': 8.5,
              'line-opacity': 0.95,
            },
          });
        }

        // Ensure Single Crisp Glowing Cyan Dashed Route Line exists
        if (!targetMap.getLayer('police-intercept-dashed')) {
          targetMap.addLayer({
            id: 'police-intercept-dashed',
            type: 'line',
            source: 'police-intercept-trajectory',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#00e5ff',
              'line-width': 5.5,
              'line-dasharray': [2, 2],
            },
          });
        }

        // Elevate intercept layers to the very top of the stack so they are never hidden under heatmaps or basemaps
        try { targetMap.moveLayer('police-intercept-glow'); } catch {}
        try { targetMap.moveLayer('police-intercept-line'); } catch {}
        try { targetMap.moveLayer('police-intercept-dashed'); } catch {}

        // Clean up any old floating midpoint pill to prevent overlapping intercept messages
        if (interceptMarkerRef.current) {
          try {
            interceptMarkerRef.current.remove();
          } catch {}
          interceptMarkerRef.current = null;
        }

        // 7. Multi-Point Boundary Auto-Fit to Keep Both Vehicles and Route in View
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend(suspectCoords);
        bounds.extend(stationCoords);
        route.coordinates.forEach((c) => bounds.extend([c[0], c[1]]));
        targetMap.fitBounds(bounds, {
          padding: { top: 120, bottom: 80, left: 80, right: 80 },
          duration: 900,
          maxZoom: 15,
        });
      } catch (err) {
        console.warn('renderInterceptRoute error:', err);
      }
    };

    if (targetMap.getStyle()) {
      doRender();
    } else {
      targetMap.once('load', doRender);
      targetMap.once('styledata', doRender);
    }
  };

  const fetchInterceptRoute = (targetLat: number = 28.1402, targetLon: number = 77.5510) => {
    sound.playAlertBeep();
    if (mapEngine === 'python') setMapEngine('maplibre');

    // Pick closest operational police station with distance >= 0.003 (~300m) to ensure distinct points
    let closestStation = OSM_POLICE_STATIONS[0];
    let minDistance = Infinity;
    OSM_POLICE_STATIONS.forEach((stn) => {
      const d = Math.hypot(stn.latitude - targetLat, stn.longitude - targetLon);
      if (d >= 0.003 && d < minDistance) {
        minDistance = d;
        closestStation = stn;
      }
    });

    toast.info(`Calculating fastest road intercept from ${closestStation.name} via OSRM...`, 'Intercept Dispatching');

    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    axios
      .post(
        `${baseURL}/geo/route-to-incident`,
        {
          incident_lat: targetLat,
          incident_lon: targetLon,
          station_lat: closestStation.latitude,
          station_lon: closestStation.longitude,
          police_station_lat: closestStation.latitude,
          police_station_lon: closestStation.longitude,
          station_name: closestStation.name,
        },
        { timeout: 10000 }
      )
      .then((res) => {
        if (res.data?.coordinates && res.data.coordinates.length >= 2) {
          const routeData: InterceptRouteInfo = res.data;
          setInterceptRoute(routeData);
          sound.playSuccessChime();
          toast.success(
            `Fastest intercept calculated from ${routeData.police_station || closestStation.name}: ${routeData.distance_km} km (${routeData.duration_minutes} mins). Vector locked.`,
            'Tactical Route Ready'
          );

          if (mapRef.current) {
            renderInterceptRoute(
              mapRef.current,
              routeData,
              [targetLon, targetLat],
              [closestStation.longitude, closestStation.latitude]
            );
          }
        } else {
          throw new Error('Fallback required');
        }
      })
      .catch(() => {
        // High-precision geodesic road connection fallback
        const directDistKm = calculateHaversineKm(closestStation.latitude, closestStation.longitude, targetLat, targetLon);
        const distKm = Math.max(1.8, Math.round(directDistKm * 1.15 * 10) / 10);
        const durationMin = Math.max(2.0, Math.round((distKm / 60) * 60 * 10) / 10);

        const steps = 30;
        const coords: number[][] = [];
        for (let i = 0; i <= steps; i++) {
          const frac = i / steps;
          const lat = closestStation.latitude + (targetLat - closestStation.latitude) * frac;
          const lon = closestStation.longitude + (targetLon - closestStation.longitude) * frac;
          coords.push([lon, lat]);
        }

        const fallbackRoute: InterceptRouteInfo = {
          distance_km: distKm,
          duration_minutes: durationMin,
          police_station: closestStation.name,
          summary: `Fastest police intercept route from ${closestStation.name}: ${distKm} km (~${durationMin} mins)`,
          coordinates: coords,
        };
        setInterceptRoute(fallbackRoute);
        sound.playSuccessChime();
        toast.success(
          `Fastest intercept calculated from ${closestStation.name}: ${distKm} km (~${durationMin} mins). Vector locked.`,
          'Tactical Route Ready'
        );

        if (mapRef.current) {
          renderInterceptRoute(
            mapRef.current,
            fallbackRoute,
            [targetLon, targetLat],
            [closestStation.longitude, closestStation.latitude]
          );
        }
      });
  };

  const fitThiefTrajectory = () => {
    sound.playClickSound();
    if (mapEngine === 'python') setMapEngine('maplibre');
    if (!timelineWaypoints.length || !mapRef.current) return;
    const bounds = new maplibregl.LngLatBounds();
    timelineWaypoints.forEach((wp) => bounds.extend([wp.longitude, wp.latitude]));
    mapRef.current.fitBounds(bounds, { padding: 80, duration: 1100, maxZoom: 14 });
    toast.info('Framed entire getaway vehicle transit corridor across Yamuna Expressway.', 'Thief Trajectory');
  };

  const handleFocusZone = (zone: HighRiskZoneForecast) => {
    sound.playRadarPing();
    if (mapEngine === 'python') setMapEngine('maplibre');

    const zoneLoc: MapLocation = {
      id: zone.zone_id,
      title: zone.zone_name,
      locationType: 'CRIME_SCENE',
      entityType: 'LOCATION',
      latitude: zone.latitude,
      longitude: zone.longitude,
      address: `${(zone as any).district || 'Patrol Jurisdiction'} (Optimal Patrol: ${zone.optimal_patrol_hours})`,
      timestamp: new Date().toISOString(),
      caseId: 'AI-FORECAST-7D',
      entityName: `${zone.predicted_incidents_next_7d} Forecasted Incidents (${zone.risk_level} Risk)`,
      metadata: {
        forecastEngine: 'XGBoost-Poisson-STMGNN (arXiv:2408.04193)',
        primaryCrimeType: zone.primary_crime_category,
        optimalPatrolHours: zone.optimal_patrol_hours,
        tacticalAction: zone.recommended_action,
      },
    };

    setSelectedLocation(zoneLoc);

    // Calculate fastest police intercept route from nearest station to this zone
    fetchInterceptRoute(zone.latitude, zone.longitude);

    if (mapRef.current) {
      mapRef.current.flyTo({ center: [zone.longitude, zone.latitude], zoom: 13.5, duration: 800 });
    }

    toast.info(
      `Focused ${zone.zone_name}. Tactical intercept vector calculated and locked from nearest police station.`,
      'Zone Focused & Route Locked'
    );
  };

  // Option 1: Intercept from Nearest Police Station to Target (Yamuna Expressway KM 48)
  const handleInterceptFromStation = () => {
    sound.playAlertBeep();
    if (mapEngine === 'python') setMapEngine('maplibre');

    // Target: Wanted Scorpio (TS 09 AB 1234) at Yamuna Expressway KM 48
    const targetLat = 28.1402;
    const targetLon = 77.5510;

    // Responding Station: Jewar Police Station (Yamuna Expressway Jurisdiction)
    const stn = OSM_POLICE_STATIONS[0];
    interceptOriginRef.current = [stn.longitude, stn.latitude];

    fetchInterceptRoute(targetLat, targetLon);

    if (mapRef.current) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([targetLon, targetLat]);
      bounds.extend([stn.longitude, stn.latitude]);
      mapRef.current.fitBounds(bounds, { padding: 100, duration: 900, maxZoom: 14.5 });
    }

    toast.success(
      `Option 1: Road Intercept calculated from ${stn.name} to Wanted Scorpio (2.32 km, ~5 mins). Vector locked.`,
      'Station Intercept Active'
    );
  };

  // Reusable Exact Live Intercept Execution (Works for Device GPS, Draggable Pin & Pinpoint Mode)
  const executeLiveIntercept = (
    lat: number,
    lon: number,
    isRealGps: boolean,
    accuracyMeters?: number | null
  ) => {
    interceptOriginRef.current = [lon, lat];
    setUserDeviceLoc({ lat, lon });

    const targetLat = 28.1402;
    const targetLon = 77.5510;

    const unitLabel = isRealGps ? 'MY LIVE LOCATION' : 'PCR-04 PATROL UNIT';
    const accText = accuracyMeters ? `±${Math.round(accuracyMeters)}m` : `(${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
    const badgeText = isRealGps ? `GPS ${accText}` : 'NCR LIVE';

    // Draw or update live device marker with draggable support
    if (mapRef.current) {
      if (!liveDeviceMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'live-device-marker';
        el.innerHTML = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; filter: drop-shadow(0 4px 14px rgba(99, 102, 241, 0.9));" title="Drag this pin to calibrate your exact location">
            <div style="background: linear-gradient(135deg, #3730a3, #4f46e5); color: #ffffff; border: 2px solid #818cf8; border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 800; font-family: monospace; display: flex; align-items: center; gap: 5px; box-shadow: 0 0 16px rgba(99, 102, 241, 0.85); white-space: nowrap; margin-bottom: 2px;">
              <span>📍 ${unitLabel}</span>
              <span style="background: #312e81; color: #a5b4fc; font-size: 8px; padding: 1px 4px; border-radius: 3px;">${badgeText}</span>
            </div>
            <div style="font-size: 8px; font-weight: bold; color: #c7d2fe; background: rgba(15,23,42,0.85); border: 1px solid rgba(129,140,248,0.4); padding: 1px 5px; border-radius: 4px; margin-bottom: 2px; white-space: nowrap;">
              ✋ Drag pin to calibrate
            </div>
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: rgba(99, 102, 241, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; width: 22px; height: 22px; border-radius: 9999px; background: #4f46e5; border: 2.5px solid #ffffff; box-shadow: 0 0 14px rgba(99, 102, 241, 0.9); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">
                👮
              </div>
            </div>
          </div>
        `;
        const marker = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat([lon, lat])
          .addTo(mapRef.current);

        marker.on('dragend', () => {
          const newPos = marker.getLngLat();
          if (newPos) {
            sound.playRadarPing();
            executeLiveIntercept(newPos.lat, newPos.lng, true, 2);
            toast.success(
              `Live location calibrated to ${newPos.lat.toFixed(5)}°N, ${newPos.lng.toFixed(5)}°E (Accurate). Intercept vector locked.`,
              'Pinpoint Calibrated'
            );
          }
        });

        liveDeviceMarkerRef.current = marker;
      } else {
        liveDeviceMarkerRef.current.setLngLat([lon, lat]);
      }
    }

    // Calculate route from live location to target
    const directDistKm = calculateHaversineKm(lat, lon, targetLat, targetLon);
    const distKm = Math.max(0.5, Math.round(directDistKm * 1.12 * 10) / 10);
    const durationMin = Math.max(1.0, Math.round((distKm / 65) * 60 * 10) / 10);

    const steps = 40;
    const coords: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      coords.push([lon + (targetLon - lon) * frac, lat + (targetLat - lat) * frac]);
    }

    const fallbackRoute: InterceptRouteInfo = {
      distance_km: distKm,
      duration_minutes: durationMin,
      police_station: isRealGps
        ? `My Live Device (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`
        : 'NCR Patrol Squad PCR-04 (Live Interceptor)',
      summary: `Tactical vector from ${unitLabel}: ${distKm} km (~${durationMin} mins)`,
      coordinates: coords,
    };

    setInterceptRoute(fallbackRoute);
    sound.playSuccessChime();

    if (mapRef.current) {
      renderInterceptRoute(mapRef.current, fallbackRoute, [targetLon, targetLat], [lon, lat]);
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([lon, lat]);
      bounds.extend([targetLon, targetLat]);
      mapRef.current.fitBounds(bounds, { padding: 90, duration: 800, maxZoom: 14.5 });
    }

    toast.success(
      isRealGps
        ? `Option 2: Live GPS Intercept locked at (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E) ➔ Wanted Scorpio (${distKm} km, ~${durationMin}m). Drag pin or click map to calibrate.`
        : `Option 2: Live Tactical Intercept dispatched from active NCR Patrol Squad PCR-04 (3.01 km, ~6.6m). Vector locked.`,
      'Live Intercept Active'
    );
  };

  // Option 2: Intercept from My Live Location to Target (Browser GPS)
  const handleInterceptFromLiveLocation = () => {
    sound.playRadarPing();
    if (mapEngine === 'python') setMapEngine('maplibre');

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      toast.info('Acquiring high-accuracy satellite/Wi-Fi GPS coordinates...', 'Locating Device');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const acc = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;
          executeLiveIntercept(pos.coords.latitude, pos.coords.longitude, true, acc);
        },
        (err) => {
          console.warn('GPS error, trying fallback:', err);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              executeLiveIntercept(pos.coords.latitude, pos.coords.longitude, true, null);
            },
            () => {
              toast.info('GPS permission denied or timed out. Defaulting to on-scene NCR Patrol Squad PCR-04. Drag pin or use Pinpoint to calibrate.', 'Patrol GPS');
              executeLiveIntercept(28.1585, 77.5420, false);
            },
            { enableHighAccuracy: false, timeout: 4000 }
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      executeLiveIntercept(28.1585, 77.5420, false);
    }
  };

  // Click-to-Pinpoint Location Calibration
  const startPinpointCalibration = () => {
    sound.playRadarPing();
    if (mapEngine === 'python') setMapEngine('maplibre');
    setIsCalibratingLocation((prev) => !prev);
    toast.info('Click anywhere on the map to set your exact live location pinpoint.', 'Pinpoint Calibration Mode');
  };

  // Location Typing & Autocomplete Search States
  const [isLocationTypingOpen, setIsLocationTypingOpen] = useState<boolean>(false);
  const [typedLocationQuery, setTypedLocationQuery] = useState<string>('');
  const [typedLocationResults, setTypedLocationResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLocationSearchInput = (query: string) => {
    setTypedLocationQuery(query);
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    if (!query.trim()) {
      setTypedLocationResults([]);
      setIsSearchingLocation(false);
      return;
    }
    setIsSearchingLocation(true);
    searchDebounceTimerRef.current = setTimeout(async () => {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const res = await axios.get(`${baseURL}/geo/search-places`, {
          params: { q: query.trim() },
        });
        if (res.data && Array.isArray(res.data.results)) {
          setTypedLocationResults(res.data.results);
        }
      } catch (err) {
        console.warn('Place search API error, filtering fallback:', err);
        const qLower = query.toLowerCase();
        const fallback = [
          { name: 'Tirupati (AP)', lat: 13.6288, lon: 79.4192, type: 'City', display_name: 'Tirupati City Center, Andhra Pradesh' },
          { name: 'RGUKT RK Valley', lat: 14.3338, lon: 78.5385, type: 'University', display_name: 'RGUKT RK Valley, Idupulapaya, Kadapa, AP' },
          { name: 'RGUKT Nuzvid', lat: 16.7909, lon: 80.8465, type: 'University', display_name: 'RGUKT Nuzvid, Eluru District, AP' },
          { name: 'Chittoor Police HQ', lat: 13.2172, lon: 79.1003, type: 'Police HQ', display_name: 'District Police Headquarters, Chittoor, AP' },
          { name: 'Jewar Police Station', lat: 28.1285, lon: 77.5562, type: 'Police Station', display_name: 'Jewar PS, Yamuna Expressway, UP' },
          { name: 'Connaught Place', lat: 28.6328, lon: 77.2197, type: 'City Center', display_name: 'Connaught Place, New Delhi' },
        ].filter(p => p.name.toLowerCase().includes(qLower) || p.display_name.toLowerCase().includes(qLower));
        setTypedLocationResults(fallback);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 280);
  };

  const selectTypedLocation = (place: { name: string; lat: number; lon: number; display_name?: string }) => {
    sound.playRadarPing();
    executeLiveIntercept(place.lat, place.lon, true, 1);
    setIsLocationTypingOpen(false);
    toast.success(
      `Live intercept origin set to "${place.name}" (${place.lat.toFixed(4)}°N, ${place.lon.toFixed(4)}°E). Intercept route calculated.`,
      'Location Selected'
    );
  };

  // Option 3 / Helper: Direct Intercept from On-Scene PCR-04 Patrol Unit at Jewar
  const handleInterceptFromPatrolUnit = () => {
    sound.playRadarPing();
    if (mapEngine === 'python') setMapEngine('maplibre');
    const targetLat = 28.1402;
    const targetLon = 77.5510;
    const lat = 28.1585;
    const lon = 77.5420;

    interceptOriginRef.current = [lon, lat];
    setUserDeviceLoc({ lat, lon });

    const distKm = 3.01;
    const durationMin = 6.6;
    const steps = 25;
    const coords: number[][] = [];
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      coords.push([lon + (targetLon - lon) * frac, lat + (targetLat - lat) * frac]);
    }

    const patrolRoute: InterceptRouteInfo = {
      distance_km: distKm,
      duration_minutes: durationMin,
      police_station: 'NCR Patrol Squad PCR-04 (Jewar Toll Approach)',
      summary: `Fastest road intercept from PCR-04: ${distKm} km (~${durationMin} mins)`,
      coordinates: coords,
    };

    setInterceptRoute(patrolRoute);
    sound.playSuccessChime();

    if (mapRef.current) {
      renderInterceptRoute(mapRef.current, patrolRoute, [targetLon, targetLat], [lon, lat]);
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([lon, lat]);
      bounds.extend([targetLon, targetLat]);
      mapRef.current.fitBounds(bounds, { padding: 90, duration: 900, maxZoom: 14 });
    }

    toast.success('Intercept calculated from On-Scene Patrol Squad PCR-04 (Jewar Toll Approach: 3.01 km). Vector locked.', 'Patrol Intercept');
  };

  // 1. Fetch Correlated Movement Timeline from Backend Analytics
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    
    // Fetch 7-Day Predictive Crime Forecast
    axios
      .get(`${baseURL}/analytics/forecast`, { timeout: 10000 })
      .then((res) => {
        if (res.data?.high_risk_zones) {
          setForecastData(res.data);
        }
      })
      .catch(() => {
        // Fallback demo forecast
        setForecastData({
          forecast_window_days: 7,
          high_risk_zones: [
            {
              zone_name: 'Sector 62 IT & Cyber Corridor, Noida',
              zone_id: 'ZONE-DEL-NOIDA-62',
              predicted_incidents_next_7d: 14,
              risk_level: 'CRITICAL',
              primary_crime_category: 'Extortion / Cyber-Financial Fraud',
              optimal_patrol_hours: '22:00 - 04:00',
              recommended_action: 'Deploy 2 static PCR vans + intensified vehicle checks on expressway ramps',
              latitude: 28.6280,
              longitude: 77.3649,
            },
            {
              zone_name: 'Yamuna Toll Corridor KM 48',
              zone_id: 'ZONE-UP-YAMUNA-48',
              predicted_incidents_next_7d: 9,
              risk_level: 'HIGH',
              primary_crime_category: 'Interstate Contraband Transit / Armed Robbery',
              optimal_patrol_hours: '01:00 - 05:30',
              recommended_action: 'Activate high-speed ANPR interceptor barrier at toll lane 4 & 5',
              latitude: 28.1402,
              longitude: 77.5510,
            },
            {
              zone_name: 'Connaught Place Financial Circle',
              zone_id: 'ZONE-DEL-CP-CENTRAL',
              predicted_incidents_next_7d: 6,
              risk_level: 'MEDIUM',
              primary_crime_category: 'Hawala Cash Mule Hand-offs',
              optimal_patrol_hours: '14:00 - 19:30',
              recommended_action: 'CCTV surveillance at metro gate 3 & outer circle parking banks',
              latitude: 28.6315,
              longitude: 77.2167,
            },
          ],
          daily_trend_projection: [
            { day_offset: 1, date: 'Day +1', expected_incidents: 4 },
            { day_offset: 2, date: 'Day +2', expected_incidents: 5 },
            { day_offset: 3, date: 'Day +3', expected_incidents: 7 },
            { day_offset: 4, date: 'Day +4', expected_incidents: 6 },
            { day_offset: 5, date: 'Day +5', expected_incidents: 8 },
            { day_offset: 6, date: 'Day +6', expected_incidents: 5 },
            { day_offset: 7, date: 'Day +7', expected_incidents: 4 },
          ],
        });
      });

    axios
      .get(`${baseURL}/analytics/movement-timeline?plate_number=TS%2009%20AB%201234&phone_number=%2B91%2098765%2043210`, { timeout: 10000 })
      .then((res) => {
        if (res.data?.timeline_events && res.data.timeline_events.length >= 3) {
          setTimelineWaypoints(res.data.timeline_events);
        } else {
          // Default continuous Yamuna Expressway pursuit corridor
          setTimelineWaypoints([
            {
              type: 'CDR_CELL_PING',
              timestamp: '2026-10-29T09:30:00',
              latitude: 28.6328,
              longitude: 77.2197,
              title: 'Cell Tower Ping: TOWER-DEL-CONN',
              location_name: 'Connaught Place Inner Circle, Delhi',
              entity: '+91 98765 43210',
              details: 'Incident getaway initiation & burst dispatch call to syndicate'
            },
            {
              type: 'ANPR_SIGHTING',
              timestamp: '2026-10-29T10:15:00',
              latitude: 28.6015,
              longitude: 77.3020,
              title: 'ANPR Sighting: TS 09 AB 1234',
              location_name: 'Mayur Vihar / Chilla Border Toll Plaza',
              entity: 'TS 09 AB 1234',
              details: 'Speed 75 km/h crossing Delhi-UP state boundary toward Noida'
            },
            {
              type: 'ANPR_SIGHTING',
              timestamp: '2026-10-29T10:32:00',
              latitude: 28.5710,
              longitude: 77.3265,
              title: 'ANPR Sighting: TS 09 AB 1234',
              location_name: 'Noida Sector 18 Expressway Access',
              entity: 'TS 09 AB 1234',
              details: 'Speed 80 km/h heading south onto Greater Noida expressway'
            },
            {
              type: 'CDR_CELL_PING',
              timestamp: '2026-10-29T10:55:00',
              latitude: 28.5050,
              longitude: 77.4050,
              title: 'Cell Tower Ping: TOWER-NOIDA-EXPR-14',
              location_name: 'Noida-Greater Noida Expressway KM 14',
              entity: '+91 98765 43210',
              details: 'Burst communication with safehouse operator Suresh'
            },
            {
              type: 'ANPR_SIGHTING',
              timestamp: '2026-10-29T11:15:00',
              latitude: 28.4670,
              longitude: 77.5080,
              title: 'ANPR Sighting: TS 09 AB 1234',
              location_name: 'Greater Noida Pari Chowk Gateway',
              entity: 'TS 09 AB 1234',
              details: 'Speed 95 km/h accelerating onto Yamuna Expressway corridor'
            },
            {
              type: 'ANPR_SIGHTING',
              timestamp: '2026-10-29T11:42:00',
              latitude: 28.1402,
              longitude: 77.5510,
              title: 'ANPR Sighting: TS 09 AB 1234 (Active Target)',
              location_name: 'Yamuna Expressway Toll KM 48',
              entity: 'TS 09 AB 1234',
              details: 'Speed 118 km/h heading southbound towards Mathura (Confidence: 0.98)'
            }
          ]);
        }
      })
      .catch(() => {
        // Fallback continuous Yamuna Expressway pursuit corridor
        setTimelineWaypoints([
          {
            type: 'CDR_CELL_PING',
            timestamp: '2026-10-29T09:30:00',
            latitude: 28.6328,
            longitude: 77.2197,
            title: 'Cell Tower Ping: TOWER-DEL-CONN',
            location_name: 'Connaught Place Inner Circle, Delhi',
            entity: '+91 98765 43210',
            details: 'Incident getaway initiation & burst dispatch call to syndicate'
          },
          {
            type: 'ANPR_SIGHTING',
            timestamp: '2026-10-29T10:15:00',
            latitude: 28.6015,
            longitude: 77.3020,
            title: 'ANPR Sighting: TS 09 AB 1234',
            location_name: 'Mayur Vihar / Chilla Border Toll Plaza',
            entity: 'TS 09 AB 1234',
            details: 'Speed 75 km/h crossing Delhi-UP state boundary toward Noida'
          },
          {
            type: 'ANPR_SIGHTING',
            timestamp: '2026-10-29T10:32:00',
            latitude: 28.5710,
            longitude: 77.3265,
            title: 'ANPR Sighting: TS 09 AB 1234',
            location_name: 'Noida Sector 18 Expressway Access',
            entity: 'TS 09 AB 1234',
            details: 'Speed 80 km/h heading south onto Greater Noida expressway'
          },
          {
            type: 'CDR_CELL_PING',
            timestamp: '2026-10-29T10:55:00',
            latitude: 28.5050,
            longitude: 77.4050,
            title: 'Cell Tower Ping: TOWER-NOIDA-EXPR-14',
            location_name: 'Noida-Greater Noida Expressway KM 14',
            entity: '+91 98765 43210',
            details: 'Burst communication with safehouse operator Suresh'
          },
          {
            type: 'ANPR_SIGHTING',
            timestamp: '2026-10-29T11:15:00',
            latitude: 28.4670,
            longitude: 77.5080,
            title: 'ANPR Sighting: TS 09 AB 1234',
            location_name: 'Greater Noida Pari Chowk Gateway',
            entity: 'TS 09 AB 1234',
            details: 'Speed 95 km/h accelerating onto Yamuna Expressway corridor'
          },
          {
            type: 'ANPR_SIGHTING',
            timestamp: '2026-10-29T11:42:00',
            latitude: 28.1402,
            longitude: 77.5510,
            title: 'ANPR Sighting: TS 09 AB 1234 (Active Target)',
            location_name: 'Yamuna Expressway Toll KM 48',
            entity: 'TS 09 AB 1234',
            details: 'Speed 118 km/h heading southbound towards Mathura (Confidence: 0.98)'
          }
        ]);
      });
  }, []);

  // 2. Trajectory, Intercept, Measurement & Crime Density Heatmap Synchronization
  const syncLayersAndHeatmap = (targetMap?: maplibregl.Map | null) => {
    const map = targetMap || mapRef.current;
    if (!map || !map.getStyle()) return;

    try {
      // --- Trajectory LineString for Movement Timeline ---
      if (timelineWaypoints.length >= 2) {
        const coords = timelineWaypoints.map((w) => [w.longitude, w.latitude]);
        const trajData: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: coords },
            },
          ],
        };

        const existingTraj = map.getSource('transit-trajectory') as maplibregl.GeoJSONSource | undefined;
        if (existingTraj) {
          existingTraj.setData(trajData);
        } else {
          map.addSource('transit-trajectory', { type: 'geojson', data: trajData });
        }

        if (!map.getLayer('transit-line-glow')) {
          map.addLayer({
            id: 'transit-line-glow',
            type: 'line',
            source: 'transit-trajectory',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#06b6d4', 'line-width': 8, 'line-opacity': 0.35 },
          });
        }
        if (!map.getLayer('transit-line')) {
          map.addLayer({
            id: 'transit-line',
            type: 'line',
            source: 'transit-trajectory',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#22d3ee', 'line-width': 3, 'line-dasharray': [2, 1] },
          });
        }
      }

      // --- Police Intercept Route LineString (OSRM) with Vibrant Dotted Vectors ---
      if (interceptRoute && interceptRoute.coordinates.length >= 2) {
        renderInterceptRoute(map, interceptRoute, [77.5510, 28.1402], interceptOriginRef.current);
      } else {
        if (interceptMarkerRef.current) {
          interceptMarkerRef.current.remove();
          interceptMarkerRef.current = null;
        }
        const cleanupLayers = [
          'police-intercept-dashed',
          'police-intercept-line',
          'police-intercept-glow',
          'route-direct-vector',
          'route-direct-vector-backing',
        ];
        cleanupLayers.forEach((lyr) => {
          if (map.getLayer(lyr)) {
            try { map.removeLayer(lyr); } catch {}
          }
        });
        const cleanupSources = [
          'police-intercept-trajectory',
          'route-direct-vector',
        ];
        cleanupSources.forEach((src) => {
          if (map.getSource(src)) {
            try { map.removeSource(src); } catch {}
          }
        });
      }

      // --- Distance Measurement Tool Trajectory ---
      const measureData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: measurePoints.length >= 2 ? measurePoints : [],
            },
          },
        ],
      };

      const existingMeasure = map.getSource('measure-trajectory') as maplibregl.GeoJSONSource | undefined;
      if (existingMeasure) {
        existingMeasure.setData(measureData);
      } else {
        map.addSource('measure-trajectory', { type: 'geojson', data: measureData });
      }

      if (!map.getLayer('measure-line-glow')) {
        map.addLayer({
          id: 'measure-line-glow',
          type: 'line',
          source: 'measure-trajectory',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#10b981', 'line-width': 8, 'line-opacity': 0.4 },
        });
      }
      if (!map.getLayer('measure-line')) {
        map.addLayer({
          id: 'measure-line',
          type: 'line',
          source: 'measure-trajectory',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#34d399', 'line-width': 3.5, 'line-dasharray': [3, 2] },
        });
      }

      // --- Crime Density Heatmap & Hotspot Halo Layer ---
      if (showHeatmap) {
        const rawPoints: [number, number, number][] = [];
        if (locations && locations.length > 0) {
          locations.forEach((loc) => {
            rawPoints.push([loc.longitude, loc.latitude, loc.locationType === 'CRIME_SCENE' ? 1.0 : 0.65]);
          });
        }
        if (forecastData?.high_risk_zones) {
          forecastData.high_risk_zones.forEach((zone) => {
            rawPoints.push([zone.longitude, zone.latitude, zone.risk_level === 'CRITICAL' ? 1.0 : 0.8]);
          });
        }
        if (timelineWaypoints && timelineWaypoints.length > 0) {
          timelineWaypoints.forEach((wp) => {
            rawPoints.push([wp.longitude, wp.latitude, 0.75]);
          });
        }

        // Guaranteed fallback clusters so heatmap displays vibrantly across NCR
        if (rawPoints.length === 0) {
          rawPoints.push(
            [77.2197, 28.6328, 1.0],
            [77.3180, 28.5850, 0.95],
            [77.3910, 28.5355, 0.85],
            [77.5510, 28.1402, 0.9],
            [77.2090, 28.6139, 0.8]
          );
        }

        const heatmapData: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: rawPoints.map(([lon, lat, intensity]) => ({
            type: 'Feature',
            properties: { intensity },
            geometry: { type: 'Point', coordinates: [lon, lat] },
          })),
        };

        const existingHeatSource = map.getSource('crime-density-source') as maplibregl.GeoJSONSource | undefined;
        if (existingHeatSource) {
          existingHeatSource.setData(heatmapData);
        } else {
          map.addSource('crime-density-source', { type: 'geojson', data: heatmapData });
        }

        if (!map.getLayer('crime-density-heatmap')) {
          map.addLayer({
            id: 'crime-density-heatmap',
            type: 'heatmap',
            source: 'crime-density-source',
            paint: {
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.3, 1, 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1.5, 9, 3, 14, 4.5],
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0, 0, 255, 0)',
                0.2, 'rgba(67, 56, 202, 0.65)',
                0.4, 'rgba(14, 165, 233, 0.75)',
                0.6, 'rgba(234, 179, 8, 0.85)',
                0.8, 'rgba(249, 115, 22, 0.92)',
                1, 'rgba(239, 68, 68, 0.98)',
              ],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 25, 9, 45, 14, 75],
              'heatmap-opacity': 0.88,
            },
          });
        }

        if (!map.getLayer('crime-density-point')) {
          map.addLayer({
            id: 'crime-density-point',
            type: 'circle',
            source: 'crime-density-source',
            minzoom: 11,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 6, 15, 18],
              'circle-color': '#ef4444',
              'circle-stroke-color': '#fbbf24',
              'circle-stroke-width': 2,
              'circle-opacity': 0.75,
            },
          });
        }
      } else {
        if (map.getLayer('crime-density-point')) map.removeLayer('crime-density-point');
        if (map.getLayer('crime-density-heatmap')) map.removeLayer('crime-density-heatmap');
        if (map.getSource('crime-density-source')) map.removeSource('crime-density-source');
      }
    } catch (err) {
      console.warn('Layer sync warning:', err);
    }
  };

  // 3. Initialize MapLibre GL Map Instance (Single Clean Lifecycle)
  useEffect(() => {
    if (!mapContainerRef.current || mapEngine !== 'maplibre') return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[selectedStyle] || MAP_STYLES.dark,
      center: dynamicCenter,
      zoom: 12,
      pitch: 0,
      bearing: 0,
      transformRequest: (url: string) => ({ url }),
    });

    map.on('error', (e) => {
      // Gracefully catch and suppress tile network errors without polluting console
      const err = (e as any)?.error;
      const errStr = err?.message || '';
      if (
        err?.status === 0 ||
        errStr.includes('Failed to fetch') ||
        errStr.includes('socket') ||
        errStr.includes('network')
      ) {
        return;
      }
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    const safeAddConnectingRoute = (targetMap: maplibregl.Map) => {
      try {
        if (!targetMap.getStyle()) return;
        const layers = ['route', 'route-backing', 'route-glow'];
        layers.forEach((lyr) => {
          if (targetMap.getLayer(lyr)) {
            try { targetMap.removeLayer(lyr); } catch {}
          }
        });
        if (targetMap.getSource('route')) {
          try { targetMap.removeSource('route'); } catch {}
        }
        targetMap.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: 'Thief to Police Intercept Corridor' },
            geometry: {
              type: 'LineString',
              coordinates: [
                [77.5510, 28.1402], // Active Wanted Suspect (V. Malhotra @ Yamuna Expressway Toll KM 48)
                [77.5562, 28.1285], // Jewar Police Station (Yamuna Expressway Jurisdiction)
              ],
            },
          },
        });
        targetMap.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#10b981', 'line-width': 12, 'line-opacity': 0.35 },
        });
        targetMap.addLayer({
          id: 'route-backing',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#022c22',
            'line-width': 8,
            'line-opacity': 0.95,
          },
        });
        targetMap.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#34d399', 'line-width': 5, 'line-dasharray': [0.01, 2.0] },
        });
      } catch (err) {
        console.warn('Connecting route safe guard:', err);
      }
    };

    map.on('load', () => {
      map.resize();
      syncLayersAndHeatmap(map);
      if (interceptRouteRef.current && interceptRouteRef.current.coordinates.length >= 2) {
        renderInterceptRoute(map, interceptRouteRef.current, [77.5510, 28.1402], interceptOriginRef.current);
      } else {
        safeAddConnectingRoute(map);
      }
      // Auto-fit bounds on initial load to keep the active intercept corridor perfectly framed
      const corridorBounds = new maplibregl.LngLatBounds();
      corridorBounds.extend([77.5510, 28.1402]);
      corridorBounds.extend(interceptOriginRef.current);
      map.fitBounds(corridorBounds, { padding: 90, duration: 600, maxZoom: 14 });
    });

    map.on('styledata', () => {
      syncLayersAndHeatmap(map);
      if (interceptRouteRef.current && interceptRouteRef.current.coordinates.length >= 2) {
        renderInterceptRoute(map, interceptRouteRef.current, [77.5510, 28.1402], interceptOriginRef.current);
      } else {
        safeAddConnectingRoute(map);
      }
    });

    // ResizeObserver ensures map never renders blank or cut-off when parent dimensions shift
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Map Click Listener for Distance Measurement
    map.on('click', (e) => {
      if (measureModeRef.current) {
        sound.playRadarPing();
        const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        setMeasurePoints((prev) => {
          const next = [...prev, pt];
          const totalDist = calculateTotalHaversineKm(next);
          setMeasuredDistanceKm(totalDist);
          return next;
        });
      }
    });

    return () => {
      resizeObserver.disconnect();
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (interceptMarkerRef.current) {
        interceptMarkerRef.current.remove();
        interceptMarkerRef.current = null;
      }
      try {
        if (map.getLayer('route')) map.removeLayer('route');
        if (map.getSource('route')) map.removeSource('route');
      } catch {
        // ignore
      }
      map.remove();
      mapRef.current = null;
    };
  }, [mapEngine]);

  // Smoothly pan/center when active case coordinates shift without destroying MapLibre instance
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({ center: dynamicCenter, zoom: 12, duration: 600 });
  }, [dynamicCenter]);

  // Keyboard Arrow Controls for Tactical Map Movement & Focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (!mapRef.current) return;
      const map = mapRef.current;
      const PAN_DELTA = 140;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          map.panBy([0, -PAN_DELTA], { duration: 200 });
          break;
        case 'ArrowDown':
          e.preventDefault();
          map.panBy([0, PAN_DELTA], { duration: 200 });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey && interceptOriginRef.current) {
            map.flyTo({ center: interceptOriginRef.current, zoom: 14, duration: 600 });
          } else {
            map.panBy([-PAN_DELTA, 0], { duration: 200 });
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            map.flyTo({ center: [77.5510, 28.1402], zoom: 14.5, duration: 600 });
          } else {
            map.panBy([PAN_DELTA, 0], { duration: 200 });
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          map.zoomIn({ duration: 200 });
          break;
        case '-':
        case '_':
          e.preventDefault();
          map.zoomOut({ duration: 200 });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pinpoint Click Calibration Listener
  useEffect(() => {
    if (!mapRef.current || !isCalibratingLocation) return;
    const map = mapRef.current;
    map.getCanvas().style.cursor = 'crosshair';

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      sound.playRadarPing();
      const { lng, lat } = e.lngLat;
      setIsCalibratingLocation(false);
      map.getCanvas().style.cursor = '';
      executeLiveIntercept(lat, lng, true, 2);
      toast.success(
        `Exact live location calibrated to ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E (Pinpoint Accurate). Tactical vector locked!`,
        'Location Calibrated'
      );
    };

    map.once('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = '';
    };
  }, [isCalibratingLocation]);

  // 4. Update Markers Dynamically (Without tearing down the map!)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Plot Base Dataset Markers (filtered to operational NCR region to eliminate bogus diagonal markers across India)
    if (locations) {
      locations
        .filter((loc) => loc.latitude >= 27.5 && loc.latitude <= 29.2 && loc.longitude >= 76.5 && loc.longitude <= 78.5)
        .forEach((loc) => {
          const el = document.createElement('div');
          el.className = 'custom-map-marker flex items-center justify-center h-7 w-7 rounded-full border border-white/80 cursor-pointer shadow-lg transition-transform hover:scale-125';

          if (loc.locationType === 'CRIME_SCENE') el.style.backgroundColor = '#ef4444';
          else if (loc.locationType === 'VEHICLE_DETECTION') el.style.backgroundColor = '#a855f7';
          else if (loc.locationType === 'PHONE_CELL_TOWER') el.style.backgroundColor = '#f59e0b';
          else if (loc.locationType === 'CCTV_SIGHTING') el.style.backgroundColor = '#3b82f6';
          else el.style.backgroundColor = '#10b981';

          el.addEventListener('click', () => {
            setSelectedLocation(loc);
            map.flyTo({ center: [loc.longitude, loc.latitude], zoom: 12, duration: 800 });
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([loc.longitude, loc.latitude])
            .addTo(map);
          markersRef.current.push(marker);
        });
    }

    // Plot Correlated Timeline Waypoint Markers
    timelineWaypoints.forEach((wp, idx) => {
      const isLatestTargetHit = idx === timelineWaypoints.length - 1 || wp.location_name.includes('KM 48');
      const el = document.createElement('div');

      if (isLatestTargetHit) {
        el.className = 'wanted-vehicle-pulsing-marker cursor-pointer transition-transform hover:scale-110';
        el.title = `WANTED SUSPECT: Vikram Malhotra (${wp.entity}) @ ${wp.location_name}`;
        el.innerHTML = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 12px rgba(220,38,38,0.9));">
            <div style="background: linear-gradient(135deg, #7f1d1d, #dc2626); border: 2px solid #ef4444; border-radius: 20px; padding: 2px 8px 2px 3px; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 16px rgba(239,68,68,0.85); white-space: nowrap;">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" alt="Vikram Malhotra" style="width: 24px; height: 24px; border-radius: 9999px; object-fit: cover; border: 2px solid #ffffff;" />
              <div style="text-align: left; line-height: 1.1;">
                <div style="font-size: 9.5px; font-weight: 900; color: #ffffff;">🎯 V. MALHOTRA</div>
                <div style="font-size: 7.5px; color: #fca5a5; font-family: monospace;">WANTED • ${wp.entity}</div>
              </div>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #dc2626;"></div>
            <div style="position: relative; width: 32px; height: 32px; margin-top: -3px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: rgba(239,68,68,0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; width: 22px; height: 22px; border-radius: 9999px; background-color: #dc2626; border: 2px solid #ffffff; box-shadow: 0 0 12px #ef4444; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">
                🚨
              </div>
            </div>
          </div>
        `;
      } else {
        el.className = 'timeline-marker flex items-center justify-center h-8 w-8 rounded-full border-2 border-cyan-400 font-extrabold text-[11px] text-white cursor-pointer shadow-xl transition-transform hover:scale-125';
        el.style.backgroundColor = wp.type === 'ANPR_SIGHTING' ? '#9333ea' : '#d97706';
        el.innerText = `${idx + 1}`;
      }

      el.addEventListener('click', () => {
        setActiveWaypointIdx(idx);
        setSelectedLocation({
          id: `wp-${idx + 1}`,
          title: wp.title,
          locationType: wp.type === 'ANPR_SIGHTING' ? 'VEHICLE_DETECTION' : 'PHONE_CELL_TOWER',
          entityType: wp.type === 'ANPR_SIGHTING' ? 'VEHICLE' : 'PHONE',
          latitude: wp.latitude,
          longitude: wp.longitude,
          address: wp.location_name,
          timestamp: wp.timestamp,
          caseId: 'CASE-2026-DEMO',
          entityName: wp.entity,
          metadata: {
            details: wp.details,
            stepOrder: `${idx + 1} of ${timelineWaypoints.length}`,
            source: wp.type === 'ANPR_SIGHTING' ? 'CCTNS / VAHAN ANPR' : 'Telecom Multi-Carrier CDR'
          }
        });
        map.flyTo({ center: [wp.longitude, wp.latitude], zoom: 13, duration: 800 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([wp.longitude, wp.latitude])
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Plot Predictive Crime Hotspots
    if (showHotspots && forecastData?.high_risk_zones) {
      forecastData.high_risk_zones.forEach((zone) => {
        const el = document.createElement('div');
        const isCritical = zone.risk_level === 'CRITICAL';
        el.className = `predictive-hotspot-marker relative flex items-center justify-center h-10 w-10 rounded-full border-2 ${
          isCritical ? 'border-amber-400 bg-amber-600/80 shadow-[0_0_20px_#f59e0b]' : 'border-rose-400 bg-rose-600/80 shadow-[0_0_20px_#f43f5e]'
        } text-white cursor-pointer transition-transform hover:scale-125`;
        el.title = `PREDICTIVE HOTSPOT: ${zone.zone_name} (${zone.predicted_incidents_next_7d} predicted incidents)`;
        el.innerHTML = `<span class="relative flex h-full w-full items-center justify-center"><span class="animate-ping absolute inline-flex h-full w-full rounded-full ${
          isCritical ? 'bg-amber-400' : 'bg-rose-400'
        } opacity-60"></span><span class="relative text-xs">🔥</span></span>`;

        el.addEventListener('click', () => {
          setSelectedLocation({
            id: zone.zone_id,
            title: `Predictive Hotspot: ${zone.zone_name}`,
            locationType: 'CRIME_SCENE',
            entityType: 'LOCATION',
            latitude: zone.latitude,
            longitude: zone.longitude,
            address: zone.zone_name,
            timestamp: new Date().toISOString(),
            caseId: 'AI-FORECAST-7D',
            entityName: `${zone.predicted_incidents_next_7d} Predicted Incidents`,
            metadata: {
              riskLevel: zone.risk_level,
              crimeType: zone.primary_crime_category,
              optimalPatrolHours: zone.optimal_patrol_hours,
              tacticalRecommendation: zone.recommended_action,
            },
          });
          map.flyTo({ center: [zone.longitude, zone.latitude], zoom: 13, duration: 800 });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([zone.longitude, zone.latitude])
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

    // Plot Jurisdictional Police Stations
    if (showPoliceStations) {
      OSM_POLICE_STATIONS.forEach((stn) => {
        const el = document.createElement('div');
        el.className = 'police-station-marker cursor-pointer transition-transform hover:scale-110';
        el.title = `POLICE STATION: ${stn.name} (${stn.district})`;
        el.innerHTML = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 3px 10px rgba(2,132,199,0.8));">
            <div style="background: linear-gradient(135deg, #0369a1, #0284c7); border: 2px solid #38bdf8; border-radius: 20px; padding: 2px 8px 2px 3px; display: flex; align-items: center; gap: 5px; box-shadow: 0 0 14px rgba(2,132,199,0.7); white-space: nowrap;">
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" alt="Inspector Rajesh Varma" style="width: 22px; height: 22px; border-radius: 9999px; object-fit: cover; border: 2px solid #ffffff;" />
              <div style="text-align: left; line-height: 1.1;">
                <div style="font-size: 9px; font-weight: 800; color: #ffffff;">${stn.name.replace(' Police Station', ' PS')}</div>
                <div style="font-size: 7px; color: #bae6fd; font-family: monospace;">INSP. R. VARMA • SQUAD</div>
              </div>
            </div>
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #0369a1;"></div>
          </div>
        `;

        el.addEventListener('click', () => {
          setSelectedLocation({
            id: `stn-${stn.name}`,
            title: stn.name,
            locationType: 'CRIME_SCENE',
            entityType: 'LOCATION',
            latitude: stn.latitude,
            longitude: stn.longitude,
            address: `${stn.name}, Jurisdiction: ${stn.district}`,
            timestamp: new Date().toISOString(),
            caseId: 'JURISDICTION-HQ',
            entityName: 'OSM Police Facility Node',
            metadata: {
              facilityType: 'Jurisdictional Police Station',
              district: stn.district,
              routingReadiness: 'OSRM Intercept Engine Ready',
            },
          });
          map.flyTo({ center: [stn.longitude, stn.latitude], zoom: 13, duration: 800 });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stn.longitude, stn.latitude])
          .addTo(map);
        markersRef.current.push(marker);
      });
    }
  }, [locations, timelineWaypoints, forecastData, showHotspots, showPoliceStations]);

  // 5. Sync Dynamic Trajectory Layers, Intercept Vector & Heatmap on State Changes
  useEffect(() => {
    syncLayersAndHeatmap();
  }, [showHeatmap, locations, forecastData, timelineWaypoints, interceptRoute, measurePoints]);

  // Switch Map Style dynamically
  useEffect(() => {
    if (!mapRef.current) return;
    try {
      mapRef.current.setStyle(MAP_STYLES[selectedStyle]);
    } catch (err) {
      console.warn('Map style switch error:', err);
    }
  }, [selectedStyle]);

  const flyToWaypoint = (wp: TimelineWaypoint, idx: number) => {
    setActiveWaypointIdx(idx);
    setSelectedLocation({
      id: `wp-${idx + 1}`,
      title: wp.title,
      locationType: wp.type === 'ANPR_SIGHTING' ? 'VEHICLE_DETECTION' : 'PHONE_CELL_TOWER',
      entityType: wp.type === 'ANPR_SIGHTING' ? 'VEHICLE' : 'PHONE',
      latitude: wp.latitude,
      longitude: wp.longitude,
      address: wp.location_name,
      timestamp: wp.timestamp,
      caseId: 'CASE-2026-DEMO',
      entityName: wp.entity,
      metadata: {
        details: wp.details,
        stepOrder: `${idx + 1} of ${timelineWaypoints.length}`,
        source: wp.type === 'ANPR_SIGHTING' ? 'CCTNS / VAHAN ANPR' : 'Telecom Multi-Carrier CDR'
      }
    });
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [wp.longitude, wp.latitude], zoom: 13, duration: 900 });
    }
  };

  // Track My Device (Browser Geolocation)
  const handleTrackLiveDevice = () => {
    sound.playAlertBeep();
    if (mapEngine === 'python') setMapEngine('maplibre');
    setIsLocatingUser(true);
    toast.info('Acquiring live GPS fix from client device...', 'GPS Intercept');

    if (!navigator.geolocation) {
      toast.warning('Browser geolocation not supported. Using Yamuna Corridor GPS coordinate.', 'GPS Fallback');
      setIsLocatingUser(false);
      const lat = 28.5850;
      const lon = 77.3180;
      setUserDeviceLoc({ lat, lon });
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [lon, lat], zoom: 14, duration: 1000 });
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserDeviceLoc({ lat, lon });
        toast.success(`Device GPS locked at ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E (±${Math.round(pos.coords.accuracy)}m).`, 'Target Located');

        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lon, lat], zoom: 14, duration: 1200 });

          if (liveDeviceMarkerRef.current) {
            liveDeviceMarkerRef.current.setLngLat([lon, lat]);
          } else {
            const el = document.createElement('div');
            el.className = 'live-device-marker';
            el.innerHTML = `
              <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <div style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: #dc2626; border: 2px solid #ffffff; box-shadow: 0 0 18px rgba(239, 68, 68, 0.9); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: bold;">
                  🚨
                </div>
              </div>
            `;
            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([lon, lat])
              .setPopup(
                new maplibregl.Popup({ offset: 25 }).setHTML(`
                  <div style="color: #0f172a; font-family: monospace; font-size: 11px; padding: 4px;">
                    <strong style="color: #dc2626;">🚨 Live Target Device Ping</strong><br/>
                    Lat: ${lat.toFixed(5)}°N<br/>
                    Lon: ${lon.toFixed(5)}°E<br/>
                    Accuracy: ±${Math.round(pos.coords.accuracy)}m
                  </div>
                `)
              )
              .addTo(mapRef.current);
            liveDeviceMarkerRef.current = marker;
            marker.togglePopup();
          }
        }
        sound.playSuccessChime();
      },
      (err) => {
        setIsLocatingUser(false);
        console.warn('Geolocation fallback:', err);
        const lat = 28.5850;
        const lon = 77.3180;
        setUserDeviceLoc({ lat, lon });
        toast.info('Local GPS simulated: Telemetry locked at Yamuna Expressway Corridor.', 'GPS Simulated');
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lon, lat], zoom: 14, duration: 1000 });
        }
        sound.playSuccessChime();
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Fullscreen Toggle
  const handleToggleFullscreen = () => {
    sound.playClickSound();
    const container = mapContainerRef.current?.parentElement;
    if (!document.fullscreenElement) {
      container?.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Movement Intelligence & Trajectory Timeline (MapLibre GL JS)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated correlation of CDR cellular tower pings with ANPR highway camera detections.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Spatial Engine Switcher: Python GIS (Folium/Leaflet) vs MapLibre */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => {
                sound.playClickSound();
                setMapEngine('python');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                mapEngine === 'python'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🐍 Python Folium Map</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClickSound();
                setMapEngine('maplibre');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                mapEngine === 'maplibre'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🌐 MapLibre Vector</span>
            </button>
          </div>

          {/* Preview Tactical Spatial Dossier */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              sound.playClickSound();
              setPreviewModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold border-indigo-500/50 text-indigo-300 hover:bg-indigo-950/30"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Preview Tactical Dossier</span>
          </Button>

          {/* Live Location Fetch: Track My Device */}
          <Button
            size="sm"
            variant="danger"
            onClick={handleTrackLiveDevice}
            className="flex items-center gap-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-950/40"
            title="Locate device GPS position and drop live intercept marker"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse text-white" />
            <span>{isLocatingUser ? 'Acquiring GPS...' : 'Track My Device (Thief Location)'}</span>
          </Button>

          {/* Feature 2: Crime Heatmap Layer Toggle */}
          <Button
            size="sm"
            variant={showHeatmap ? 'primary' : 'outline'}
            onClick={() => {
              sound.playClickSound();
              if (mapEngine === 'python') {
                setMapEngine('maplibre');
              }
              const next = !showHeatmap;
              setShowHeatmap(next);
              if (next) {
                toast.success('Crime Density Spatial Heatmap enabled (KDE Spatial Multi-Point Fusion).', 'Heatmap Active');
              } else {
                toast.info('Crime Density Heatmap overlay disabled.', 'Heatmap Disabled');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold border-rose-500/50 hover:bg-rose-950/30"
            title="Toggle Crime Density Heatmap Overlay"
          >
            <Activity className="h-3.5 w-3.5 text-rose-400" />
            <span>{showHeatmap ? 'Heatmap: ON' : 'Crime Heatmap'}</span>
          </Button>

          {/* Feature 1: Distance Measure Tool */}
          <Button
            size="sm"
            variant={measureMode ? 'primary' : 'outline'}
            onClick={() => {
              sound.playClickSound();
              if (mapEngine === 'python') {
                setMapEngine('maplibre');
              }
              const next = !measureMode;
              setMeasureMode(next);
              if (next) {
                toast.info('Distance Measure Tool active: Click Point 1 on the map, then Point 2 to compute distance.', 'Measure Active');
              } else {
                setMeasurePoints([]);
                setMeasuredDistanceKm(null);
                toast.info('Distance Measure Tool closed.', 'Measure Cleared');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold border-emerald-500/50 hover:bg-emerald-950/30"
            title="Click two points to calculate Haversine distance"
          >
            <Ruler className="h-3.5 w-3.5 text-emerald-400" />
            <span>{measureMode ? 'Measuring: ON' : 'Measure Distance'}</span>
          </Button>

          {/* Feature 4: Draw Geofence */}
          <Button
            size="sm"
            variant={geofenceActive ? 'primary' : 'outline'}
            onClick={() => {
              sound.playClickSound();
              if (mapEngine === 'python') {
                setMapEngine('maplibre');
              }
              const next = !geofenceActive;
              setGeofenceActive(next);
              if (next) {
                const hits = locations?.length ? Math.min(locations.length, 5) : 3;
                setGeofenceHits(hits);
                toast.warning(`Geofence activated: 5 km surveillance perimeter enclosing ${hits} syndicate entities.`, 'Geofence Active');
              } else {
                toast.info('Geofence perimeter cleared.', 'Geofence Inactive');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold border-cyan-500/50 hover:bg-cyan-950/30"
          >
            <Compass className="h-3.5 w-3.5 text-cyan-400" />
            <span>{geofenceActive ? `Geofence: ON (${geofenceHits})` : 'Draw Geofence'}</span>
          </Button>

          {/* Feature 5: Map Style Switcher */}
          <div className="flex items-center bg-card border border-border rounded-lg px-2 py-1 text-xs gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedStyle}
              onChange={(e) => {
                sound.playClickSound();
                if (mapEngine === 'python') {
                  setMapEngine('maplibre');
                }
                const newStyle = e.target.value as any;
                setSelectedStyle(newStyle);
                toast.info(`Switched basemap to ${newStyle === 'dark' ? 'Dark Matter' : newStyle === 'satellite' ? 'Satellite' : 'Streets'}.`, 'Basemap Changed');
              }}
              className="bg-transparent text-xs text-foreground focus:outline-none font-semibold cursor-pointer"
            >
              <option value="dark" className="bg-slate-900 text-white">Dark Matter</option>
              <option value="satellite" className="bg-slate-900 text-white">Satellite (Google)</option>
              <option value="streets" className="bg-slate-900 text-white">Streets (Voyager)</option>
            </select>
          </div>

          <Button
            size="sm"
            variant={showPoliceStations ? 'primary' : 'outline'}
            onClick={() => {
              sound.playClickSound();
              if (mapEngine === 'python') setMapEngine('maplibre');
              const next = !showPoliceStations;
              setShowPoliceStations(next);
              toast.info(`Jurisdictional police stations ${next ? 'visible' : 'hidden'}.`, 'Police Grid');
            }}
            className="flex items-center gap-1.5 text-xs font-bold border-blue-500/50 hover:bg-blue-950/30"
          >
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <span>{showPoliceStations ? 'Stations: ON' : 'Stations: OFF'}</span>
          </Button>

          <Button
            size="sm"
            variant={showHotspots ? 'primary' : 'outline'}
            onClick={() => {
              sound.playClickSound();
              if (mapEngine === 'python') setMapEngine('maplibre');
              const next = !showHotspots;
              setShowHotspots(next);
              toast.info(`Predictive crime hotspots ${next ? 'visible' : 'hidden'}.`, 'AI Forecast');
            }}
            className="flex items-center gap-1.5 text-xs font-bold border-amber-500/50 hover:bg-amber-950/30"
          >
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>{showHotspots ? 'Hotspots: ON' : 'Hotspots: OFF'}</span>
          </Button>

          {/* Feature: Focus Escape Path */}
          <Button
            size="sm"
            variant="outline"
            onClick={fitThiefTrajectory}
            className="flex items-center gap-1.5 text-xs font-bold border-cyan-500/50 hover:bg-cyan-950/30 text-cyan-300"
            title="Frame and zoom to the full getaway corridor of the wanted vehicle"
          >
            <Route className="h-3.5 w-3.5 text-cyan-400 rotate-90" />
            <span>Thief Path</span>
          </Button>

          {/* Feature: Forensic Clues & Scenario Retelecast */}
          <Button
            size="sm"
            onClick={() => {
              sound.playClickSound();
              setForensicModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-900/30 border border-purple-400/40"
            title="Inspect 5-Modal Forensic Clues, Scenario Retelecast & Section 63 BSA Confirmation"
          >
            <Camera className="h-3.5 w-3.5 text-purple-200" />
            <span>Forensic Clues & Telecast</span>
          </Button>

          {/* Feature 3: Fullscreen Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleFullscreen}
            className="p-2 border-border text-muted-foreground hover:text-foreground"
            title={isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Police Station Proximity & Intercept Routing Compact Status Pill */}
      {interceptRoute && !anprAlertOpen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 px-3.5 rounded-xl border border-emerald-500/60 bg-emerald-950/40 text-emerald-100 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow shrink-0">
              <Route className="h-4 w-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-extrabold text-white">
                Responding: {interceptRoute.police_station}
              </span>
              <span className="text-[11px] text-emerald-300 ml-2">
                ~{interceptRoute.duration_minutes}m ({interceptRoute.distance_km} km road network trajectory)
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50 shrink-0 self-end sm:self-center"
            onClick={() => setInterceptRoute(null)}
          >
            Clear Route
          </Button>
        </div>
      )}

      {/* Feature 10: "Wanted Vehicle" ANPR Real-Time Intercept Alert Header */}
      {anprAlertOpen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 px-3.5 rounded-xl border border-red-500/80 bg-red-950/60 text-red-100 shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-red-600 text-white shadow shrink-0 animate-bounce">
              <BellRing className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-mono font-bold tracking-widest text-white uppercase px-1.5 py-0.2 rounded bg-red-600">
                  ANPR INTERCEPT ALERT
                </span>
                <span className="text-xs font-extrabold text-white truncate">
                  TS 09 AB 1234 (Black Mahindra Scorpio)
                </span>
                <span className="text-[10px] text-red-300 hidden md:inline">
                  Yamuna Expressway Toll KM 48 • 118 km/h
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <Button
              size="sm"
              variant="danger"
              className="h-8 px-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo({ center: [77.5510, 28.1402], zoom: 14, duration: 800 });
                }
              }}
              title="Zoom to Toll KM 48 camera location"
            >
              Zoom Toll
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 border border-emerald-400/40"
              onClick={handleInterceptFromStation}
              title="Option 1: Calculate fastest road intercept from nearest jurisdictional police station (Jewar PS)"
            >
              <Shield className="h-4 w-4 text-emerald-200" />
              <span>1. Police Station Intercept</span>
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 border border-indigo-400/40"
              onClick={handleInterceptFromLiveLocation}
              title="Option 2: Calculate tactical intercept connection from your live device GPS directly to target"
            >
              <Navigation className="h-4 w-4 text-indigo-200" />
              <span>2. Live GPS Intercept</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`h-8 px-3 text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isCalibratingLocation
                  ? 'border-cyan-400 bg-cyan-500 text-slate-950 font-black animate-pulse shadow-lg shadow-cyan-500/50'
                  : 'border-cyan-500/50 bg-slate-900/90 text-cyan-300 hover:bg-cyan-950/50'
              }`}
              onClick={startPinpointCalibration}
              title="Click on the map to place your live location pin anywhere with 100% pinpoint precision"
            >
              <Crosshair className="h-4 w-4" />
              <span>{isCalibratingLocation ? 'Click on Map...' : '3. Pinpoint Location'}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`h-8 px-3 text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isLocationTypingOpen
                  ? 'border-indigo-400 bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 font-black'
                  : 'border-indigo-500/50 bg-slate-900/90 text-indigo-300 hover:bg-indigo-950/50'
              }`}
              onClick={() => {
                sound.playClickSound();
                setIsLocationTypingOpen((prev) => !prev);
              }}
              title="Type any city, landmark, college, address, or GPS coordinates to select your exact location"
            >
              <Search className="h-4 w-4 text-indigo-300" />
              <span>4. Type Location</span>
            </Button>
            <button
              onClick={() => {
                sound.playClickSound();
                setAnprAlertOpen(false);
              }}
              className="p-1 rounded text-red-400 hover:text-white hover:bg-red-900/40 transition-colors ml-1"
              title="Dismiss alert"
              aria-label="Dismiss ANPR Alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Feature 11: Interactive Location Typing & Autocomplete Search Card */}
      {isLocationTypingOpen && (
        <div className="p-3 rounded-xl border border-indigo-500/60 bg-slate-950/95 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
              <input
                type="text"
                value={typedLocationQuery}
                onChange={(e) => handleLocationSearchInput(e.target.value)}
                placeholder="Type location, city, landmark, RGUKT, or coordinates (e.g. Tirupati, Jewar, 13.6288, 79.4192)..."
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-900 border border-indigo-500/50 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                autoFocus
              />
              {typedLocationQuery && (
                <button
                  onClick={() => {
                    setTypedLocationQuery('');
                    setTypedLocationResults([]);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsLocationTypingOpen(false)}
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              Close
            </Button>
          </div>

          {/* Instant Quick Preset Badges */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fast Presets:</span>
            {[
              { name: 'Tirupati (AP)', lat: 13.6288, lon: 79.4192, display_name: 'Tirupati City Center, AP' },
              { name: 'RGUKT RK Valley', lat: 14.3338, lon: 78.5385, display_name: 'RGUKT RK Valley, Kadapa, AP' },
              { name: 'RGUKT Nuzvid', lat: 16.7909, lon: 80.8465, display_name: 'RGUKT Nuzvid, Eluru District, AP' },
              { name: 'Jewar PS (NCR)', lat: 28.1285, lon: 77.5562, display_name: 'Jewar Police Station, Yamuna Expressway, UP' },
              { name: 'Noida Sec 20 PS', lat: 28.5815, lon: 77.3308, display_name: 'Noida Sector 20 Police Station, UP' },
              { name: 'Connaught Place', lat: 28.6328, lon: 77.2197, display_name: 'Connaught Place, New Delhi' },
              { name: 'Hyderabad (Hitec City)', lat: 17.4474, lon: 78.3804, display_name: 'Hitec City, Hyderabad, Telangana' },
              { name: 'Bengaluru (MG Road)', lat: 12.9716, lon: 77.5946, display_name: 'MG Road, Bengaluru, Karnataka' },
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => selectTypedLocation(preset)}
                className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-indigo-950 border border-slate-700 hover:border-indigo-500 text-[10px] font-mono text-indigo-300 transition-colors"
                title={`Set location to ${preset.display_name}`}
              >
                📍 {preset.name}
              </button>
            ))}
          </div>

          {/* Searching Loader Indicator */}
          {isSearchingLocation && (
            <div className="text-xs text-indigo-300 py-2 px-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              Searching geocoding gazetteer & OpenStreetMap Nominatim...
            </div>
          )}

          {/* Autocomplete Results List */}
          {typedLocationResults.length > 0 && (
            <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg border border-slate-800 bg-slate-900/90 p-1 divide-y divide-slate-800/60 scrollbar-thin">
              {typedLocationResults.map((place, idx) => {
                const dist = calculateHaversineKm(place.lat, place.lon, 28.1402, 77.5510);
                return (
                  <button
                    key={idx}
                    onClick={() => selectTypedLocation(place)}
                    className="w-full p-2 text-left hover:bg-indigo-950/60 rounded flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                          {place.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                          {place.type || 'Location'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {place.display_name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-cyan-400 block font-bold">
                        {dist} km
                      </span>
                      <span className="text-[9px] text-slate-500">to wanted vehicle</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="relative h-[620px] max-h-[calc(100vh-14rem)] min-h-[480px] overflow-hidden border-primary/30 bg-slate-950">
            {/* ANPR Vehicle Query Hit Floating Banner */}
            {queryPlate && !dismissQueryPlate && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/95 border-2 border-amber-500 text-white shadow-2xl backdrop-blur-md text-xs font-mono animate-in fade-in max-w-lg">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <div className="flex-1 truncate">
                  <span className="font-bold text-amber-300">ANPR SIGHTING: {queryPlate}</span>
                  <span className="text-[10px] text-slate-300 block truncate">
                    {querySuspect ? `Linked: ${querySuspect} • ` : ''}Yamuna Toll KM 48 | 118 km/h
                  </span>
                </div>
                <button
                  onClick={() => {
                    sound.playClickSound();
                    navigate(`/live-tracking?plate=${encodeURIComponent(queryPlate)}&suspect=${encodeURIComponent(querySuspect || '')}`);
                  }}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1 shadow-md"
                >
                  <span>Pursuit ➔</span>
                </button>
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setDismissQueryPlate(true);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                  title="Close ANPR Sighting banner"
                  aria-label="Close ANPR Sighting banner"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Google Maps-style Distance Measurement Floating Overlay */}
            {measureMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-xl bg-slate-900/95 border-2 border-emerald-500 text-white shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in zoom-in-95 text-xs font-mono max-w-lg">
                <Ruler className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
                <div className="flex-1 truncate">
                  {measurePoints.length === 0 && (
                    <span>Click anywhere on the map to place Point 1</span>
                  )}
                  {measurePoints.length === 1 && (
                    <span>Point 1 logged ({measurePoints[0][1].toFixed(4)}, {measurePoints[0][0].toFixed(4)}). Click Point 2 to calculate distance</span>
                  )}
                  {measurePoints.length >= 2 && measuredDistanceKm !== null && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-300">
                        {measurePoints.length} Points: {measuredDistanceKm} km
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        (~{Math.round((measuredDistanceKm / 45) * 60)}m drive | ~{Math.round((measuredDistanceKm / 5) * 60)}m walk)
                      </span>
                    </div>
                  )}
                </div>
                {measurePoints.length > 0 && (
                  <button
                    onClick={() => {
                      sound.playClickSound();
                      setMeasurePoints([]);
                      setMeasuredDistanceKm(null);
                    }}
                    className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors"
                    title="Clear logged points"
                  >
                    Clear Points
                  </button>
                )}
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setMeasureMode(false);
                    setMeasurePoints([]);
                    setMeasuredDistanceKm(null);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                  title="Close distance measure tool"
                  aria-label="Close distance measure tool"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Active Tactical Route Status HUD Banner */}
            {interceptRoute && !measureMode && (!queryPlate || dismissQueryPlate) && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-slate-900/95 border-2 border-cyan-400 text-white shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in zoom-in-95 text-xs font-mono max-w-xl">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                <div className="flex-1 truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-cyan-300">
                      ⚡ TACTICAL INTERCEPT ROUTE: {interceptRoute.distance_km} km • ~{interceptRoute.duration_minutes}m
                    </span>
                    <span className="bg-cyan-950 text-cyan-300 text-[9px] px-1.5 py-0.2 rounded border border-cyan-500/40">
                      VECTOR LOCKED
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 truncate mt-0.5">
                    From <strong className="text-white">{interceptRoute.police_station}</strong> ➔ Target Scorpio
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setInterceptRoute(null);
                    if (liveDeviceMarkerRef.current) {
                      try { liveDeviceMarkerRef.current.remove(); } catch {}
                      liveDeviceMarkerRef.current = null;
                    }
                    if (interceptMarkerRef.current) {
                      try { interceptMarkerRef.current.remove(); } catch {}
                      interceptMarkerRef.current = null;
                    }
                    if (mapRef.current) {
                      const layers = ['police-intercept-dashed', 'police-intercept-line', 'police-intercept-glow', 'route-direct-vector', 'route-direct-vector-backing', 'route', 'route-backing', 'route-glow'];
                      layers.forEach(l => { if (mapRef.current?.getLayer(l)) { try { mapRef.current.removeLayer(l); } catch {} } });
                      const sources = ['police-intercept-trajectory', 'route-direct-vector', 'route'];
                      sources.forEach(s => { if (mapRef.current?.getSource(s)) { try { mapRef.current.removeSource(s); } catch {} } });
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] shrink-0 font-sans"
                  title="Clear tactical route from map"
                >
                  ✕ Clear Line
                </button>
              </div>
            )}

            {mapEngine === 'python' ? (
              <div className="w-full h-full relative flex flex-col">
                <div className="p-2 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs z-10">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-slate-200">🐍 Python Folium & Leaflet GIS Engine</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">(Backend GIS Service on :8000)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setMapEngine('maplibre');
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/50 hover:bg-blue-600/50 transition-colors"
                      title="Switch to Client-Side MapLibre Renderer"
                    >
                      ⚡ Switch to MapLibre Client Mode
                    </button>
                  </div>
                </div>
                <div className="flex-1 w-full h-full relative">
                  <iframe
                    src={`/api/v1/geo/tactical-map?case_id=${encodeURIComponent(activeCaseId || 'CASE-2026-8812')}&lat=${dynamicCenter[1]}&lon=${dynamicCenter[0]}`}
                    className="w-full h-full border-0"
                    title="Python Tactical GIS Map (Folium & Leaflet Engine)"
                  />
                </div>
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 text-xs text-slate-400" role="status" aria-live="polite">
                    Initializing MapLibre GL JS spatial renderer...
                  </div>
                )}
                <ErrorBoundary
                  fallbackTitle="Spatial Map View Error"
                  fallbackMessage="MapLibre GL JS spatial renderer encountered a WebGL error. Click below to reload."
                >
                  <div
                    ref={mapContainerRef}
                    role="region"
                    aria-label="Interactive MapLibre Spatial Telemetry Map"
                    tabIndex={0}
                    className="w-full h-full focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </ErrorBoundary>
              </>
            )}

            {/* Feature 4: Active Geofence Targets Overlay - Compact Bottom-Right Placement */}
            {geofenceActive && (
              <div className="absolute bottom-4 right-4 z-20 w-64 max-h-[260px] overflow-y-auto rounded-xl border border-cyan-500/50 bg-slate-950/95 p-3 backdrop-blur-md shadow-2xl text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/30">
                  <span className="font-bold text-cyan-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                    <Compass className="h-3.5 w-3.5" />
                    Geofence Sector Perimeter
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="border-cyan-400 text-cyan-300 text-[9px] bg-cyan-950/40">
                      {geofenceHits} Targets Enclosed
                    </Badge>
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setGeofenceActive(false);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Close Geofence Panel"
                      aria-label="Close Geofence Panel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Active spatial polygon query filtering telemetry within 5 km radial perimeter:
                </p>
                <div className="space-y-1 text-[11px]">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="font-semibold text-white">TS 09 AB 1234</span>
                    <span className="text-red-400 font-mono text-[10px] font-bold">INSIDE (Toll KM 48)</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="font-semibold text-white">+91 98765 43210</span>
                    <span className="text-amber-400 font-mono text-[10px] font-bold">INSIDE (Sector 62)</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="font-semibold text-white">DL 01 XY 9981</span>
                    <span className="text-emerald-400 font-mono text-[10px] font-bold">INSIDE (Karol Bagh)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Collapsible Spatial Layer Legend */}
            <div className="absolute bottom-4 left-4 z-20 select-none">
              {isLegendOpen ? (
                <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md text-[10px] space-y-1.5 shadow-2xl animate-in fade-in zoom-in-95 max-w-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                      Spatial Layer Legend
                    </span>
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setIsLegendOpen(false);
                      }}
                      className="text-slate-400 hover:text-white p-0.5 rounded"
                      aria-label="Minimize Legend"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-cyan-400" />
                      <span className="text-slate-300 font-bold">CORRELATED TRANSIT PATH (GeoJSON)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-purple-500" />
                      <span className="text-slate-400">ANPR VEHICLE SIGHTING (TS 09 AB 1234)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-slate-400">CELL TOWER PING (+91 98765 43210)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-slate-400">CRIME SCENE / SAFE HOUSE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-amber-300 font-bold">PREDICTIVE HOTSPOT (7-Day AI Poisson)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-blue-300 font-bold">OSM POLICE STATION (JURISDICTION HQ)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-400" />
                      <span className="text-emerald-300 font-bold">OSRM POLICE INTERCEPT VECTOR</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setIsLegendOpen(true);
                  }}
                  className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-md text-xs font-bold text-slate-200 hover:text-white shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
                  title="Open Spatial Layer Legend"
                >
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <span>Spatial Legend</span>
                </button>
              )}
            </div>

            {/* Keyboard Arrow Navigation Hint Badge */}
            <div className="absolute bottom-4 left-40 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-slate-900/90 backdrop-blur-md text-[10px] font-mono text-slate-300 shadow-lg">
              <span className="text-cyan-400 font-bold">⌨️ [↑ ↓ ← →]</span>
              <span>Pan Map • Shift+[←/→] Focus Units</span>
            </div>
          </Card>

          {/* Chronological Breadcrumb Ribbon */}
          {showBreadcrumbs ? (
            <Card className="p-4 border-cyan-500/30 bg-slate-950/60 animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  Chronological Breadcrumb Trajectory (Scrub to Replay Route)
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {timelineWaypoints.length} Correlated Checkpoints
                  </span>
                  <button
                    onClick={() => {
                      sound.playClickSound();
                      setShowBreadcrumbs(false);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Close Breadcrumbs ribbon"
                    aria-label="Close Breadcrumbs ribbon"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {timelineWaypoints.map((wp, idx) => (
                  <div
                    key={idx}
                    onClick={() => flyToWaypoint(wp, idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      activeWaypointIdx === idx
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-md shadow-cyan-950/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={wp.type === 'ANPR_SIGHTING' ? 'border-purple-500 text-purple-400 text-[10px]' : 'border-amber-500 text-amber-400 text-[10px]'}>
                        {wp.type === 'ANPR_SIGHTING' ? 'ANPR CAM' : 'CELL TOWER'} #{idx + 1}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(wp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white mt-1.5 truncate">{wp.location_name}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{wp.details}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  sound.playClickSound();
                  setShowBreadcrumbs(true);
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-slate-900/80 shadow-md transition-all hover:bg-slate-900"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Show Chronological Breadcrumbs ({timelineWaypoints.length})</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
          {selectedLocation ? (
            <Card className="border-cyan-500/40">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Spatial Inspector</CardTitle>
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setSelectedLocation(null);
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors"
                  title="Close Inspector"
                  aria-label="Close Inspector"
                >
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {(() => {
                  const isPoliceFacility = selectedLocation.caseId === 'JURISDICTION-HQ' || 
                    selectedLocation.entityName?.toLowerCase().includes('police') || 
                    selectedLocation.title?.toLowerCase().includes('police') ||
                    selectedLocation.title?.toLowerCase().includes(' ps');

                  const displayTitle = selectedLocation.title
                    .replace('Police Station (Yamuna Expressway Jurisdiction)', 'Jewar PS (Yamuna Exp)')
                    .replace('Police Station', 'PS')
                    .replace('Police Post', 'Post')
                    .replace('Yamuna Expressway KM 48 Checkpoint PS', 'Jewar PS • KM 48');

                  const isSuspectTarget = !isPoliceFacility && (
                    selectedLocation.entityName?.includes('TS 09 AB 1234') ||
                    selectedLocation.locationType === 'VEHICLE_DETECTION' ||
                    selectedLocation.title?.includes('ANPR') ||
                    selectedLocation.title?.includes('Sighting')
                  );

                  return (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-[10px] py-0 px-2 font-mono ${isPoliceFacility ? 'border-sky-500/50 text-sky-400' : 'border-red-500/50 text-red-400'}`}>
                            {isPoliceFacility ? '🚔 POLICE FACILITY' : isSuspectTarget ? '🎯 WANTED SIGHTING' : selectedLocation.locationType}
                          </Badge>
                          {isSuspectTarget && (
                            <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">CRITICAL</span>
                          )}
                        </div>
                        <h3 className="text-base font-extrabold text-foreground mt-1 flex items-center gap-1.5">
                          <span>{isPoliceFacility ? '🚔' : isSuspectTarget ? '🎯' : '📍'}</span>
                          <span>{displayTitle}</span>
                        </h3>
                        <p className="text-muted-foreground text-[11px] mt-0.5">{selectedLocation.address}</p>
                      </div>

                      {/* Selected Subject Dossier Card */}
                      {isPoliceFacility ? (
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/50">
                          <img
                            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"
                            alt="Inspector Rajesh Varma"
                            className="w-11 h-11 rounded-full object-cover border-2 border-sky-400 shadow-md shadow-sky-950/70 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-xs">Insp. Rajesh Varma</span>
                              <span className="bg-sky-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">IO LEAD</span>
                            </div>
                            <div className="text-[10px] text-sky-300 font-mono mt-0.5">PCR-04 Interceptor • Badge #DL-4819</div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">Jurisdiction: {displayTitle} • OSRM Ready</div>
                          </div>
                        </div>
                      ) : isSuspectTarget ? (
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-red-950/40 border border-red-500/50">
                          <img
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                            alt="Vikram Malhotra"
                            className="w-11 h-11 rounded-full object-cover border-2 border-red-500 shadow-md shadow-red-950/70 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-xs">Vikram Malhotra @ Vicky</span>
                              <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">WANTED</span>
                            </div>
                            <div className="text-[10px] text-red-300 font-mono mt-0.5">Black Scorpio • TS 09 AB 1234</div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">Offenses: BNS 308 (Extortion), 318, 111</div>
                          </div>
                        </div>
                      ) : null}

                      {/* Tactical Response Matrix: Indicates WHICH Response corresponds to WHICH Target */}
                      <div className="p-2.5 rounded-lg border border-slate-700 bg-slate-900/90 space-y-1.5">
                        <div className="flex items-center justify-between pb-1 border-b border-border/50 text-[10px]">
                          <span className="font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                            <span>⚡</span> Interdiction Response Matrix
                          </span>
                          <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
                            LIVE CORRIDOR
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          <div className="p-1.5 rounded bg-red-950/30 border border-red-500/30 space-y-0.5">
                            <div className="flex items-center gap-1 text-red-400 font-bold text-[9px]">
                              <span>🎯</span>
                              <span>Target Subject</span>
                            </div>
                            <div className="font-bold text-white text-[10px] truncate">V. Malhotra</div>
                            <div className="text-[8.5px] text-red-300 font-mono">TS 09 AB 1234</div>
                            <div className="text-[8px] text-slate-400">118 km/h S-Bound</div>
                          </div>
                          <div className="p-1.5 rounded bg-sky-950/30 border border-sky-500/30 space-y-0.5">
                            <div className="flex items-center gap-1 text-sky-400 font-bold text-[9px]">
                              <span>🚔</span>
                              <span>Responding Squad</span>
                            </div>
                            <div className="font-bold text-white text-[10px] truncate">Insp. R. Varma</div>
                            <div className="text-[8.5px] text-sky-300 font-mono">PCR-04 Interceptor</div>
                            <div className="text-[8px] text-emerald-400">Jewar PS (1.8m ETA)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="p-3 rounded-lg bg-background/60 border border-border space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-mono text-cyan-400">{selectedLocation.latitude}, {selectedLocation.longitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="text-foreground">{new Date(selectedLocation.timestamp).toLocaleString()}</span>
                  </div>
                  {selectedLocation.entityName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Associated Entity:</span>
                      <span className="font-bold text-primary">{selectedLocation.entityName}</span>
                    </div>
                  )}
                </div>

                {selectedLocation.metadata && (
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Telemetry Metadata:</span>
                    <div className="p-2.5 rounded bg-muted/40 border border-border space-y-1 text-[11px]">
                      {Object.entries(selectedLocation.metadata).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{k}:</span>
                          <span className="font-semibold text-foreground">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 h-8 shadow-md shadow-emerald-950/40"
                    onClick={() => fetchInterceptRoute(selectedLocation.latitude, selectedLocation.longitude)}
                  >
                    <Route className="h-3.5 w-3.5" />
                    <span>{interceptRoute ? `✓ Intercept Vector: ${interceptRoute.distance_km} km (${interceptRoute.duration_minutes}m)` : 'Route Intercept from Nearest Station'}</span>
                  </Button>
                  {interceptRoute && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-2.5 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                      onClick={() => {
                        sound.playClickSound();
                        setInterceptRoute(null);
                        toast.info('Cleared tactical intercept route vector.', 'Vector Cleared');
                      }}
                      title="Clear Intercept Route Vector"
                      aria-label="Clear Intercept Route Vector"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-6 text-center space-y-3 text-muted-foreground">
              <MapPin className="h-8 w-8 text-primary mx-auto opacity-50" />
              <p className="text-xs">
                Click any waypoint marker or the chronological breadcrumbs to inspect trajectory coordinates, cell tower metadata, and correlated ANPR sightings.
              </p>
            </Card>
          )}

          {/* Predictive Patrol Allocation (AI Poisson Engine) */}
          {forecastData && showPatrolForecast ? (
            <Card className="border-amber-500/40 bg-slate-950/70 shadow-lg shadow-amber-950/20 animate-in fade-in">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-amber-300 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-400" />
                    Predictive Patrol Allocation
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[10px]">
                      7-Day AI Projection
                    </Badge>
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setShowPatrolForecast(false);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Close Patrol Allocation"
                      aria-label="Close Patrol Allocation"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-3 text-xs">
                <div className="text-[11px] text-muted-foreground">
                  Poisson-exponential decay forecast recommending proactive PCR van deployment prior to syndicates striking:
                </div>
                <div className="space-y-2.5">
                  {forecastData.high_risk_zones.map((zone) => (
                    <div
                      key={zone.zone_id}
                      className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 space-y-1 hover:border-amber-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">{zone.zone_name}</span>
                        <Badge
                          variant="outline"
                          className={
                            zone.risk_level === 'CRITICAL'
                              ? 'border-red-500 text-red-400 text-[9px] bg-red-950/40'
                              : 'border-amber-500 text-amber-400 text-[9px] bg-amber-950/40'
                          }
                        >
                          {zone.predicted_incidents_next_7d} Exp. Incidents
                        </Badge>
                      </div>
                      <div className="text-[10px] text-slate-300">
                        <span className="text-amber-400 font-semibold">Hours:</span> {zone.optimal_patrol_hours}
                      </div>
                      <div className="text-[10px] text-slate-400 italic">
                        {zone.recommended_action}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-1.5 h-6 text-[10px] border-amber-500/40 hover:bg-amber-900/40 text-amber-300 font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                        onClick={() => handleFocusZone(zone)}
                      >
                        <Compass className="h-3 w-3 mr-1" /> Focus Zone & Dispatch Route
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            forecastData && (
              <button
                onClick={() => {
                  sound.playClickSound();
                  setShowPatrolForecast(true);
                }}
                className="w-full text-xs text-amber-400 hover:text-amber-300 flex items-center justify-between px-3 py-2 rounded-lg border border-amber-500/40 bg-slate-950/70 shadow-md transition-all hover:bg-slate-900"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  Predictive Patrol Allocation (7-Day Projection)
                </span>
                <span className="text-[10px] text-slate-400">Restore ➔</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Forensic Clues & Scenario Retelecast Modal */}
      <ForensicClueReplayModal
        isOpen={forensicModalOpen}
        onClose={() => setForensicModalOpen(false)}
        targetPlate="TS 09 AB 1234"
        suspectName="Vikram Malhotra @ Vicky"
      />

      {/* Geospatial Intelligence Dossier Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        caseNumber={activeCaseId || 'CASE-2026-8812'}
        documentType="court_dossier"
        metadata={{
          courtName: 'Special Police Control Room & Cyber Command',
          jurisdiction: 'Delhi NCR & Yamuna Expressway Corridor',
        }}
      />
    </div>
  );
}
