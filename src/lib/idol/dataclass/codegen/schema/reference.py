# DO NOT EDIT
# This file was generated by idol_data, any changes will be lost when idol_data is rerun again
from dataclasses import field, dataclass


@dataclass
class SchemaReferenceDataclass(object):
    """
    A reference describes the location of a type in the module system.
    """

    # Just the module name
    module_name: str = field(default_factory=(lambda: ""))
    # The module_name.type_name string
    qualified_name: str = field(default_factory=(lambda: ""))
    # Just the type name
    type_name: str = field(default_factory=(lambda: ""))
