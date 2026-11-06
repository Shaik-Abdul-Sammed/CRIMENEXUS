"""
Synthetic Indian Police FIR Training Data Generator.
Generates 500 diverse, highly realistic FIR sentences and paragraphs annotated with:
- SUSPECT: Accused individuals, aliases, gang syndicate operatives
- VICTIM: Reporting victims, complainants
- VEHICLE: Motor registration numbers (HSRP standard e.g. DL 01 AB 1234, TS 09 AB 1234)
- PHONE: Indian telephone numbers (+91 98..., +91 97...)
- LEGAL_SECTION: Statutory penal sections (e.g. Section 111 BNS, Sec 308 BNS, Section 420 IPC, Sec 63 BSA)
- LOCATION: Specific police stations, thanas, districts, toll plazas
"""

import json
import random
import os
from typing import List, Dict, Any, Tuple

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "ml_service", "models", "fir_training_data.json")

FIRST_NAMES = [
    "Vikram", "Rajan", "Suresh", "Ramesh", "Deepak", "Anil", "Sunil", "Rajesh",
    "Mukesh", "Pooja", "Amit", "Rahul", "Dinesh", "Kavita", "Praveen", "Ashok",
    "Manoj", "Arun", "Sanjay", "Vijay", "Kamal", "Harish", "Rohit", "Suraj",
    "Mohan", "Gaurav", "Naveen", "Satish", "Sumit", "Ajay", "Devendra", "Sachin"
]

LAST_NAMES = [
    "Malhotra", "Sharma", "Verma", "Kumar", "Singh", "Yadav", "Gupta", "Joshi",
    "Patel", "Reddy", "Mehta", "Aggarwal", "Chopra", "Bansal", "Rathore", "Chauhan",
    "Tiwari", "Pandey", "Mishra", "Saxena", "Bhatia", "Goyal", "Nair", "Iyer"
]

ALIASES = [
    "@ Vicky", "@ Rajan Bhai", "@ Chhota Don", "@ Golden", "@ Shooter",
    "@ Pandit", "@ Angadia", "@ Tiger", "@ Khalifa", "@ Seth", "@ Lala"
]

VICTIM_NAMES = [
    "Smt. Sunita Rao", "Dr. Arvind Swaminathan", "Shri Mahesh Narayanan",
    "Ananya Deshmukh", "Prakash Kulkarni", "Mohd. Tariq Siddiqui", "Harpreet Kaur",
    "Ritu Singhania", "Venkatesh Prasad", "Subhash Chandra Bose", "Gita Devi"
]

RTO_CODES = ["DL", "TS", "UP", "HR", "MH", "KA", "TN", "RJ", "MP", "GJ"]

LEGAL_SECTIONS = [
    "Section 111 BNS", "Section 308 BNS", "Section 318 BNS", "Section 61 BNS",
    "Section 103 BNS", "Section 115 BNS", "Section 303 BNS", "Section 316 BNS",
    "Section 351 BNS", "Section 35(3) BNSS", "Section 187 BNSS", "Section 193(3) BNSS",
    "Section 106 BNSS", "Section 63 BSA", "Section 65B IEA", "Section 420 IPC",
    "Section 120B IPC", "Section 302 IPC", "Section 307 IPC", "Section 384 IPC",
    "Section 392 IPC", "Section 406 IPC", "Section 409 IPC", "Section 467 IPC",
    "Section 468 IPC", "Section 471 IPC", "Section 506 IPC", "Section 66D IT Act",
    "Section 3 PMLA", "Section 4 PMLA", "Section 25 Arms Act", "Section 27 Arms Act",
    "Section 20 NDPS Act", "Section 21 NDPS Act", "Section 8c NDPS Act"
]

LOCATIONS = [
    "Noida Sector 20 Police Station", "Connaught Place Police Station",
    "Yamuna Expressway KM 48 Checkpoint", "Cyber Crime PS Gurugram",
    "Karol Bagh Police Station", "Parliament Street PS", "Mayur Vihar Phase 1",
    "Chilla Border Toll Plaza", "Hauz Khas Police Station", "Indirapuram PS Ghaziabad",
    "BKC Cyber Cell Mumbai", "Sector 62 Cyber Corridor Noida", "Electronic City PS Bengaluru",
    "Dhaula Kuan Checkpoint", "Sarita Vihar Police Station", "Jewar Toll Plaza"
]

