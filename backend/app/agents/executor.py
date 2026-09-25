import time
import logging
from typing import Dict, Any
from groq import AsyncGroq
from app.config.settings import settings

logger = logging.getLogger("arena.executor")

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

async def execute_agent(agent: Any, task_prompt: str) -> Dict[str, Any]:
    start_time = time.perf_counter()
    
    # Respect agent-specific execution profiles if configured
    temperature = getattr(agent, "temperature", 0.7)
    max_tokens = getattr(agent, "max_tokens", 1024)
    
    try:
        completion = await client.chat.completions.create(
            model=agent.model,
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
        
        # Token cost estimation for openai/gpt-oss-20b on Groq
        # $0.15 per 1M prompt tokens, $0.60 per 1M completion tokens
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
        # Redact any accidental credential leak from exception message
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY in error_msg:
            error_msg = error_msg.replace(settings.GROQ_API_KEY, "[REDACTED]")
            
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
