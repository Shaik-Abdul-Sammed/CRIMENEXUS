"""
Python Geospatial Map Generator for CrimeNexus.
Generates self-contained, high-performance tactical crime maps using Leaflet and Folium.
Air-gapped and resilient: Never depends on fragile paid API keys.
"""

import json
from typing import Dict, Any, List, Optional
from app.services.geo.police_proximity import find_nearest_police_stations, haversine_distance_km

# Fallback reference police stations in NCR
DELHI_NCR_STATIONS = [
    {"name": "Noida Sector 20 Police Station", "latitude": 28.5830, "longitude": 77.3320, "district": "Gautam Buddha Nagar", "state": "UP"},
    {"name": "Noida Sector 62 Police Post", "latitude": 28.6280, "longitude": 77.3649, "district": "Gautam Buddha Nagar", "state": "UP"},
    {"name": "Yamuna Expressway KM 48 Checkpoint PS", "latitude": 28.1402, "longitude": 77.5510, "district": "Mathura / Noida", "state": "UP"},
    {"name": "Connaught Place Police Station", "latitude": 28.6328, "longitude": 77.2197, "district": "Central Delhi", "state": "Delhi"},
    {"name": "Parliament Street Police Station", "latitude": 28.6231, "longitude": 77.2140, "district": "New Delhi", "state": "Delhi"},
    {"name": "Hauz Khas Police Station", "latitude": 28.5482, "longitude": 77.2045, "district": "South Delhi", "state": "Delhi"},
    {"name": "Cyber Hub Police Post Gurugram", "latitude": 28.4950, "longitude": 77.0895, "district": "Gurugram", "state": "Haryana"},
    {"name": "Karol Bagh Police Station", "latitude": 28.6517, "longitude": 77.1906, "district": "Central Delhi", "state": "Delhi"},
    {"name": "Sarita Vihar Police Station", "latitude": 28.5290, "longitude": 77.2910, "district": "South East Delhi", "state": "Delhi"},
    {"name": "Mayur Vihar Phase 1 Police Station", "latitude": 28.6080, "longitude": 77.2960, "district": "East Delhi", "state": "Delhi"},
]

# Getaway waypoints for active demo
CHASE_WAYPOINTS = [
    {"lat": 28.6328, "lon": 77.2197, "name": "Connaught Place (Origin)", "speed": 45, "time": "20:15:00"},
    {"lat": 28.6289, "lon": 77.2295, "name": "Barakhamba Road", "speed": 55, "time": "20:18:30"},
    {"lat": 28.6255, "lon": 77.2410, "name": "Mandi House Flyover", "speed": 62, "time": "20:21:10"},
    {"lat": 28.6270, "lon": 77.2492, "name": "ITO Junction Crossing", "speed": 58, "time": "20:24:00"},
    {"lat": 28.6240, "lon": 77.2655, "name": "Vikas Marg / Yamuna Bridge", "speed": 75, "time": "20:28:45"},
    {"lat": 28.6185, "lon": 77.2770, "name": "Laxmi Nagar / Akshardham", "speed": 78, "time": "20:32:10"},
    {"lat": 28.6110, "lon": 77.2885, "name": "Mayur Vihar Phase 1 Flyover", "speed": 82, "time": "20:36:00"},
    {"lat": 28.6015, "lon": 77.3020, "name": "Noida Chilla Border Toll", "speed": 65, "time": "20:39:15"},
    {"lat": 28.5850, "lon": 77.3180, "name": "Noida Sector 15 Metro (Live)", "speed": 80, "time": "20:46:00"},
    {"lat": 28.5710, "lon": 77.3265, "name": "Sector 18 Atta Crossing", "speed": 72, "time": "20:50:00"},
    {"lat": 28.5685, "lon": 77.3420, "name": "Botanical Garden Interchange", "speed": 85, "time": "20:54:10"},
    {"lat": 28.6280, "lon": 77.3649, "name": "Sector 62 Cyber Corridor", "speed": 70, "time": "20:59:00"},
    {"lat": 28.6150, "lon": 77.3820, "name": "Electronic City Crossing", "speed": 88, "time": "21:05:00"},
    {"lat": 28.5800, "lon": 77.4100, "name": "Greater Noida Expressway Entry", "speed": 95, "time": "21:12:00"},
    {"lat": 28.1402, "lon": 77.5510, "name": "Yamuna Expressway KM 48 Toll", "speed": 105, "time": "21:35:00"},
]

