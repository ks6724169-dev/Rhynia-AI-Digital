"""
RRS v1.0 Schemas Root Package
Exports all typed contracts across all 7 Rhynia Response Engines.
"""

from .input_models import (
    InputModality,
    AttachmentType,
    AttachmentMetadata,
    ConversationTurn,
    SanitizedInput,
    StructuredRequest,
)

from .intent_models import (
    IntentCategory,
    UserProficiencyLevel,
    AmbiguityStatus,
    ExtractedEntity,
    UserIntentModel,
)

from .plan_models import (
    ResponseLengthType,
    StructuralStyle,
    SectionPlan,
    ResponseBlueprint,
)

from .reasoning_models import (
    ReasoningType,
    FactLevel,
    InformationUnit,
    LogicStep,
    ReasoningPlan,
)

from .knowledge_models import (
    KnowledgeSourceType,
    ToolCallSpec,
    ToolExecutionResult,
    KnowledgeContext,
)

from .presentation_models import (
    CalloutType,
    CalloutBox,
    TableSpec,
    ChartSpec,
    CodeBlockSpec,
    FormattedResponse,
)

from .qc_models import (
    QCDecision,
    QCSubCheck,
    QualityCheckReport,
)

__all__ = [
    # Module 01
    "InputModality",
    "AttachmentType",
    "AttachmentMetadata",
    "ConversationTurn",
    "SanitizedInput",
    "StructuredRequest",
    # Module 02
    "IntentCategory",
    "UserProficiencyLevel",
    "AmbiguityStatus",
    "ExtractedEntity",
    "UserIntentModel",
    # Module 03
    "ResponseLengthType",
    "StructuralStyle",
    "SectionPlan",
    "ResponseBlueprint",
    # Module 04
    "ReasoningType",
    "FactLevel",
    "InformationUnit",
    "LogicStep",
    "ReasoningPlan",
    # Module 05
    "KnowledgeSourceType",
    "ToolCallSpec",
    "ToolExecutionResult",
    "KnowledgeContext",
    # Module 06
    "CalloutType",
    "CalloutBox",
    "TableSpec",
    "ChartSpec",
    "CodeBlockSpec",
    "FormattedResponse",
    # Module 07
    "QCDecision",
    "QCSubCheck",
    "QualityCheckReport",
]
