import time
from typing import Dict, Any, Callable, Awaitable

class PipelineBenchmarkHarness:
    @staticmethod
    async def measure_execution(func: Callable[[], Awaitable[Any]]) -> Dict[str, Any]:
        """
        Measures wall-clock execution time and throughput for pipeline runs.
        """
        start_time = time.perf_counter()
        result = await func()
        end_time = time.perf_counter()

        duration = end_time - start_time
        processed_items = len(result) if isinstance(result, list) else 1

        return {
            "duration_seconds": round(duration, 4),
            "processed_items": processed_items,
            "throughput_items_per_sec": round(processed_items / max(0.001, duration), 2),
            "result": result
        }
