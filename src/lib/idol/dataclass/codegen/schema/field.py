# DO NOT EDIT
# This file was generated by idol_data, any changes will be lost when idol_data is rerun again
from dataclasses import field, dataclass
from typing import List
from ...schema.type_struct import TypeStruct


@dataclass
class SchemaFieldDataclass(object):
    field_name: str = field(default_factory=(lambda: ""))  # type: ignore
    tags: List[str] = field(default_factory=list)  # type: ignore
    type_struct: TypeStruct = field(default_factory=TypeStruct)  # type: ignore
