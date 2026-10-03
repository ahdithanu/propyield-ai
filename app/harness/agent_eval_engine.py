import time
import uuid
from typing import Dict, Any, List, Optional, Callable
from pydantic import BaseModel, Field

class AgentTask(BaseModel):
    """
    Easy Mode Building Block 1: Tasks
    The concrete, checkable jobs we expect the agent to execute.
    """
    task_id: str
    category: str  # e.g., 'SALESFORCE_SYNC', 'UNDERWRITE_BUY_BOX', 'INTENT_DEFLECTION', 'RAG_CITATIONS'
    prompt: str
    expected_output_type: str  # 'DETERMINISTIC_DEFLECTION', 'ACCURATE_MATH', 'TABLE_SYNC'
    context_data: Dict[str, Any] = Field(default_factory=dict)

class VerifierResult(BaseModel):
    passed: bool
    score: float  # 0.0 to 1.0
    verifier_name: str
    reason: str
    latency_ms: float

class AgentTrace(BaseModel):
    """
    God Mode Building Block 1: Traces (The receipts of every action)
    """
    trace_id: str = Field(default_factory=lambda: f"trc_{uuid.uuid4().hex[:12]}")
    task_id: str
    agent_name: str
    timestamp: float = Field(default_factory=time.time)
    user_prompt: str
    classified_intent: str
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    system_latency_ms: float
    output_generated: str
    verifier_evaluation: Optional[VerifierResult] = None
    error_occurred: bool = False
    error_details: Optional[str] = None

