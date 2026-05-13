"""Six specialised agents that cooperate to verify a claim.

1. ArabicNLPAgent  - linguistic & sentiment analysis of the claim
2. EvidenceAgent   - retrieves live web evidence
3. CredibilityAgent - rates source credibility
4. ClaimTracerAgent - traces the origin / propagation of the claim
5. FakeNewsAgent   - detects fake-news markers (sensational language, emotion)
6. VerdictAgent    - synthesises a final, structured verdict
"""

from .pipeline import FactCheckPipeline

__all__ = ["FactCheckPipeline"]
