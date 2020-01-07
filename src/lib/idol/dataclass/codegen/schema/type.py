# DO NOT EDIT
# This file was generated by idol_data, any changes will be lost when idol_data is rerun again
from dataclasses import field, dataclass
from typing import Mapping, Optional, List
from ...schema.field import Field
from ...schema.type_struct import TypeStruct
from ...schema.reference import Reference


@dataclass
class SchemaTypeDataclass(object):
    """
    A wrapper type containing fields that can describe a Type, as well as its tag metadata.
    """

    # When this type is a struct, each of its fields and the type of that field is included
    # Exclusive with is_a and options
    fields: Mapping[str, Field] = field(default_factory=dict)  # type: ignore
    # Set when this is type is an alias or simply an type expression (such as a generic).
    # Exclusive with having values for options or fields.
    is_a: Optional[TypeStruct] = field(default_factory=(lambda: None))  # type: ignore
    # The name and module information of this type's definition.
    named: Reference = field(default_factory=Reference)  # type: ignore
    # When this type is an enum includes the string values for each enum entry.  Note that each
    # target language may have different rules for the enum constant names, but these entries are
    # canonical resident values.
    # Exclusive with is_a and fields.
    options: List[str] = field(default_factory=list)  # type: ignore
    # General metadata given to a type.  Currently, atleast_one for Repeated types is supported.
    # Custom codegen can use these tags to implement semantic types on top of simple logic types.
    # In general, however, tags are considred optional and should not be required to
    # deserialize / serializeconsume correct logical values.
    tags: List[str] = field(default_factory=list)  # type: ignore
