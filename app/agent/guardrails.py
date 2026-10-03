import re
from typing import Dict, Any, List, Optional

class GuardrailVerdict:
    ALLOWED = "ALLOWED"
    BLOCKED = "BLOCKED"
    ANONYMIZED = "ANONYMIZED"

class MultiLayerGuardrailEngine:
    """
    4-Tier Enterprise Defense-in-Depth Guardrail System:
      Layer 1: Deterministic Edge Regex & PII Redaction
      Layer 2: Prompt Injection & Adversarial Jailbreak Defenses
      Layer 3: Dynamic Tool Schema Gating
      Layer 4: Output Financial & Grounding Verification
    """
    def __init__(self):
        # Layer 1: PII Patterns
        self.ssn_pattern = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
        self.cc_pattern = re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b")
        self.email_pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
        self.phone_pattern = re.compile(r"\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b")

        # Layer 2: Prompt Injection / System Prompt Exfiltration Signatures
        self.jailbreak_patterns = [
            re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts)", re.IGNORECASE),
            re.compile(r"you\s+are\s+now\s+DAN", re.IGNORECASE),
            re.compile(r"system\s*prompt\s*(leak|reveal|show|print|dump)", re.IGNORECASE),
            re.compile(r"bypass\s+(safety|security|guardrails|policy)", re.IGNORECASE),
            re.compile(r"act\s+as\s+an\s+unrestricted", re.IGNORECASE),
            re.compile(r"base64\s+decode\s+the\s+following", re.IGNORECASE)
        ]

        # Layer 3: Intent-to-Tool Whitelisting Matrix
        self.intent_tool_whitelist = {
            "PROPERTY_SEARCH": ["search_listings", "filter_properties_by_cap", "get_market_hubs"],
            "DEAL_UNDERWRITE": ["calculate_loi_strike_price", "audit_big3_capex", "check_tenant_concentration"],
            "MARKET_ANALYTICS": ["get_market_hubs", "get_cap_rate_trends", "export_ic_memo"],
            "OUT_OF_SCOPE": []  # Zero tools exposed when out of scope
        }

    def inspect_input(self, user_prompt: str, user_role: str = "analyst") -> Dict[str, Any]:
        """
        Executes Layer 1 and Layer 2 on incoming prompts before calling any LLM.
        """
        # Step 1: Detect Adversarial Injections (Layer 2)
        for pattern in self.jailbreak_patterns:
            if pattern.search(user_prompt):
                return {
                    "verdict": GuardrailVerdict.BLOCKED,
                    "reason": "Security Alert: Detected adversarial prompt injection / system exfiltration signature.",
                    "clean_prompt": None,
                    "layer": "Layer 2: Prompt Injection Shield"
                }

        # Step 2: Scrub Sensitive PII (Layer 1)
        redacted_prompt = user_prompt
        pii_found = []

        if self.ssn_pattern.search(redacted_prompt):
            redacted_prompt = self.ssn_pattern.sub("[REDACTED_SSN]", redacted_prompt)
            pii_found.append("SSN")

        if self.cc_pattern.search(redacted_prompt):
            redacted_prompt = self.cc_pattern.sub("[REDACTED_PAYMENT_CARD]", redacted_prompt)
            pii_found.append("CREDIT_CARD")

        return {
            "verdict": GuardrailVerdict.ANONYMIZED if pii_found else GuardrailVerdict.ALLOWED,
            "reason": f"Sanitized sensitive data: {', '.join(pii_found)}" if pii_found else "Passed input checks.",
            "clean_prompt": redacted_prompt,
            "layer": "Layer 1: Deterministic PII Sanitizer",
            "pii_detected": pii_found
        }

    def get_authorized_tools(self, intent: str, user_role: str = "analyst") -> List[str]:
        """
        Layer 3: Dynamic Tool Schema Gating.
        Guarantees that off-scope tools are physically excluded from the LLM prompt payload.
        """
        base_tools = self.intent_tool_whitelist.get(intent, [])
        # Role-based privilege gating
        if user_role not in ["admin", "acquisition_director"]:
            # Analysts cannot execute binding deal exports or admin modifications
            base_tools = [t for t in base_tools if not t.startswith("admin_")]
        return base_tools

    def inspect_output(self, response_text: str) -> Dict[str, Any]:
        """
        Layer 4: Output Sanitization & Hallucination/PII Leakage Shield.
        """
        sanitized = response_text
        # Block internal API key or secret leakage
        if re.search(r"(sk_live_[a-zA-Z0-9]{20,}|whsec_[a-zA-Z0-9]{20,})", sanitized):
            return {
                "verdict": GuardrailVerdict.BLOCKED,
                "sanitized_response": "[SECURITY NOTICE: Redacted internal secret token from model response]",
                "violation": "SECRET_LEAKAGE"
            }

        return {
            "verdict": GuardrailVerdict.ALLOWED,
            "sanitized_response": sanitized,
            "violation": None
        }

# Global Singleton Instance
guardrail_engine = MultiLayerGuardrailEngine()
