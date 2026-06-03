"""BERTopic topic modeling for Indonesian inflation news."""
import logging
from functools import lru_cache
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def load_topic_model():
    """Load or create a BERTopic model."""
    from bertopic import BERTopic
    from sentence_transformers import SentenceTransformer
    from sklearn.feature_extraction.text import CountVectorizer

    embedding_model = SentenceTransformer(settings.topic_embedding_model)
    vectorizer_model = CountVectorizer(
        ngram_range=(1, 2),
        stop_words=["yang", "dan", "di", "ke", "dari", "ini", "itu", "dengan", "untuk"],
    )
    model = BERTopic(
        embedding_model=embedding_model,
        vectorizer_model=vectorizer_model,
        language="multilingual",
        calculate_probabilities=True,
        verbose=False,
    )
    logger.info("BERTopic model initialized.")
    return model


def fit_topics(documents: list[str]) -> dict:
    """Fit BERTopic on a list of documents and return topics."""
    model = load_topic_model()
    topics, probs = model.fit_transform(documents)
    topic_info = model.get_topic_info()

    # BERTopic returns numpy ints which FastAPI's JSON encoder can't serialize.
    topics = [int(t) for t in topics]

    return {
        "num_topics": len(set(topics)) - (1 if -1 in topics else 0),  # exclude outlier topic -1
        "topics": topics,
        "topic_info": topic_info[["Topic", "Count", "Name"]].to_dict(orient="records"),
    }


def get_document_topic(text: str, model=None) -> Optional[dict]:
    """Get topic for a single new document."""
    m = model or load_topic_model()
    topics, probs = m.transform([text])
    return {"topic_id": int(topics[0]), "probability": float(probs[0].max())}
