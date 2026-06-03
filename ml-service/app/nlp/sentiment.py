"""IndoBERT sentiment analysis for Indonesian text."""
import logging
from functools import lru_cache

from app.config import settings

logger = logging.getLogger(__name__)

# Label mapping for mdhugol/indonesia-bert-sentiment-classification, a model
# fine-tuned for sentiment: LABEL_0=positive, LABEL_1=neutral, LABEL_2=negative.
LABEL_MAP = {"LABEL_0": "positif", "LABEL_1": "netral", "LABEL_2": "negatif"}


@lru_cache(maxsize=1)
def load_sentiment_pipeline():
    """Load the IndoBERT sentiment pipeline (cached after first call)."""
    from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline
    model_name = settings.indobert_model
    revision = settings.sentiment_model_revision
    logger.info("Loading sentiment model %s @ %s ...", model_name, revision)
    # Pin the revision so an upstream change to the model can't silently alter
    # production outputs.
    model = AutoModelForSequenceClassification.from_pretrained(model_name, revision=revision)
    tokenizer = AutoTokenizer.from_pretrained(model_name, revision=revision)
    pipe = pipeline(
        "text-classification",
        model=model,
        tokenizer=tokenizer,
        truncation=True,
        max_length=512,
    )
    logger.info("Sentiment model loaded.")
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
