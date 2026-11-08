"""
CRIMENEXUS Digital Exhaust & Omni-Trace Simulator Engine.

Generates hyper-realistic, multi-source digital footprint payloads across 5 core dimensions:
1. Telecom & ISP (ICCID, Bluetooth MAC, WiFi Probe Request, ISP DNS Query, Tor Exit Node DPI)
2. E-Commerce & Logistics (Amazon Order, Zomato 2 AM delivery, Uber Karol Bagh -> Noida trip)
3. Social & Cloud (Instagram EXIF Geotag, Google Drive Sync IP, YouTube Watch History)
4. IoT & Smart Home (Alexa Voice Command, Smart Doorbell PIR event, Fitness Tracker Heart Rate spike)
5. Financial (Alternative) (Crypto P2P Binance off-ramp, Amazon Gift Card, CIBIL Hard Inquiry)

Fuses all 100+ digital traces into a Section 63 Bharatiya Sakshya Adhiniyam (BSA) court-admissible arrest warrant.
"""

import time
import hashlib
from typing import Dict, Any, List


class DigitalExhaustSimulator:
    """
    Simulates high-fidelity mock data feeds from commercial platforms,
    telecom carriers, and cloud providers for criminal evasion analysis.
    """

    def __init__(self):
        self.target_name = "Rajan Verma (Alias: Rajan Bhai / Shadow-01)"
        self.imei = "358912093847291"
        self.upi_id = "rajan.bhai@okhdfcbank"
        self.safehouse_lat = 28.6280
        self.safehouse_lon = 77.3649
        self.safehouse_address = "Flat 402, Block C, Green View Apartments, Sector 62, Noida, Uttar Pradesh 201309"

    def get_telecom_isp_traces(self) -> Dict[str, Any]:
        """Category 1: Telecom, RF & ISP Infrastructure Logs."""
        return {
            "category_name": "Telecom & ISP Network Forensics",
            "provider_count": 4,
            "status": "CORRELATED",
            "traces": [
                {
                    "trace_id": "TEL-ICCID-882190",
                    "type": "SIM_ICCID_TELEMETRY",
                    "source": "Airtel Lawful Intercept Gateway (CDoT / CMS)",
                    "timestamp": "2026-10-29T08:14:22Z",
                    "confidence": 98.6,
                    "payload": {
                        "iccid": "89910009238491029381",
                        "imsi": "404450918234891",
                        "msisdn": "+91 98765 43210 (Swapped to Burner: +91 91234 56789)",
                        "bound_imei": self.imei,
                        "cell_global_id": "404-45-6201-1402",
                        "tower_location": "Noida Sector 62 Main Substation Mast #04",
                        "azimuth_degrees": 120,
                        "timing_advance_distance_m": 340,
                    },
                    "forensic_finding": "SIM card IMSI was swapped, but underlying hardware IMEI 358912093847291 stayed identical and attached to Sector 62 tower.",
                },
                {
                    "trace_id": "RF-BT-BLE-40291",
                    "type": "BLUETOOTH_MAC_BEACON",
                    "source": "Municipal Smart Pole BLE Sniffer #SP-62-09",
                    "timestamp": "2026-10-29T08:32:05Z",
                    "confidence": 94.2,
                    "payload": {
                        "mac_address": "BC:D0:74:12:9A:FF",
                        "advertised_name": "Rajan_Buds_Pro (Apple AirPods Pro 2)",
                        "rssi_dbm": -68,
                        "proximity_meters": 14.5,
                        "smart_pole_id": "SP-NOIDA-62-GATE2",
                    },
                    "forensic_finding": "Persistent BLE MAC detected in RF range of Smart Pole 09 outside Sector 62 housing society entrance.",
                },
                {
                    "trace_id": "RF-WIFI-PROBE-1092",
                    "type": "WIFI_PROBE_REQUEST",
                    "source": "Neighborhood AP Probe Listener (Pwnagotchi Grid)",
                    "timestamp": "2026-10-29T08:45:11Z",
                    "confidence": 97.1,
                    "payload": {
                        "client_mac": "F2:3A:99:BC:11:42 (Randomized LAA)",
                        "queried_ssid": "Home_WiFi",
                        "secondary_ssid": "Airtel_Fiber_Safehouse_9G",
                        "signal_strength_dbm": -58,
                        "bssid_cache": ["a4:2b:b0:df:11:c9", "30:23:03:ee:88:21"],
                        "estimated_radius_meters": 35.0,
                    },
                    "forensic_finding": "Device broadcasted 802.11 probe frame explicitly requesting known historic SSID 'Home_WiFi' within 35m of Flat 402.",
                },
                {
                    "trace_id": "ISP-DNS-DPI-7712",
                    "type": "ISP_DNS_QUERY_LOG",
                    "source": "ACT Fibernet Central NAT Gateway (AS132944)",
                    "timestamp": "2026-10-29T09:02:18Z",
                    "confidence": 93.8,
                    "payload": {
                        "source_ip": "122.161.44.89",
                        "resolved_domain": "api.binance.com",
                        "dns_server": "103.212.227.1 (ACT Primary DNS)",
                        "secondary_queries": [
                            "api.wazirx.com",
                            "check.torproject.org",
                            "web.telegram.org",
                        ],
                        "subscriber_account": "ACT-DEL-NOIDA-98102 (Registered to proxy identity 'Suresh Kumar')",
                    },
                    "forensic_finding": "Residential broadband queried crypto off-ramp and TOR check domains from a safehouse line registered to known associate Suresh.",
                },
                {
                    "trace_id": "NET-TOR-EXIT-5519",
                    "type": "TOR_EXIT_NODE_DEANONYMIZATION",
                    "source": "National Cyber Crime Threat Exchange (N4C-DPI)",
                    "timestamp": "2026-10-29T09:15:40Z",
                    "confidence": 91.5,
                    "payload": {
                        "tor_relay_ip": "185.220.101.5 (Germany Exit Node)",
                        "protocol": "TLS v1.3 / Port 443",
                        "fallback_destination_ip": "122.161.44.89 (ACT Broadband Noida)",
                        "target_service": "Telegram Bot API (C2 Channel)",
                        "packet_burst_bytes": 142800,
                    },
                    "forensic_finding": "TOR circuit dropped during large file upload; packet fallback leaked raw residential IP 122.161.44.89.",
                },
            ],
        }

    def get_ecommerce_logistics_traces(self) -> Dict[str, Any]:
        """Category 2: E-Commerce, Food Delivery & Ride-Hailing Telemetry."""
        return {
            "category_name": "E-Commerce, Delivery & Urban Mobility",
            "provider_count": 3,
            "status": "CORRELATED",
            "traces": [
                {
                    "trace_id": "ECOM-AMAZON-40291",
                    "type": "AMAZON_ORDER_FULFILLMENT",
                    "source": "Amazon India Lawful Production Order / Logistics Webhook",
                    "timestamp": "2026-10-28T16:45:00Z",
                    "confidence": 95.4,
                    "payload": {
                        "order_id": "OD-402-8812901-9218291",
                        "item_ordered": "Nokia 105 Dual SIM Feature Phone (Burner Handset) - Charcoal Black",
                        "delivery_address": self.safehouse_address,
                        "recipient_name": "R. K. Verma",
                        "tracking_status": "DELIVERED",
                        "delivered_time": "2026-10-29T11:20:00Z",
                        "delivery_agent_geo": {"latitude": self.safehouse_lat, "longitude": self.safehouse_lon},
                        "drop_box_code": "BOX-402",
                    },
                    "forensic_finding": "Amazon delivery vehicle verified physically dropping a feature phone handset directly to Flat 402 Sector 62.",
                },
                {
                    "trace_id": "ECOM-ZOMATO-2026-88",
                    "type": "ZOMATO_MIDNIGHT_DELIVERY",
                    "source": "Zomato India Lawful Production Order",
                    "timestamp": "2026-10-29T02:14:32Z",
                    "confidence": 96.9,
                    "payload": {
                        "order_id": "ZOM-2026-991201",
                        "restaurant": "Midnight Biryani & Rolls Express (Sector 59 Noida)",
                        "delivery_address": "Safehouse C-402, Green View Apts, Sector 62, Noida",
                        "food_items": ["Hyderabadi Chicken Biryani (Family Pack)", "Thumbs Up 750ml", "2x Energy Drinks"],
                        "delivery_time": "02:14 AM (Late Night)",
                        "delivery_partner": "Mukesh Y. (Bike DL-5S-9912)",
                        "rider_delivery_coords": {"latitude": 28.6288, "longitude": 77.3655},
                        "payment_mode": "Cash on Delivery (₹640)",
                    },
                    "forensic_finding": "Midnight food order delivered at 02:14 AM confirms active human occupancy in an officially 'vacant' apartment.",
                },
                {
                    "trace_id": "MOB-UBER-DEL-9918",
                    "type": "UBER_TRIP_TELEMETRY",
                    "source": "Uber India Lawful Intercept Telemetry",
                    "timestamp": "2026-10-28T22:30:00Z",
                    "confidence": 97.8,
                    "payload": {
                        "trip_id": "UBER-DEL-991823",
                        "driver_name": "Ramesh Kumar (Rating: 4.88)",
                        "vehicle_plate": "DL 1ZB 4412 (White Maruti Swift Dzire Tour)",
                        "pickup_location": "Karol Bagh Central Market, New Delhi (28.6517°N, 77.1906°E)",
                        "dropoff_location": "Sector 62 Metro Gate 2 / Green View Apts (28.6280°N, 77.3649°E)",
                        "distance_km": 24.8,
                        "duration_minutes": 42.5,
                        "fare_amount": "₹485.50",
                        "payment_instrument": f"UPI VPA: {self.upi_id}",
                        "route_waypoints_count": 86,
                    },
                    "forensic_finding": "Getaway trip booked from Karol Bagh directly to Sector 62 safehouse, paid via suspect's persistent UPI VPA rajan.bhai@okhdfcbank.",
                },
            ],
        }

    def get_social_cloud_traces(self) -> Dict[str, Any]:
        """Category 3: Social Media EXIF, Cloud Backups & Content Streaming."""
        return {
            "category_name": "Social Media, Cloud & Digital Footprints",
            "provider_count": 3,
            "status": "CORRELATED",
            "traces": [
                {
                    "trace_id": "SOC-META-EXIF-4412",
                    "type": "INSTAGRAM_EXIF_GEOTAG",
                    "source": "Meta Lawful Production (Section 91 CrPC / BSA Section 63)",
                    "timestamp": "2026-10-29T04:22:10Z",
                    "confidence": 98.2,
                    "payload": {
                        "story_id": "STORY-IG-998214-DELETED",
                        "account_handle": "@rajan_the_untouchable (Status: DELETED AFTER 12 MINS)",
                        "caption": "Nobody can find us here... peace 🥂",
                        "exif_metadata_retained": {
                            "camera_make": "Apple",
                            "camera_model": "iPhone 15 Pro",
                            "gps_latitude": 28.6279,
                            "gps_longitude": 77.3648,
                            "gps_altitude_m": 192.4,
                            "shutter_speed": "1/60s",
                            "software": "iOS 18.1",
                        },
                    },
                    "forensic_finding": "Although suspect deleted the Instagram story, Meta server retained unstripped camera EXIF coordinates matching Flat 402 balcony.",
                },
                {
                    "trace_id": "CLOUD-GDRIVE-SYNC-991",
                    "type": "GOOGLE_DRIVE_BACKUP_LOG",
                    "source": "Google LLC Lawful Intercept Compliance Notice",
                    "timestamp": "2026-10-29T05:10:14Z",
                    "confidence": 94.6,
                    "payload": {
                        "account": "rajan.archive.backup@gmail.com",
                        "event_type": "AUTOMATIC_CLOUD_SYNC_SUCCESS",
                        "filename": "Syndicate_Vault_Ledger_2026_Encrypted.kdbx",
                        "filesize_bytes": 14920800,
                        "client_ip": "122.161.44.89 (ACT Fibernet Noida)",
                        "isp_asn": "AS132944 ACT Digital Communications",
                    },
                    "forensic_finding": "KeePass password vault synced from residential IP 122.161.44.89, providing cryptographic link to Rajan's primary Google account.",
                },
                {
                    "trace_id": "MEDIA-YT-HISTORY-3310",
                    "type": "YOUTUBE_WATCH_HISTORY",
                    "source": "Google Account Activity Telemetry",
                    "timestamp": "2026-10-29T01:40:00Z",
                    "confidence": 89.4,
                    "payload": {
                        "video_id": "yt_v_492190",
                        "video_title": "How to clone a FASTag and spoof RFID toll barriers in 5 minutes",
                        "watched_duration_seconds": 764,
                        "ip_address": "122.161.44.89",
                        "device_user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15",
                    },
                    "forensic_finding": "Suspect researched FASTag toll cloning methods 90 minutes before Scorpio attempted Yamuna Expressway crossing.",
                },
            ],
        }

    def get_iot_smart_home_traces(self) -> Dict[str, Any]:
        """Category 4: IoT, Smart Meter Grid & Wearables Telemetry."""
        return {
            "category_name": "IoT, Smart Power Grid & Ambient Sensors",
            "provider_count": 3,
            "status": "CORRELATED",
            "traces": [
                {
                    "trace_id": "IOT-GRID-METER-9811",
                    "type": "SMART_ELECTRICITY_METER_SPIKE",
                    "source": "UPPCL Smart Meter Telemetry (PVVNL Noida Grid Substation)",
                    "timestamp": "2026-10-29T02:00:00Z",
                    "confidence": 99.1,
                    "payload": {
                        "meter_serial": "SM-NOIDA-PVVNL-981102",
                        "service_connection": "CON-PVVNL-62-402",
                        "premises": self.safehouse_address,
                        "historical_daily_avg_kwh": 0.38,
                        "current_consumption_kwh": 4.82,
                        "percentage_spike": 420.5,
                        "appliance_signature": "Inverter Air Conditioner (1.5 Ton) + Heavy Induction Load",
                        "official_registry_status": "VACANT / UNINHABITED (180 Days)",
                    },
                    "forensic_finding": "Power consumption in 'vacant' apartment skyrocketed by 420% at 2:00 AM, proving hidden physical occupancy.",
                },
                {
                    "trace_id": "IOT-ALEXA-VOICE-1120",
                    "type": "ALEXA_VOICE_COMMAND_LOG",
                    "source": "Amazon Alexa Cloud API (Lawful Intercept)",
                    "timestamp": "2026-10-29T02:45:18Z",
                    "confidence": 93.5,
                    "payload": {
                        "device_id": "ECHO-DOT-GEN5-NOIDA-62",
                        "utterance_transcript": "Alexa, turn off all the lights and lock the front door",
                        "acoustic_voiceprint_match": "Rajan Verma (Biometric Voiceprint Match: 96.2%)",
                        "audio_mode": "Whisper Mode (Low amplitude)",
                    },
                    "forensic_finding": "Biometric voiceprint on Echo Dot matched Rajan Verma's voice sample with 96.2% forensic acoustic similarity.",
                },
                {
                    "trace_id": "IOT-FITNESS-PULSE-4481",
                    "type": "WEARABLE_HEART_RATE_SPIKE",
                    "source": "Fitbit / Garmin Health Cloud Telemetry",
                    "timestamp": "2026-10-29T03:12:00Z",
                    "confidence": 91.8,
                    "payload": {
                        "device_name": "Fitbit Charge 6 (Paired to iPhone 15 Pro)",
                        "metric": "HEART_RATE_BPM",
                        "resting_baseline_bpm": 68,
                        "recorded_spike_bpm": 142,
                        "correlation_event": "UP Police PCR Van Alpha-04 drove past Sector 62 road with sirens active at 03:11 AM.",
                    },
                    "forensic_finding": "Subject experienced acute tachycardia (142 BPM) at exact second police patrol vehicle sounded sirens outside safehouse.",
                },
            ],
        }

    def get_financial_alternative_traces(self) -> Dict[str, Any]:
        """Category 5: Alternative Financial, Crypto & Credit Inquiries."""
        return {
            "category_name": "Alternative Finance, Crypto Off-Ramp & Credit Bureaus",
            "provider_count": 3,
            "status": "CORRELATED",
            "traces": [
                {
                    "trace_id": "FIN-CRYPTO-P2P-8812",
                    "type": "BINANCE_P2P_CRYPTO_OFFRAMP",
                    "source": "Financial Intelligence Unit (FIU-IND) / Binance Compliance",
                    "timestamp": "2026-10-29T07:15:00Z",
                    "confidence": 98.4,
                    "payload": {
                        "trade_id": "BIN-P2P-88219018",
                        "crypto_asset": "USDT (Tether)",
                        "crypto_amount": "5,180.00 USDT",
                        "fiat_amount_inr": "₹4,50,000.00",
                        "counterparty": "P2P_Trader_NCR_Reliable",
                        "settlement_rail": f"IMPS via {self.upi_id}",
                        "dest_crypto_wallet": "0x71C...B29 (Trc20 Cold Storage)",
                        "status": "FROZEN_PENDING_SECTION_106_BNSS",
                    },
                    "forensic_finding": "Attempt to off-ramp ₹4.5 Lakhs cash into USDT intercepted; funds frozen under Section 106 Bharatiya Nagarik Suraksha Sanhita.",
                },
                {
                    "trace_id": "FIN-GIFTCARD-AMZ-2291",
                    "type": "AMAZON_GIFT_CARD_LAUNDERING",
                    "source": "Qwikcilver / Amazon Pay Anti-Fraud Telemetry",
                    "timestamp": "2026-10-28T19:20:00Z",
                    "confidence": 92.1,
                    "payload": {
                        "voucher_id": "AQ-9981-2290-7712",
                        "voucher_value": "₹50,000.00",
                        "payment_card": "Stolen HDFC Corporate Credit Card (BIN: 4102-XXXX-XXXX-4102)",
                        "redeeming_account": "rajan.bhai@okhdfcbank",
                        "ip_geolocation": "Sector 62, Noida",
                    },
                    "forensic_finding": "Stolen corporate credit card converted to e-gift vouchers, redeemed directly by suspect's verified Amazon handle.",
                },
                {
                    "trace_id": "FIN-CIBIL-INQUIRY-9011",
                    "type": "CIBIL_HARD_CREDIT_PULL",
                    "source": "TransUnion CIBIL Real-Time Fraud Alert",
                    "timestamp": "2026-10-29T06:40:00Z",
                    "confidence": 95.8,
                    "payload": {
                        "inquiry_id": "CIBIL-2026-HQ-1029",
                        "financial_institution": "Bajaj Finance Instant Personal Loan App",
                        "applicant_pan": "ABCDE1234F (Rajan Verma)",
                        "requested_loan": "₹2,00,000 Emergency Cash",
                        "request_origin_ip": "122.161.44.89",
                        "device_fingerprint": "Canvas-FP-88129-iOS18",
                    },
                    "forensic_finding": "Emergency digital loan application submitted from safehouse IP using suspect's legitimate PAN number.",
                },
            ],
        }

    def generate_fused_dossier(self, suspect_id: str = "rajan") -> Dict[str, Any]:
        """
        Fuses all 5 categories into a court-admissible, single-pane warrant dossier.
        """
        t1 = self.get_telecom_isp_traces()
        t2 = self.get_ecommerce_logistics_traces()
        t3 = self.get_social_cloud_traces()
        t4 = self.get_iot_smart_home_traces()
        t5 = self.get_financial_alternative_traces()

        all_categories = [t1, t2, t3, t4, t5]
        total_traces_count = sum(len(c["traces"]) for c in all_categories)

        # High-precision route from Karol Bagh to Sector 62
        uber_route_coords = [
            [77.1906, 28.6517],  # Karol Bagh Central
            [77.2050, 28.6480],
            [77.2197, 28.6328],  # Connaught Place Inner Circle
            [77.2410, 28.6250],  # Pragati Maidan
            [77.2750, 28.6080],  # Akshardham / NH-24
            [77.3020, 28.6015],  # Mayur Vihar Toll
            [77.3265, 28.5710],  # Noida Entry
            [77.3450, 28.6050],  # Sector 59 Road
            [77.3649, 28.6280],  # Sector 62 Green View Apts Safehouse
        ]

        # Generate cryptographic SHA-256 digital certificate for Section 63 BSA warrant
        raw_token = f"{suspect_id}:{self.imei}:{self.safehouse_lat}:{self.safehouse_lon}:{time.time()}"
        warrant_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

        return {
            "status": "success",
            "suspect_id": suspect_id,
            "suspect_name": self.target_name,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "confidence_score": 98.4,
            "fused_location": "Sector 62, Noida (Flat 402, Block C, Green View Apartments)",
            "fused_coordinates": {
                "latitude": self.safehouse_lat,
                "longitude": self.safehouse_lon,
                "accuracy_radius_meters": 8.5,
            },
            "summary_verdict": "OMNI-TRACE COMPLETE. Matched 4 IoT devices, 3 Telecom tower handovers, 2 delivery logs, and 1 Uber trip at this location. Target pinned within 8.5 meters.",
            "spatial_markers": {
                "safehouse": {
                    "latitude": self.safehouse_lat,
                    "longitude": self.safehouse_lon,
                    "label": "Safehouse: Flat 402, Green View Apartments",
                    "pin_type": "PRIMARY_TARGET",
                },
                "zomato_delivery": {
                    "latitude": 28.6288,
                    "longitude": 77.3655,
                    "label": "Zomato Midnight Biryani Delivery (02:14 AM)",
                    "pin_type": "FOOD_DELIVERY",
                },
                "amazon_drop": {
                    "latitude": 28.6280,
                    "longitude": 77.3649,
                    "label": "Amazon Burner Phone Package Drop (11:20 AM)",
                    "pin_type": "E_COMMERCE",
                },
                "wifi_probe_radius": {
                    "latitude": self.safehouse_lat,
                    "longitude": self.safehouse_lon,
                    "radius_meters": 35.0,
                    "label": "WiFi Probe Geofence: SSID 'Home_WiFi'",
                    "pin_type": "RF_RADIUS",
                },
                "smart_meter_anomaly": {
                    "latitude": self.safehouse_lat,
                    "longitude": self.safehouse_lon,
                    "spike_percentage": 420.5,
                    "label": "Smart Meter SM-9811 (+420% Power Surge)",
                    "pin_type": "GRID_SURGE",
                },
                "uber_route": {
                    "origin": "Karol Bagh Central, New Delhi",
                    "destination": "Sector 62, Noida",
                    "coordinates": uber_route_coords,
                    "vehicle": "DL 1ZB 4412 (Maruti Dzire)",
                    "fare": "₹485.50 via rajan.bhai@okhdfcbank",
                },
            },
            "total_traces_count": total_traces_count,
            "categories": {
                "telecom_isp": t1,
                "ecommerce_logistics": t2,
                "social_cloud": t3,
                "iot_smart_home": t4,
                "financial_alternative": t5,
            },
            "section_63_bsa_warrant": {
                "warrant_number": f"NBW-BSA-2026-{suspect_id.upper()}-9812",
                "issuing_court": "Court of Chief Judicial Magistrate, Gautam Buddha Nagar (Noida)",
                "governing_statute": "Section 35 & 106 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
                "digital_certificate_section": "Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023",
                "certifying_authority": "Cyber & Telecom Forensics Cell, Special Operations Group",
                "sha256_hash": warrant_hash,
                "custody_remand_clock_hours": 24,
                "authorized_officer": "Inspector Rajesh Varma (Cyber Crime Police Station)",
                "recommended_action": "Execute immediate tactical entry at Flat 402, Sector 62. Deploy 2 perimeter intercept vehicles to seal gate 1 and gate 2.",
            },
        }


_exhaust_simulator_instance = None


def get_digital_exhaust_simulator() -> DigitalExhaustSimulator:
    """Singleton getter for the Digital Exhaust Simulator."""
    global _exhaust_simulator_instance
    if _exhaust_simulator_instance is None:
        _exhaust_simulator_instance = DigitalExhaustSimulator()
    return _exhaust_simulator_instance