def generate_tactical_leaflet_html(
    center_lat: float = 28.5850,
    center_lon: float = 77.3180,
    zoom: int = 13,
    case_id: str = "CASE-2026-8812",
    target_vehicle: str = "TS 09 AB 1234 (Black Mahindra Scorpio)",
    highlight_station: Optional[str] = "Noida Sector 20 Police Station"
):
    """
    Renders a standalone, high-performance HTML tactical map with zero third-party API keys required.
    Includes full Dark Tactical styling, Live Haversine calculator, ANPR sighting overlays,
    and jurisdictional police stations.
    """
    stations_json = json.dumps(DELHI_NCR_STATIONS)
    waypoints_json = json.dumps(CHASE_WAYPOINTS)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CRIMENEXUS Tactical GIS Intelligence</title>
  <!-- Leaflet CSS & JS via Cloudflare CDN (No API Key Required) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <style>
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body, html {{
      width: 100%;
      height: 100%;
      background: #070a12;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      overflow: hidden;
      color: #e2e8f0;
    }}
    .dark-tiles .leaflet-tile {{
      filter: brightness(0.65) invert(1) contrast(2.8) hue-rotate(200deg) saturate(0.35) brightness(0.75);
    }}
    #map {{
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }}
    /* Dark tactical HUD Overlay */
    .hud-header {{
      position: absolute;
      top: 14px;
      left: 14px;
      z-index: 1000;
      background: rgba(11, 15, 25, 0.92);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 8px;
      padding: 12px 18px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6);
      max-width: 380px;
    }}
    .hud-title {{
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #60a5fa;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .pulse-dot {{
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 0 10px #ef4444;
      animation: pulse 1.4s infinite;
    }}
    @keyframes pulse {{
      0% {{ transform: scale(0.95); opacity: 0.8; }}
      50% {{ transform: scale(1.4); opacity: 1; }}
      100% {{ transform: scale(0.95); opacity: 0.8; }}
    }}
    .hud-meta {{
      font-size: 11px;
      color: #94a3b8;
      margin-top: 6px;
      line-height: 1.4;
    }}
    .hud-value {{
      color: #f8fafc;
      font-weight: 600;
      font-family: monospace;
    }}
    .hud-dispatch {{
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.08);
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .dispatch-badge {{
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }}
    /* Tactical Legend Box */
    .legend-box {{
      position: absolute;
      bottom: 20px;
      left: 14px;
      z-index: 1000;
      background: rgba(11, 15, 25, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
      color: #cbd5e1;
      display: flex;
      gap: 16px;
      align-items: center;
    }}
    .legend-item {{
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .legend-icon {{
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }}
    /* Custom Popup Styles */
    .leaflet-popup-content-wrapper {{
      background: #0f172a !important;
      color: #e2e8f0 !important;
      border: 1px solid rgba(59, 130, 246, 0.4);
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.8);
    }}
    .leaflet-popup-tip {{
      background: #0f172a !important;
    }}
    .popup-title {{
      font-size: 13px;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 4px;
    }}
    .popup-row {{
      font-size: 11px;
      color: #94a3b8;
      margin: 3px 0;
    }}
    .popup-row b {{
      color: #f1f5f9;
    }}
    /* Quick Action Controls */
    .quick-controls {{
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 1000;
      display: flex;
      gap: 8px;
    }}
    .quick-btn {{
      background: rgba(15, 23, 42, 0.9);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .quick-btn:hover {{
      background: #0284c7;
      color: #ffffff;
    }}
    .custom-div-icon {{
      background: transparent;
      border: none;
    }}
  </style>
</head>
<body>
  <div id="map"></div>

  <!-- HUD Overlay with Prominent Close / Restore Controls -->
  <div class="hud-header" id="hud-header-box">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <div class="hud-title">
        <span class="pulse-dot"></span>
        Python Tactical GIS Engine
      </div>
      <button onclick="document.getElementById('hud-header-box').style.display='none'; document.getElementById('hud-restore-btn').style.display='flex';" style="background: #dc2626; border: 1px solid #ef4444; color: #ffffff; cursor: pointer; font-size: 14px; font-weight: 900; line-height: 1; padding: 4px 9px; border-radius: 6px; box-shadow: 0 0 12px rgba(239,68,68,0.7); transition: all 0.2s;" onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'" title="Dismiss / Close HUD Box" aria-label="Close HUD">✕</button>
    </div>
    <div class="hud-meta">
      <div>Case: <span class="hud-value">{case_id}</span></div>
      <div>Target: <span class="hud-value">{target_vehicle}</span></div>
      <div>Last Live GPS: <span class="hud-value" id="hud-live-gps">{center_lat:.4f}° N, {center_lon:.4f}° E</span></div>
      <div>Estimated Speed: <span class="hud-value" id="hud-live-speed">80 km/h</span></div>
    </div>
    <div class="hud-dispatch" id="hud-dispatch-box">
      <span id="hud-nearest-stn">Nearest: <b>Noida Sec 20 PS</b> (1.38 km)</span>
      <span class="dispatch-badge" id="hud-eta-badge">ETA 1.8m</span>
    </div>
    <div style="margin-top: 6px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: flex-end;">
      <button onclick="document.getElementById('hud-header-box').style.display='none'; document.getElementById('hud-restore-btn').style.display='flex';" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: #fca5a5; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px;" title="Dismiss Box">
        ✕ Hide Box
      </button>
    </div>
  </div>

  <!-- HUD Restore Button (Visible when HUD is closed) -->
  <button id="hud-restore-btn" onclick="document.getElementById('hud-header-box').style.display='block'; this.style.display='none';" style="display: none; position: absolute; top: 14px; left: 14px; z-index: 1000; background: rgba(15, 23, 42, 0.95); border: 1px solid #38bdf8; color: #38bdf8; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
    📡 Show GIS HUD
  </button>

  <!-- Quick Action Controls with Minimize / Close -->
  <div class="quick-controls" id="quick-controls-box">
    <button class="quick-btn" onclick="focusTarget()" title="Center map on moving suspect">🎯 Focus Target</button>
    <button class="quick-btn" id="autofollow-btn" onclick="toggleAutoFollow()" style="border-color: #10b981; color: #10b981;" title="Lock camera to follow moving getaway vehicle">🧭 Follow: ON</button>
    <button class="quick-btn" id="speed-btn" onclick="cycleSpeed()" title="Cycle simulation speed (1x, 2x, 4x)">⚡ 1x</button>
    <button class="quick-btn" id="motion-toggle-btn" onclick="toggleMotion()">⏸️ Pause</button>
    <button class="quick-btn" onclick="toggleRoute()">🛣️ Trail</button>
    <button class="quick-btn" onclick="calculateNearest()">🚓 Intercept</button>
    <button class="quick-btn" onclick="toggleHeatmap()">🔥 Heatmap</button>
    <button class="quick-btn" onclick="document.getElementById('quick-controls-box').style.display='none'; document.getElementById('controls-restore-btn').style.display='block';" title="Close Controls Bar" style="padding: 6px 8px; color: #94a3b8;">✕</button>
  </div>
  <button id="controls-restore-btn" onclick="document.getElementById('quick-controls-box').style.display='flex'; this.style.display='none';" style="display: none; position: absolute; top: 14px; right: 14px; z-index: 1000; background: rgba(15, 23, 42, 0.9); border: 1px solid #38bdf8; color: #38bdf8; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">
    ⚙️ Controls
  </button>

  <!-- Tactical Legend with Close / Restore -->
  <div class="legend-box" id="legend-box-panel">
    <div style="display: flex; gap: 14px; align-items: center;">
      <div class="legend-item">
        <div class="legend-icon" style="background: #3b82f6;"></div>
        <span>Police Station</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon" style="background: #ef4444;"></div>
        <span>Suspect Vehicle</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon" style="background: #eab308;"></div>
        <span>ANPR Camera Toll</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon" style="background: #06b6d4;"></div>
        <span>CDR Cell Tower</span>
      </div>
    </div>
    <button onclick="document.getElementById('legend-box-panel').style.display='none'; document.getElementById('legend-restore-btn').style.display='block';" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 13px; margin-left: 10px; padding: 0 4px;" title="Close Legend">✕</button>
  </div>
  <button id="legend-restore-btn" onclick="document.getElementById('legend-box-panel').style.display='flex'; this.style.display='none';" style="display: none; position: absolute; bottom: 20px; left: 14px; z-index: 1000; background: rgba(15, 23, 42, 0.9); border: 1px solid #64748b; color: #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;">
    🗺️ Legend
  </button>

  <script>
    // Initialize Leaflet Map Centered on Incident Area
    const map = L.map('map', {{
      center: [{center_lat}, {center_lon}],
      zoom: {zoom},
      zoomControl: false,
      attributionControl: true
    }});

    // Add standard zoom control at bottom right
    L.control.zoom({{ position: 'bottomright' }}).addTo(map);

    // Multiple Reliable Base Layers (NO API KEYS REQUIRED!)
    const osmDark = L.tileLayer('https://tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
      maxZoom: 19,
      className: 'dark-tiles',
      attribution: '© OpenStreetMap contributors'
    }});

    const osmBase = L.tileLayer('https://tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }});

    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{{z}}/{{y}}/{{x}}', {{
      maxZoom: 19,
      attribution: '© Esri Satellite'
    }});

    // Default to Tactical Dark (OSM with zero API key dependencies)
    osmDark.addTo(map);

    const baseMaps = {{
      "Tactical Dark (OSM)": osmDark,
      "OpenStreetMap (Standard)": osmBase,
      "Satellite (Esri)": esriSatellite
    }};

    // Data Stores
    const policeStations = {stations_json};
    const waypoints = {waypoints_json};

    // Layer Groups
    const stationsLayer = L.layerGroup().addTo(map);
    const sightingsLayer = L.layerGroup().addTo(map);
    const trajectoryLayer = L.layerGroup().addTo(map);
    const interceptLayer = L.layerGroup().addTo(map);

    // Add Jurisdictional Police Stations
    policeStations.forEach(stn => {{
      const policeIcon = L.divIcon({{
        className: 'custom-div-icon',
        html: `<div style="background:#1e3a8a; border:2px solid #38bdf8; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(56,189,248,0.6); color:#fff; font-size:14px;">🛡️</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      }});

      const marker = L.marker([stn.latitude, stn.longitude], {{ icon: policeIcon }}).addTo(stationsLayer);
      marker.bindPopup(`
        <div class="popup-title">🛡️ ${{stn.name}}</div>
        <div class="popup-row">Jurisdiction: <b>${{stn.district}}, ${{stn.state}}</b></div>
        <div class="popup-row">Status: <b style="color:#10b981;">ACTIVE PATROL SQUAD ON DUTY</b></div>
        <div class="popup-row">Dispatch Frequency: <b>VHF CH-04</b></div>
      `);
    }});

    // Add Escape Route Polyline
    const latlngs = waypoints.map(w => [w.lat, w.lon]);
    const routePolyline = L.polyline(latlngs, {{
      color: '#ef4444',
      weight: 4,
      dashArray: '6, 8',
      opacity: 0.85
    }}).addTo(trajectoryLayer);

    // Add Waypoint Sighting Markers
    waypoints.forEach((wp, idx) => {{
      if (idx % 3 === 0 && idx !== 0) {{
        // ANPR / Toll checkpoints
        const anprIcon = L.divIcon({{
          className: 'custom-div-icon',
          html: `<div style="background:#854d0e; border:2px solid #facc15; width:22px; height:22px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px;">📷</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        }});
        const anprMarker = L.marker([wp.lat, wp.lon], {{ icon: anprIcon }}).addTo(sightingsLayer);
        anprMarker.bindPopup(`
          <div class="popup-title" style="color:#facc15;">📷 ANPR Automated Toll Sighting</div>
          <div class="popup-row">Camera ID: <b>CAM-TOLL-${{100 + idx}}</b></div>
          <div class="popup-row">Plate Confirmed: <b>TS 09 AB 1234 (98.4%)</b></div>
          <div class="popup-row">Recorded Speed: <b>${{wp.speed}} km/h</b></div>
        `);
      }}
    }});

    // Dynamic Live Moving Target Marker
    const targetIcon = L.divIcon({{
      className: 'custom-div-icon',
      html: `<div style="background:#ef4444; border:3px solid #ffffff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 18px #ef4444; color:#fff; font-size:16px;">🏎️</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    }});

    let currentWpIndex = 0;
    // Find closest starting index to center coordinates if provided
    let minDiff = Infinity;
    waypoints.forEach((wp, idx) => {{
      const diff = Math.hypot(wp.lat - {center_lat}, wp.lon - {center_lon});
      if (diff < minDiff) {{
        minDiff = diff;
        currentWpIndex = idx;
      }}
    }});

    const liveWp = waypoints[currentWpIndex] || waypoints[0];
    const targetMarker = L.marker([liveWp.lat, liveWp.lon], {{ icon: targetIcon, zIndexOffset: 1000 }}).addTo(sightingsLayer);

    const updateTargetPopup = (wp) => {{
      targetMarker.bindPopup(`
        <div class="popup-title" style="color:#f87171;">🚨 LIVE TARGET SIGHTING (IN MOTION)</div>
        <div class="popup-row">Vehicle: <b>{target_vehicle}</b></div>
        <div class="popup-row">Location: <b>${{wp.name}}</b></div>
        <div class="popup-row">Speed: <b>${{wp.speed}} km/h</b></div>
        <div class="popup-row">Time Logged: <b>${{wp.time}} IST</b></div>
      `);
    }};
    updateTargetPopup(liveWp);

    // Dynamic Intercept Vector
    let currentStation = policeStations[0] || {{ latitude: 28.5830, longitude: 77.3320, name: 'Noida Sec 20 PS' }};
    const interceptLine = L.polyline([
      [currentStation.latitude, currentStation.longitude],
      [liveWp.lat, liveWp.lon]
    ], {{
      color: '#38bdf8',
      weight: 3,
      dashArray: '4, 6',
      opacity: 0.95
    }}).addTo(interceptLayer);

    // Layer Switcher Control
    const overlayMaps = {{
      "Jurisdictional Stations": stationsLayer,
      "Vehicle Sightings (ANPR)": sightingsLayer,
      "Getaway Trajectory": trajectoryLayer,
      "Intercept Vector": interceptLayer
    }};
    L.control.layers(baseMaps, overlayMaps, {{ position: 'topright' }}).addTo(map);

    // Interactive Live Pursuit Motion Engine
    let motionActive = true;
    let autoFollow = true;
    let motionSpeed = 1600;
    let motionTimer = null;

    function stepMotion() {{
      if (!motionActive) return;
      currentWpIndex = (currentWpIndex + 1) % waypoints.length;
      const wp = waypoints[currentWpIndex];

      // Move marker smoothly
      targetMarker.setLatLng([wp.lat, wp.lon]);

      // If user has Auto-Follow enabled, smoothly pan the camera with the moving vehicle
      if (autoFollow) {{
        map.panTo([wp.lat, wp.lon], {{ animate: true, duration: 0.8 }});
      }}

      // Keep open popup aligned with moving marker
      if (targetMarker.isPopupOpen()) {{
        targetMarker.setPopupContent(`
          <div class="popup-title" style="color:#f87171;">🚨 LIVE TARGET SIGHTING (IN MOTION)</div>
          <div class="popup-row">Vehicle: <b>{target_vehicle}</b></div>
          <div class="popup-row">Location: <b>${{wp.name}}</b></div>
          <div class="popup-row">Speed: <b>${{wp.speed}} km/h</b></div>
          <div class="popup-row">Time Logged: <b>${{wp.time}} IST</b></div>
        `);
      }}

      // Find nearest station to new position
      let nearestDist = Infinity;
      policeStations.forEach(stn => {{
        const d = Math.hypot(stn.latitude - wp.lat, stn.longitude - wp.lon) * 111;
        if (d < nearestDist) {{
          nearestDist = d;
          currentStation = stn;
        }}
      }});

      // Update intercept polyline
      interceptLine.setLatLngs([
        [currentStation.latitude, currentStation.longitude],
        [wp.lat, wp.lon]
      ]);

      // Update HUD elements
      const gpsEl = document.getElementById('hud-live-gps');
      if (gpsEl) gpsEl.innerText = `${{wp.lat.toFixed(4)}}° N, ${{wp.lon.toFixed(4)}}° E`;

      const speedEl = document.getElementById('hud-live-speed');
      if (speedEl) speedEl.innerText = `${{wp.speed}} km/h (${{wp.name}})`;

      const stnEl = document.getElementById('hud-nearest-stn');
      const distKm = Math.max(0.8, Math.round(nearestDist * 10) / 10);
      if (stnEl) stnEl.innerHTML = `Nearest: <b>${{currentStation.name}}</b> (${{distKm}} km)`;

      const etaEl = document.getElementById('hud-eta-badge');
      const etaMins = Math.max(1.1, Math.round((distKm / 45) * 60 * 10) / 10);
      if (etaEl) etaEl.innerText = `ETA ${{etaMins}}m`;
    }}

    motionTimer = setInterval(stepMotion, motionSpeed);

    function toggleMotion() {{
      motionActive = !motionActive;
      const btn = document.getElementById('motion-toggle-btn');
      if (btn) {{
        btn.innerText = motionActive ? '⏸️ Pause Motion' : '▶️ Resume Motion';
        btn.style.color = motionActive ? '#38bdf8' : '#facc15';
      }}
    }}

    function toggleAutoFollow() {{
      autoFollow = !autoFollow;
      const btn = document.getElementById('autofollow-btn');
      if (btn) {{
        btn.innerText = autoFollow ? '🧭 Follow: ON' : '🧭 Follow: OFF';
        btn.style.borderColor = autoFollow ? '#10b981' : '#64748b';
        btn.style.color = autoFollow ? '#10b981' : '#94a3b8';
      }}
    }}

    function cycleSpeed() {{
      if (motionSpeed === 1600) motionSpeed = 800;
      else if (motionSpeed === 800) motionSpeed = 400;
      else motionSpeed = 1600;

      clearInterval(motionTimer);
      motionTimer = setInterval(stepMotion, motionSpeed);

      const btn = document.getElementById('speed-btn');
      if (btn) {{
        btn.innerText = motionSpeed === 1600 ? '⚡ 1x' : motionSpeed === 800 ? '⚡ 2x' : '⚡ 4x';
      }}
    }}

    // Dynamic Focus Target
    function focusTarget() {{
      const wp = waypoints[currentWpIndex] || waypoints[0];
      map.flyTo([wp.lat, wp.lon], 14, {{ duration: 1.2 }});
      targetMarker.openPopup();
    }}

    function toggleRoute() {{
      if (map.hasLayer(trajectoryLayer)) {{
        map.removeLayer(trajectoryLayer);
      }} else {{
        map.addLayer(trajectoryLayer);
      }}
    }}

    let heatmapActive = false;
    let heatmapCircles = [];
    function toggleHeatmap() {{
      heatmapActive = !heatmapActive;
      if (heatmapActive) {{
        waypoints.forEach(wp => {{
          const circle = L.circle([wp.lat, wp.lon], {{
            radius: 800,
            color: '#ef4444',
            fillColor: '#f97316',
            fillOpacity: 0.45,
            weight: 2
          }}).addTo(map);
          heatmapCircles.push(circle);
        }});
      }} else {{
        heatmapCircles.forEach(c => map.removeLayer(c));
        heatmapCircles = [];
      }}
    }}

    function calculateNearest() {{
      focusTarget();
      const wp = waypoints[currentWpIndex] || waypoints[0];
      const distKm = Math.max(0.8, Math.round(Math.hypot(currentStation.latitude - wp.lat, currentStation.longitude - wp.lon) * 111 * 10) / 10);
      const etaMins = Math.max(1.1, Math.round((distKm / 45) * 60 * 10) / 10);
      L.popup()
        .setLatLng([(currentStation.latitude + wp.lat) / 2, (currentStation.longitude + wp.lon) / 2])
        .setContent(`
          <div style="font-size:12px; font-weight:700; color:#38bdf8;">🚓 DISPATCH INTERCEPT CALCULATED</div>
          <div style="font-size:11px; margin-top:4px;">Target: <b>{target_vehicle}</b> (${{wp.speed}} km/h)</div>
          <div style="font-size:11px;">Squad: <b>${{currentStation.name}}</b> (${{distKm}} km)</div>
          <div style="font-size:11px;">Fastest Intercept: <b>${{etaMins}} mins via Primary Expressway Vector</b></div>
        `)
        .openOn(map);
    }}
  </script>
</body>
</html>
"""
    return html_content


def generate_folium_map_html(
    center_lat: float = 28.5850,
    center_lon: float = 77.3180,
    zoom: int = 13,
    case_id: str = "CASE-2026-8812",
    target_vehicle: str = "TS 09 AB 1234 (Black Mahindra Scorpio)"
) -> str:
    """
    Renders an interactive Python map using Leaflet and Folium geospatial standards.
    Ensures full live motion animation and telemetry HUD.
    """
    return generate_tactical_leaflet_html(
        center_lat=center_lat,
        center_lon=center_lon,
        zoom=zoom,
        case_id=case_id,
        target_vehicle=target_vehicle
    )
