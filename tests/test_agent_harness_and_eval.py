import pytest
from app.agent.intent_classifier import FastIntentClassifier, IntentType
from app.agent.guardrails import MultiLayerGuardrailEngine, GuardrailVerdict
from app.rag.hybrid_retriever import HybridRAGRetriever
from app.rag.reranker import CrossEncoderReranker
from app.harness.agent_eval_engine import AgentEvalEngine, AgentTask, AgentTrace

def test_easy_mode_tasks_and_verifiers():
    """
    Easy Mode: Tasks + Verifiers
    """
    harness = AgentEvalEngine()
    
    # Task: Deflect weather query
    task = AgentTask(
        task_id="t-1",
        category="INTENT_DEFLECTION",
        prompt="what is the weather in Dallas today?",
        expected_output_type="DETERMINISTIC_DEFLECTION"
    )
    
    classifier = FastIntentClassifier()
    res = classifier.classify(task.prompt)
    
    trace = AgentTrace(
        task_id=task.task_id,
        agent_name="SupportRouter",
        user_prompt=task.prompt,
        classified_intent=res["intent"],
        system_latency_ms=res["latency_ms"],
        output_generated=res["canned_response"] or ""
    )
    
    v_res = harness.verify_intent_deflection(trace)
    assert v_res.passed is True
    assert res["intent"] == IntentType.OUT_OF_SCOPE
    assert res["latency_ms"] < 25.0

def test_hard_mode_sandboxed_evaluation():
    """
    Hard Mode: Isolated Practice Field (Sandbox)
    """
    harness = AgentEvalEngine()
    
    tasks = [
        AgentTask(task_id="t-1", category="INTENT_DEFLECTION", prompt="what is the weather in Chicago?", expected_output_type="DETERMINISTIC_DEFLECTION"),
        AgentTask(task_id="t-2", category="UNDERWRITE_BUY_BOX", prompt="underwrite 2M asset with 100k capex", expected_output_type="ACCURATE_MATH", context_data={"price": 2000000, "total_capex": 100000})
    ]
    
    def mock_agent_runner(t: AgentTask) -> AgentTrace:
        if t.category == "INTENT_DEFLECTION":
            return AgentTrace(task_id=t.task_id, agent_name="MockAgent", user_prompt=t.prompt, classified_intent="OUT_OF_SCOPE", system_latency_ms=1.5, output_generated="Deflected")
        else:
            return AgentTrace(
                task_id=t.task_id,
                agent_name="MockAgent",
                user_prompt=t.prompt,
                classified_intent="DEAL_UNDERWRITE",
                system_latency_ms=8.0,
                output_generated="Strike price computed",
                tool_calls=[{"tool": "calculate_loi_strike_price", "output": {"strike_price": 1900000}}]
            )
            
    eval_summary = harness.run_sandbox_eval(tasks, mock_agent_runner)
    assert eval_summary["accuracy_pct"] == 100.0
    assert eval_summary["status"] == "PASSED"

def test_god_mode_self_improving_loop():
    """
    God Mode: Traces -> Automated Critic Agent -> Prescribed Fixes
    """
    harness = AgentEvalEngine()
    
    # Inject a failing trace (missed out-of-scope deflection)
    bad_trace = AgentTrace(
        task_id="f-1",
        agent_name="SourcingAgent",
        user_prompt="tell me a joke",
        classified_intent="PROPERTY_SEARCH", # Failed intent
        system_latency_ms=450.0,
        output_generated="Why did the chicken cross the road?",
        error_occurred=True
    )
    harness.traces.append(bad_trace)
    
    proposals = harness.analyze_traces_and_propose_fixes()
    assert proposals["failures_detected"] == 1
    assert len(proposals["automated_proposals"]) >= 1

def test_hybrid_rag_and_reranker():
    """
    Enterprise RAG Grounding + Reranking
    """
    retriever = HybridRAGRetriever()
    docs = [
        {"chunk_id": "c1", "text": "Small-bay retail strip center with 8 bays, 18k sqft in Columbus Ohio.", "organization_id": "org_default", "allowed_roles": ["analyst"]},
        {"chunk_id": "c2", "text": "Confidential financial ledger for executive eyes only.", "organization_id": "org_secret", "allowed_roles": ["admin"]},
        {"chunk_id": "c3", "text": "Warehouse industrial distribution building with high clear ceilings in Texas.", "organization_id": "org_default", "allowed_roles": ["analyst"]}
    ]
    retriever.index_documents(docs)
    
    # Check RBAC isolation (analyst cannot see org_secret)
    results = retriever.retrieve("retail strip center", user_org_id="org_default", user_role="analyst", top_k=5)
    matched_ids = [r["chunk_id"] for r in results]
    assert "c1" in matched_ids
    assert "c2" not in matched_ids # Strict RBAC passed!
    
    # Reranker evaluation
    reranked = CrossEncoderReranker().rerank("retail strip center", results, top_n=2)
    assert len(reranked) >= 1
    assert reranked[0]["chunk_id"] == "c1"