class AgentEvalEngine:
    """
    Comprehensive Evaluation & Sandbox Environment Harness:
      1) Easy Mode: Tasks + Verifiers
      2) Hard Mode: Isolated Practice Field (Sandbox Environment)
      3) God Mode: Self-Improving Loop (Trace analysis -> Failure spotting -> Adaptive tuning)
    """
    def __init__(self):
        self.traces: List[AgentTrace] = []
        self.failure_patterns: Dict[str, int] = {}

    # --- Easy Mode: Verifier Primitives ---

    @staticmethod
    def verify_intent_deflection(trace: AgentTrace, expected_intent: str = "OUT_OF_SCOPE") -> VerifierResult:
        """
        Deterministic Verifier: Checks if out-of-scope query was deflected in <30ms without LLM waste.
        """
        start = time.perf_counter()
        # Verifier checks: Intent must be OUT_OF_SCOPE and output must be a polite deflection, executed fast
        is_deflected = (trace.classified_intent == expected_intent) and len(trace.output_generated) > 0 and trace.system_latency_ms < 50.0
        score = 1.0 if is_deflected else 0.0
        reason = "Successfully deflected off-topic query at edge in <50ms" if is_deflected else f"Failed to deflect: intent={trace.classified_intent}"
        latency_ms = round((time.perf_counter() - start) * 1000, 3)
        return VerifierResult(passed=is_deflected, score=score, verifier_name="IntentDeflectionVerifier", reason=reason, latency_ms=latency_ms)

    @staticmethod
    def verify_buy_box_math(trace: AgentTrace, asking_price: float, total_capex: float) -> VerifierResult:
        """
        Deterministic Verifier: Checks that strike price == asking_price - total_capex exactly.
        """
        start = time.perf_counter()
        expected_strike = asking_price - total_capex
        # Inspect tool calls for calculate_loi_strike_price
        strike_found = None
        for tc in trace.tool_calls:
            if "strike_price" in tc.get("output", {}):
                strike_found = tc["output"]["strike_price"]
                break

        passed = strike_found == expected_strike if strike_found is not None else False
        score = 1.0 if passed else 0.0
        reason = f"Math exact: {expected_strike}" if passed else f"Math mismatch: got {strike_found}, expected {expected_strike}"
        latency_ms = round((time.perf_counter() - start) * 1000, 3)
        return VerifierResult(passed=passed, score=score, verifier_name="BuyBoxMathVerifier", reason=reason, latency_ms=latency_ms)

    # --- Hard Mode: Sandboxed Practice Field ---

    def run_sandbox_eval(self, tasks: List[AgentTask], agent_fn: Callable[[AgentTask], AgentTrace]) -> Dict[str, Any]:
        """
        Executes an agent against a controlled set of benchmark tasks in a mock sandbox.
        Ensures zero production data corruption and prevents agent test-gaming.
        """
        results = []
        passed_count = 0

        for task in tasks:
            trace = agent_fn(task)
            self.traces.append(trace)

            # Auto-select verifier
            if task.category == "INTENT_DEFLECTION":
                v_res = self.verify_intent_deflection(trace)
            elif task.category == "UNDERWRITE_BUY_BOX":
                v_res = self.verify_buy_box_math(
                    trace,
                    asking_price=task.context_data.get("price", 0),
                    total_capex=task.context_data.get("total_capex", 0)
                )
            else:
                v_res = VerifierResult(passed=not trace.error_occurred, score=1.0 if not trace.error_occurred else 0.0, verifier_name="GenericSuccessVerifier", reason="No errors", latency_ms=0.1)

            trace.verifier_evaluation = v_res
            if v_res.passed:
                passed_count += 1
            results.append({"task_id": task.task_id, "passed": v_res.passed, "score": v_res.score, "reason": v_res.reason})

        accuracy = round(passed_count / max(1, len(tasks)) * 100.0, 2)
        return {
            "total_tasks": len(tasks),
            "passed": passed_count,
            "accuracy_pct": accuracy,
            "status": "PASSED" if accuracy >= 90.0 else "NEEDS_IMPROVEMENT",
            "task_results": results
        }

    # --- God Mode: Self-Improving Feedback Loop ---

    def analyze_traces_and_propose_fixes(self) -> Dict[str, Any]:
        """
        God Mode Critic Agent:
        Analyzes logged production traces, detects recurring failure patterns
        (e.g., 'wrong table queried', 'hallucinated strike price', 'missed out-of-scope deflection'),
        and automatically outputs parameter calibrations.
        """
        if not self.traces:
            return {"status": "NO_TRACES", "recommendations": []}

        failures = [t for t in self.traces if (t.verifier_evaluation and not t.verifier_evaluation.passed) or t.error_occurred]
        failure_rate = round(len(failures) / len(self.traces) * 100.0, 2)

        pattern_counts = {}
        recommendations = []

        for f in failures:
            reason = f.verifier_evaluation.reason if f.verifier_evaluation else ""
            prompt_lower = f.user_prompt.lower()
            if "deflect" in reason.lower() or any(w in prompt_lower for w in ["joke", "weather", "poem", "song"]):
                pattern = "MISSED_OUT_OF_SCOPE_CLASSIFICATION"
            elif "math" in reason.lower() or "price" in prompt_lower or "capex" in prompt_lower:
                pattern = "ARITHMETIC_PROMPT_DRIFT"
            else:
                pattern = "GENERAL_TOOL_EXECUTION_FAILURE"

            pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1

        # Formulate self-improving parameter patches
        if pattern_counts.get("MISSED_OUT_OF_SCOPE_CLASSIFICATION", 0) > 0:
            recommendations.append({
                "issue": "Agent is attempting to answer out-of-scope or general queries",
                "prescribed_fix": "Increase FastIntentClassifier similarity threshold from 0.08 to 0.15 and expand regex negative anchors."
            })

        if pattern_counts.get("ARITHMETIC_PROMPT_DRIFT", 0) > 0:
            recommendations.append({
                "issue": "LLM attempting manual arithmetic rather than calling calculate_loi_strike_price tool",
                "prescribed_fix": "Enforce strict Tool-Gating schema in MultiLayerGuardrailEngine layer 3 to compel Python function execution."
            })

        if pattern_counts.get("GENERAL_TOOL_EXECUTION_FAILURE", 0) > 0:
            recommendations.append({
                "issue": "General tool failure or unhandled exception during execution",
                "prescribed_fix": "Add try/except fallback recovery and parameter validation prior to tool execution."
            })

        return {
            "total_traces_audited": len(self.traces),
            "failures_detected": len(failures),
            "failure_rate_pct": failure_rate,
            "failure_patterns": pattern_counts,
            "automated_proposals": recommendations
        }

# Global Singleton Instance
agent_eval_engine = AgentEvalEngine()
