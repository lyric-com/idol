# DO NOT EDIT
# This file was generated by idol_data, any changes will be lost when idol_data is rerun again
from ....all.target.optional_params import OptionalParams
from dataclasses import field, dataclass
from ..optional.assembled import AllOptionalAssembledDataclass
from ....all.target.assembled_optional import AssembledOptional


@dataclass
class AllTargetOptionalMethodDataclass(object):
    input: OptionalParams = field(default_factory=OptionalParams)  # type: ignore
    output: AssembledOptional = field(default_factory=AllOptionalAssembledDataclass)  # type: ignore
