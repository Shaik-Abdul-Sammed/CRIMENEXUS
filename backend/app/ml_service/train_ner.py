"""
SpaCy Named Entity Recognition (NER) Training Pipeline for Indian Police FIRs.
Builds a domain-specific model using spacy.blank("en"), an EntityRuler containing top 50
penal sections (BNS, BNSS, BSA, IPC, IT Act, NDPS, PMLA), tok2vec and ner components.
Trains over 30 epochs and saves to backend/app/ml_service/models/fir_ner_model.
"""

import os
import sys
import json
import random
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_ner")

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "fir_ner_model")
DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "fir_training_data.json")

# Top 50 Most Common Indian Penal, Procedural & Special Act Sections
TOP_50_LEGAL_SECTIONS = [
    # BNS 2023 (Bharatiya Nyaya Sanhita)
    {"label": "LEGAL_SECTION", "pattern": "Section 111 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Sec 111 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 308 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Sec 308 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 318 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Sec 318 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 61 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 103 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 115 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 303 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 316 BNS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 351 BNS"},
    # BNSS 2023 (Bharatiya Nagarik Suraksha Sanhita)
    {"label": "LEGAL_SECTION", "pattern": "Section 35(3) BNSS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 35 BNSS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 187 BNSS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 193(3) BNSS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 193 BNSS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 106 BNSS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 105 BNSS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 53 BNSS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 84 BNSS"},
    {"label": "LEGAL_SECTION", "pattern": "Section 192 BNSS"},
    # BSA 2023 (Bharatiya Sakshya Adhiniyam)
    {"label": "LEGAL_SECTION", "pattern": "Section 63 BSA"},
    {"label": "LEGAL_SECTION", "pattern": "Sec 63 BSA"},
    {"label": "LEGAL_SECTION", "pattern": "Section 65B IEA"},
    # Legacy IPC (Indian Penal Code)
    {"label": "LEGAL_SECTION", "pattern": "Section 420 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Sec 420 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 120B IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Sec 120B IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 302 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 307 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 384 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 392 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 406 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 409 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 467 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 468 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 471 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 506 IPC"},
    {"label": "LEGAL_SECTION", "pattern": "Section 34 IPC"},
    # Special Statutes (IT Act, PMLA, NDPS, Arms Act)
    {"label": "LEGAL_SECTION", "pattern": "Section 66D IT Act"},
    {"label": "LEGAL_SECTION", "pattern": "Section 66C IT Act"},
    {"label": "LEGAL_SECTION", "pattern": "Section 3 PMLA"},
    {"label": "LEGAL_SECTION", "pattern": "Section 4 PMLA"},
    {"label": "LEGAL_SECTION", "pattern": "Section 25 Arms Act"},
    {"label": "LEGAL_SECTION", "pattern": "Section 27 Arms Act"},
    {"label": "LEGAL_SECTION", "pattern": "Section 20 NDPS Act"},
    {"label": "LEGAL_SECTION", "pattern": "Section 21 NDPS Act"},
    {"label": "LEGAL_SECTION", "pattern": "Section 8c NDPS Act"},
    {"label": "LEGAL_SECTION", "pattern": "Section 74 JJ Act"}
]


def train_spacy_ner(training_data_path: str, output_dir: str, epochs: int = 30):
    try:
        import spacy
        from spacy.training.example import Example
    except ImportError:
        logger.warning("spaCy is not installed in the current environment.")
        logger.info("Writing self-contained fallback manifest so nlp_extractor works cleanly.")
        os.makedirs(output_dir, exist_ok=True)
        manifest = {
            "model_name": "fir_ner_model",
            "epochs": epochs,
            "patterns": TOP_50_LEGAL_SECTIONS,
            "spacy_installed": False
        }
        with open(os.path.join(output_dir, "meta.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)
        return

    logger.info("Initializing blank English spaCy model (spacy.blank('en'))...")
    nlp = spacy.blank("en")

    # 1. Add EntityRuler for statutory legal sections
    ruler = nlp.add_pipe("entity_ruler", before=None)
    ruler.add_patterns(TOP_50_LEGAL_SECTIONS)
    logger.info("Added EntityRuler with %d top legal section patterns.", len(TOP_50_LEGAL_SECTIONS))

    # 2. Add Tok2Vec and NER pipeline components
    if "tok2vec" not in nlp.pipe_names:
        nlp.add_pipe("tok2vec")
    if "ner" not in nlp.pipe_names:
        ner = nlp.add_pipe("ner")
    else:
        ner = nlp.get_pipe("ner")

    # Load Training Data
    with open(training_data_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    labels = ["SUSPECT", "VICTIM", "VEHICLE", "PHONE", "LOCATION", "LEGAL_SECTION"]
    for lbl in labels:
        ner.add_label(lbl)

    # Convert to spaCy Examples
    examples = []
    for item in raw_data:
        text = item["text"]
        entities = [(e["start"], e["end"], e["label"]) for e in item["entities"]]
        doc = nlp.make_doc(text)
        example = Example.from_dict(doc, {"entities": entities})
        examples.append(example)

    logger.info("Loaded %d training examples. Beginning training for %d epochs...", len(examples), epochs)

    # Initialize optimizer
    optimizer = nlp.initialize(get_examples=lambda: examples)

    # Training loop
    other_pipes = [p for p in nlp.pipe_names if p not in ["ner", "tok2vec"]]
    with nlp.disable_pipes(*other_pipes):
        for epoch in range(epochs):
            random.shuffle(examples)
            losses = {}
            for example in examples:
                nlp.update([example], drop=0.25, sgd=optimizer, losses=losses)
            if (epoch + 1) % 5 == 0 or epoch == epochs - 1:
                logger.info("Epoch %02d/%02d - Losses: %s", epoch + 1, epochs, losses)

    os.makedirs(output_dir, exist_ok=True)
    nlp.to_disk(output_dir)
    logger.info("Model saved successfully to %s", output_dir)


if __name__ == "__main__":
    epochs = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    train_spacy_ner(DATA_PATH, MODEL_DIR, epochs=epochs)
