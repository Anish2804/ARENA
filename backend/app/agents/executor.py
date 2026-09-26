import time
import logging
import os
from typing import Dict, Any
import litellm
from app.config.settings import settings

logger = logging.getLogger("arena.executor")

# Ensure env vars are set for litellm
if settings.GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
if settings.GOOGLE_GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GOOGLE_GEMINI_API_KEY
if settings.OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
if settings.ANTHROPIC_API_KEY:
    os.environ["ANTHROPIC_API_KEY"] = settings.ANTHROPIC_API_KEY

async def execute_agent(agent: Any, task_prompt: str) -> Dict[str, Any]:
    start_time = time.perf_counter()
    
    provider = getattr(agent, "provider", "groq")
    model_name = getattr(agent, "model", "llama3-8b-8192")
    
    # Check if API key is configured
    if provider == "groq" and not settings.GROQ_API_KEY:
        missing_key = "GROQ_API_KEY"
    elif provider == "gemini" and not settings.GOOGLE_GEMINI_API_KEY:
        missing_key = "GOOGLE_GEMINI_API_KEY"
    elif provider == "openai" and not settings.OPENAI_API_KEY:
        missing_key = "OPENAI_API_KEY"
    elif provider == "anthropic" and not settings.ANTHROPIC_API_KEY:
        missing_key = "ANTHROPIC_API_KEY"
    else:
        missing_key = None
        
    if missing_key:
        return {
            "status": "failed",
            "response": f"Execution failed: {missing_key} is missing in backend environment variables. Please configure it.",
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "latency_ms": 0.0,
            "estimated_cost": 0.0
        }

    # Respect agent-specific execution profiles if configured
    temperature = getattr(agent, "temperature", 0.7)
    max_tokens = getattr(agent, "max_tokens", 1024)
    
    # Prefix provider for litellm
    if provider == "gemini":
        litellm_model = f"gemini/{model_name}"
    elif provider == "groq":
        litellm_model = f"groq/{model_name}"
    elif provider == "anthropic":
        litellm_model = f"anthropic/{model_name}"
    else:
        litellm_model = model_name
        
    try:
        completion = await litellm.acompletion(
            model=litellm_model,
            messages=[
                {"role": "system", "content": agent.system_prompt},
                {"role": "user", "content": task_prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000
        
        choice = completion.choices[0]
        response_text = choice.message.content or ""
        input_tokens = completion.usage.prompt_tokens if completion.usage else 0
        output_tokens = completion.usage.completion_tokens if completion.usage else 0
        total_tokens = completion.usage.total_tokens if completion.usage else (input_tokens + output_tokens)
        
        try:
            estimated_cost = litellm.completion_cost(completion_response=completion)
        except Exception:
            # Fallback estimation
            estimated_cost = (input_tokens / 1_000_000 * 0.15) + (output_tokens / 1_000_000 * 0.60)
        
        return {
            "status": "completed",
            "response": response_text,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "latency_ms": latency_ms,
            "estimated_cost": estimated_cost
        }
    except Exception as e:
        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000
        error_msg = str(e)
            
        logger.error(f"Error executing agent {getattr(agent, 'name', 'unknown')}: {error_msg}")
        return {
            "status": "failed",
            "response": f"Execution failed: {error_msg}",
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "latency_ms": latency_ms,
            "estimated_cost": 0.0
        }
