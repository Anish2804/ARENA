import json
import math
import logging
from groq import AsyncGroq
from app.config.settings import settings

logger = logging.getLogger("arena.evaluator")

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

EVALUATOR_PROMPT = """
You are an expert evaluator. Evaluate the agent's response to the given task.
Score the response on quality (0-100) and accuracy (0-100).
Quality means how comprehensive, well-structured, and clear the answer is.
Accuracy means how factually correct and precise it is.
Also provide a short feedback and a decision ('accepted' or 'rejected'). A response should be rejected if quality or accuracy is below 50.

Respond strictly with a JSON object in this format:
{
  "quality": <float>,
  "accuracy": <float>,
  "feedback": "<string>",
  "decision": "<string>"
}
"""

def _clean_numeric(value, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        if isinstance(value, (int, float)):
            f_val = float(value)
        else:
            cleaned = str(value).replace("%", "").strip()
            f_val = float(cleaned)
        if math.isnan(f_val) or math.isinf(f_val):
            return default
        return max(0.0, min(100.0, f_val))
    except Exception:
        return default

async def evaluate_response(task_prompt: str, agent_response: str) -> dict:
    try:
        completion = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": EVALUATOR_PROMPT},
                {"role": "user", "content": f"Task: {task_prompt}\n\nAgent Response:\n{agent_response}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        result_json = completion.choices[0].message.content or "{}"
        clean_json = result_json.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.startswith("```"):
            clean_json = clean_json[3:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
        clean_json = clean_json.strip()

        result = json.loads(clean_json)
        
        quality = _clean_numeric(result.get("quality"), 0.0)
        accuracy = _clean_numeric(result.get("accuracy"), 0.0)
        feedback = str(result.get("feedback", "")).strip()
        raw_decision = str(result.get("decision", "rejected")).lower().strip()
        decision = "accepted" if raw_decision == "accepted" and quality >= 50 and accuracy >= 50 else "rejected"
        
        return {
            "quality_score": quality,
            "accuracy_score": accuracy,
            "evaluator_feedback": feedback,
            "decision": decision
        }
    except Exception as e:
        error_msg = str(e)
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY in error_msg:
            error_msg = error_msg.replace(settings.GROQ_API_KEY, "[REDACTED]")
            
        logger.error(f"Evaluation error: {error_msg}")
        return {
            "quality_score": 0.0,
            "accuracy_score": 0.0,
            "evaluator_feedback": f"Evaluation error: {error_msg}",
            "decision": "rejected"
        }

def calculate_final_score(quality: float, accuracy: float, cost: float, latency_ms: float) -> float:
    """
    Weighted Composite Scoring Formula:
    - 45% Quality (0 - 100)
    - 30% Accuracy (0 - 100)
    - 10% Cost efficiency (normalized relative to max benchmark of $0.05)
    - 15% Latency efficiency (normalized relative to max benchmark of 10,000ms)
    """
    q = _clean_numeric(quality, 0.0)
    a = _clean_numeric(accuracy, 0.0)
    
    # Cost normalization: lower cost is better
    c = 0.0 if (cost is None or math.isnan(cost) or cost < 0) else float(cost)
    normalized_cost = max(0.0, min(100.0, 100.0 - (c / 0.05 * 100.0)))
    
    # Latency normalization: lower latency is better
    lat = 0.0 if (latency_ms is None or math.isnan(latency_ms) or latency_ms < 0) else float(latency_ms)
    normalized_latency = max(0.0, min(100.0, 100.0 - (lat / 10000.0 * 100.0)))
    
    composite = (q * 0.45) + (a * 0.30) + (normalized_cost * 0.10) + (normalized_latency * 0.15)
    return round(max(0.0, min(100.0, composite)), 1)
