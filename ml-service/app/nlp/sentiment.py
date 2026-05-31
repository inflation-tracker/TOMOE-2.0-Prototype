"""IndoBERT sentiment analysis for Indonesian text."""
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

LABEL_MAP = {"LABEL_0": "negatif", "LABEL_1": "netral", "LABEL_2": "positif"}


@lru_cache(maxsize=1)
def load_sentiment_pipeline():
    """Load IndoBERT sentiment pipeline (cached after first call)."""
    from transformers import pipeline
    logger.info("Loading IndoBERT sentiment model...")
    pipe = pipeline(
        "text-classification",
        model="indobenchmark/indobert-base-p2",
        tokenizer="indobenchmark/indobert-base-p2",
        truncation=True,
        max_length=512,
    )
    logger.info("IndoBERT model loaded.")
    return pipe


def analyze_sentiment(text: str) -> dict:
    """
    Analyze sentiment of Indonesian text using IndoBERT.
    Returns label (negatif/netral/positif) and score.
    """
    pipe = load_sentiment_pipeline()
    result = pipe(text[:512])[0]
    label = LABEL_MAP.get(result["label"], result["label"])
    score = result["score"]
    # Normalize score to -1..1 for negatif, 0 for netral, +1 for positif
    if label == "negatif":
        normalized = -score
    elif label == "positif":
        normalized = score
    else:
        normalized = 0.0

    return {
        "text": text[:200],
        "sentiment": label,
        "score": round(normalized, 4),
        "confidence": round(score, 4),
    }


def batch_analyze(texts: list[str]) -> list[dict]:
    """Batch analyze multiple texts."""
    return [analyze_sentiment(t) for t in texts]
