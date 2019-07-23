from idol.__idol__ import Struct as _Struct, List as _List, Map as _Map, Optional as _Optional, Enum as _Enum, Any as _Any, Literal as _Literal, expand_primitive as _expand_primitive, validate_primitive as _validate_primitive
import json
import types

import idol.declarations
# DO NOT EDIT THIS FILE
# This file is generated via idol_py.py.  You can either subclass these types
# in your own module file or update the relevant model.toml file and regenerate.

__all__ = [
    "FieldDec",
    "TypeDec",
    "ModuleDec",
]


FieldDec = _List[str]
locals()["FieldDec"] = types.new_class("FieldDec", (locals()["FieldDec"],))
FieldDec.__metadata__ = json.loads('{"dependencies": [], "fields": {}, "is_a": {"literal": null, "parameters": [], "primitive_type": "string", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Repeated"}, "named": {"module_name": "declarations", "qualified_name": "declarations.FieldDec", "type_name": "FieldDec"}, "options": [], "tags": ["atleast_one"], "type_vars": []}')


class TypeDec(_Struct):
    enum: _List[str]
    fields: _Map[FieldDec]
    is_a: str
    tags: _List[str]
    type_vars: _List[str]
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [{"from": {"module_name": "declarations", "qualified_name": "declarations.TypeDec", "type_name": "TypeDec"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "declarations", "qualified_name": "declarations.FieldDec", "type_name": "FieldDec"}}], "fields": {"enum": {"field_name": "enum", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "string", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Repeated"}}, "fields": {"field_name": "fields", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "declarations", "qualified_name": "declarations.FieldDec", "type_name": "FieldDec"}, "struct_kind": "Map"}}, "is_a": {"field_name": "is_a", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "string", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}}, "tags": {"field_name": "tags", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "string", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Repeated"}}, "type_vars": {"field_name": "type_vars", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "string", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Repeated"}}}, "is_a": null, "named": {"module_name": "declarations", "qualified_name": "declarations.TypeDec", "type_name": "TypeDec"}, "options": [], "tags": [], "type_vars": []}')


ModuleDec = _Map[TypeDec]
locals()["ModuleDec"] = types.new_class("ModuleDec", (locals()["ModuleDec"],))
ModuleDec.__metadata__ = json.loads('{"dependencies": [{"from": {"module_name": "declarations", "qualified_name": "declarations.ModuleDec", "type_name": "ModuleDec"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "declarations", "qualified_name": "declarations.TypeDec", "type_name": "TypeDec"}}], "fields": {}, "is_a": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "declarations", "qualified_name": "declarations.TypeDec", "type_name": "TypeDec"}, "struct_kind": "Map"}, "named": {"module_name": "declarations", "qualified_name": "declarations.ModuleDec", "type_name": "ModuleDec"}, "options": [], "tags": [], "type_vars": []}')