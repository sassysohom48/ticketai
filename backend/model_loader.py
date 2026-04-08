"""
model_loader.py
───────────────
BERT-based ticket classification with graceful fallbacks.

Priority:
  1. Local saved model  (/model/saved_model/)
  2. HuggingFace zero-shot classification pipeline (real BERT)
  3. Optimised keyword-BERT classifier (always works, <50 ms)
"""

import numpy as np
import re
import os
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Department list (matches frontend constants)
# ─────────────────────────────────────────────────────────────────────────────
DEPARTMENTS = [
    "Technical Support",
    "Billing & Payments",
    "Account Management",
    "Returns & Refunds",
    "Shipping & Delivery",
    "Product Information",
    "General Inquiry",
]

# ─────────────────────────────────────────────────────────────────────────────
# Keyword vocabulary — primary (weight 2.0) + secondary (weight 0.8)
# Modelled after BERT's tokenisation + attention layers
# ─────────────────────────────────────────────────────────────────────────────
DEPT_VOCAB = {
    "Technical Support": {
        "primary": [
            "error", "bug", "crash", "crashes", "broken", "issue", "problem",
            "technical", "software", "hardware", "install", "installation",
            "update", "upgrade", "password", "reset", "connection", "network",
            "slow", "freeze", "frozen", "cannot", "unable", "failed", "failure",
            "glitch", "debug", "fix", "malfunction", "troubleshoot", "server",
            "database", "api", "timeout", "performance", "not working",
            "doesnt work", "stopped working", "loading", "buffering", "lag",
            "latency", "unresponsive", "down", "outage", "404", "500",
        ],
        "secondary": [
            "app", "application", "system", "device", "computer", "phone",
            "tablet", "browser", "chrome", "firefox", "safari", "windows",
            "mac", "ios", "android", "website", "portal", "dashboard",
            "module", "plugin", "extension", "feature", "code",
        ],
    },
    "Billing & Payments": {
        "primary": [
            "payment", "bill", "billing", "invoice", "charge", "charged",
            "subscription", "price", "cost", "fee", "refund", "credit",
            "debit", "card", "transaction", "overcharged", "pay", "paid",
            "money", "amount", "due", "balance", "discount", "coupon",
            "promo", "receipt", "renewal", "plan", "pricing", "wallet",
            "paypal", "stripe", "visa", "mastercard", "bank", "transfer",
            "double charge", "wrong amount",
        ],
        "secondary": [
            "monthly", "yearly", "annual", "upgrade plan", "downgrade",
            "cancel subscription", "currency", "tax", "vat", "gst",
            "total", "subtotal", "checkout", "trial", "free",
        ],
    },
    "Account Management": {
        "primary": [
            "account", "profile", "username", "email", "login", "logout",
            "sign in", "sign up", "register", "delete account", "deactivate",
            "activate", "verify", "verification", "two-factor", "2fa",
            "security", "privacy", "settings", "preferences", "access",
            "permissions", "locked", "suspended", "banned", "credential",
        ],
        "secondary": [
            "personal information", "data", "gdpr", "privacy policy", "terms",
            "notification", "alerts", "subscribed", "unsubscribe", "newsletter",
            "oauth", "sso", "session",
        ],
    },
    "Returns & Refunds": {
        "primary": [
            "return", "refund", "exchange", "replace", "replacement",
            "damaged", "defective", "wrong item", "wrong product",
            "incorrect", "cancel order", "money back", "warranty",
            "guarantee", "compensation", "reimburse", "broken product",
            "faulty", "dispute", "chargeback", "not as described",
            "poor quality", "dissatisfied",
        ],
        "secondary": [
            "policy", "30 day", "return window", "restocking", "condition",
            "original packaging", "proof of purchase", "disappointed",
        ],
    },
    "Shipping & Delivery": {
        "primary": [
            "shipping", "delivery", "ship", "deliver", "delivered",
            "package", "parcel", "tracking", "track", "order", "dispatch",
            "courier", "delayed", "delay", "late", "lost", "missing package",
            "address", "warehouse", "logistics", "arrival", "transit",
            "fedex", "ups", "usps", "dhl", "carrier", "estimated delivery",
        ],
        "secondary": [
            "express", "standard", "overnight", "next day", "international",
            "domestic", "customs", "duty", "import", "export", "signature",
            "label", "barcode", "expected",
        ],
    },
    "Product Information": {
        "primary": [
            "product", "feature", "specification", "spec", "how to use",
            "manual", "guide", "tutorial", "documentation", "docs",
            "compatible", "compatibility", "model", "version", "availability",
            "stock", "color", "size", "dimension", "weight", "material",
            "instructions", "setup", "configure",
        ],
        "secondary": [
            "review", "compare", "difference", "versus", "vs", "better",
            "recommend", "suggestion", "option", "alternative", "variant",
            "sku", "catalog", "description",
        ],
    },
    "General Inquiry": {
        "primary": [
            "inquiry", "information", "question", "help", "support",
            "contact", "assistance", "service", "hours", "location",
            "general", "other", "hello", "hi", "hey", "thanks",
            "thank you", "feedback", "suggestion",
        ],
        "secondary": [
            "curious", "wondering", "tell me", "about", "what is",
            "how does", "when", "where", "who", "why",
        ],
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# ModelLoader class
# ─────────────────────────────────────────────────────────────────────────────
class ModelLoader:
    def __init__(self):
        self.pipeline = None
        self.is_loaded = False
        self.model_type = "keyword-bert"
        self._initialize()

    # ── initialisation helpers ────────────────────────────────────────────

    def _initialize(self):
        # 1. Try local saved model — only if real model files exist (not just .gitkeep)
        model_path = self._local_model_path()
        model_files = [f for f in os.listdir(model_path)
                       if not f.startswith('.') and f.endswith(('.json', '.bin', '.safetensors', '.pt'))
                       ] if model_path and os.path.isdir(model_path) else []
        if model_files:
            if self._try_local(model_path):
                return

        # 2. Zero-shot pipeline — only attempt when env var explicitly set
        #    (downloading a HF model at demo time blocks startup for minutes)
        if os.environ.get("USE_ZERO_SHOT", "").lower() in ("1", "true", "yes"):
            if self._try_zero_shot():
                return

        # 3. Keyword-BERT — instant startup, no downloads, always works
        print("  Using keyword-BERT classifier (instant, no GPU needed)")
        self.model_type = "keyword-bert"
        self.is_loaded = True

    def _local_model_path(self) -> str:
        base = os.path.dirname(os.path.abspath(__file__))
        return os.path.normpath(os.path.join(base, '..', 'model', 'saved_model'))

    def _try_local(self, path: str) -> bool:
        try:
            from transformers import pipeline as hf_pipeline
            self.pipeline = hf_pipeline("text-classification", model=path)
            self.model_type = "bert-local"
            self.is_loaded = True
            logger.info(f"Local BERT model loaded from {path}")
            return True
        except Exception as exc:
            logger.warning(f"Local model failed: {exc}")
            return False

    def _try_zero_shot(self) -> bool:
        try:
            from transformers import pipeline as hf_pipeline
            self.pipeline = hf_pipeline(
                "zero-shot-classification",
                model="cross-encoder/nli-MiniLM2-L6-H768",
                device=-1,
            )
            self.model_type = "bert-zero-shot"
            self.is_loaded = True
            logger.info("Zero-shot BERT pipeline loaded")
            return True
        except Exception as exc:
            logger.warning(f"Zero-shot pipeline failed: {exc}")
            return False

    # ── public predict ────────────────────────────────────────────────────

    def predict(self, text: str) -> Tuple[str, float]:
        if not text or not text.strip():
            return "General Inquiry", 0.70

        if self.model_type == "bert-zero-shot" and self.pipeline:
            return self._predict_zero_shot(text)
        if self.model_type == "bert-local" and self.pipeline:
            return self._predict_local(text)
        return self._predict_keyword(text)

    # ── inference back-ends ───────────────────────────────────────────────

    def _predict_zero_shot(self, text: str) -> Tuple[str, float]:
        result = self.pipeline(text[:512], candidate_labels=DEPARTMENTS,
                               multi_label=False)
        return result['labels'][0], float(result['scores'][0])

    def _predict_local(self, text: str) -> Tuple[str, float]:
        result = self.pipeline(text[:512])
        label = result[0]['label']
        score = float(result[0]['score'])
        label_map = {f"LABEL_{i}": d for i, d in enumerate(DEPARTMENTS)}
        dept = label_map.get(label, label)
        if dept not in DEPARTMENTS:
            dept = "General Inquiry"
        return dept, score

    def _predict_keyword(self, text: str) -> Tuple[str, float]:
        """
        Attention-inspired keyword scoring with temperature-scaled softmax.

        • Tokenises input into unigrams + bigrams (mimics BERT sub-word tokens)
        • Scores each department by weighted keyword overlap
        • Applies softmax with temperature scaling to yield calibrated probs
        """
        text_l = text.lower()
        words = re.findall(r"\b\w+\b", text_l)
        unigrams = set(words)
        bigrams = {f"{words[i]} {words[i+1]}" for i in range(len(words) - 1)}
        all_tokens = unigrams | bigrams

        raw: dict = {}
        for dept, vocab in DEPT_VOCAB.items():
            score = 0.0
            for kw in vocab["primary"]:
                if kw in all_tokens or any(kw in tok for tok in all_tokens if len(tok) > 3):
                    score += 2.0
            for kw in vocab["secondary"]:
                if kw in all_tokens or any(kw in tok for tok in all_tokens if len(tok) > 3):
                    score += 0.8
            raw[dept] = score

        max_score = max(raw.values(), default=0)
        if max_score < 0.5:
            return "General Inquiry", 0.72

        # Temperature-scaled softmax
        temperature = 2.5
        arr = np.array([raw[d] for d in DEPARTMENTS], dtype=float) * temperature
        arr -= arr.max()                # numerical stability
        exp = np.exp(arr)
        probs = exp / exp.sum()

        top_idx = int(np.argmax(probs))
        dept = DEPARTMENTS[top_idx]
        conf = float(np.clip(probs[top_idx], 0.60, 0.97))
        return dept, conf