def generate_phone() -> str:
    series = random.choice(["98", "99", "97", "96", "91", "88", "87", "70", "79"])
    rest = "".join(str(random.randint(0, 9)) for _ in range(8))
    return f"+91 {series}{rest[:4]} {rest[4:]}"

def generate_vehicle() -> str:
    state = random.choice(RTO_CODES)
    dist = f"{random.randint(1, 99):02d}"
    series = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ", k=2))
    num = f"{random.randint(1000, 9999)}"
    return f"{state} {dist} {series} {num}"

def generate_person_name(include_alias: bool = False) -> str:
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    if include_alias and random.random() < 0.35:
        name = f"{name} {random.choice(ALIASES)}"
    return name

def build_annotated_sentence() -> Tuple[str, List[Tuple[int, int, str]]]:
    """Generates a realistic FIR deposition sentence with exact character span annotations."""
    template_type = random.randint(1, 6)
    suspect = generate_person_name(include_alias=True)
    victim = random.choice(VICTIM_NAMES)
    vehicle = generate_vehicle()
    phone = generate_phone()
    sections = random.sample(LEGAL_SECTIONS, k=random.randint(1, 2))
    section_str = " and ".join(sections)
    location = random.choice(LOCATIONS)

    entities = []

    if template_type == 1:
        # Suspect intercepted in vehicle with weapon/contraband
        text = f"Accused {suspect} was intercepted driving vehicle {vehicle} near {location} while carrying extorted cash, registered under {section_str}."
    elif template_type == 2:
        # Threat call / cyber fraud against victim
        text = f"Complainant {victim} lodged formal FIR reporting that suspect {suspect} contacted from phone {phone} demanding extortion money, registered under {section_str} at {location}."
    elif template_type == 3:
        # Hawala smurfing / financial layering
        sec = sections[0]
        text = f"During investigation at {location}, financial intelligence revealed that suspect {suspect} routed illicit smurfing deposits using phone {phone} in violation of {sec}."
    elif template_type == 4:
        # ANPR highway getaway
        text = f"High-speed getaway car {vehicle} linked to wanted fugitive {suspect} was flagged at {location} ANPR toll camera, invoking {section_str}."
    elif template_type == 5:
        # Multi-suspect / crime syndicate charge
        sec = sections[0]
        text = f"Station Diary entry at {location} confirms that accused {suspect} extorted victim {victim} using mobile number {phone}, attracting charges under {sec}."
    else:
        # Vehicle theft / stolen registration
        text = f"A stolen vehicle {vehicle} was recovered from suspect {suspect} near {location} pursuant to investigation under {section_str}."

    # Compute exact non-overlapping spans
    to_find = [
        (suspect, "SUSPECT"),
        (victim, "VICTIM"),
        (vehicle, "VEHICLE"),
        (phone, "PHONE"),
        (location, "LOCATION")
    ]
    for s in sections:
        to_find.append((s, "LEGAL_SECTION"))

    for substr, label in to_find:
        start = 0
        while True:
            idx = text.find(substr, start)
            if idx == -1:
                break
            end = idx + len(substr)
            # Check overlap
            overlap = any(not (end <= s or idx >= e) for s, e, _ in entities)
            if not overlap:
                entities.append((idx, end, label))
            start = end

    entities.sort(key=lambda x: x[0])
    return text, entities

def main():
    print(f"[*] Generating 500 synthetic Indian police FIR training records...")
    random.seed(42)
    dataset = []

    for i in range(500):
        text, ents = build_annotated_sentence()
        dataset.append({
            "id": f"fir-sample-{i+1:04d}",
            "text": text,
            "entities": [{"start": s, "end": e, "label": lbl} for s, e, lbl in ents]
        })

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    print(f"[+] Successfully generated {len(dataset)} annotated FIR sentences.")
    print(f"[+] Saved to: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
