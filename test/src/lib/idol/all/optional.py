from idol.__idol__ import Struct as _Struct, List as _List, Map as _Map, Optional as _Optional, Enum as _Enum, Any as _Any, Literal as _Literal, expand_primitive as _expand_primitive, validate_primitive as _validate_primitive
import json
import types

import idol.tests.basic
import idol.all.required
# DO NOT EDIT THIS FILE
# This file is generated via idol_py.py.  You can either subclass these types
# in your own module file or update the relevant model.toml file and regenerate.

__all__ = [
    "Assembled",
]


class Assembled(_Struct):
    test_atleast_one: _Optional[idol.tests.basic.TestAtleastOne]
    test_enum: _Optional[idol.tests.basic.TestEnum]
    test_kind: _Optional[idol.tests.basic.TestKind]
    test_list_of: _Optional[idol.all.required.ListOfTestKind]
    test_list_of_list_struct: _Optional[idol.tests.basic.TestListOfListStruct]
    test_literal_struct: _Optional[idol.tests.basic.TestLiteralStruct]
    test_literal_top: _Optional[idol.tests.basic.TestLiteralTop]
    test_map: _Optional[idol.tests.basic.TestMap]
    test_optional_field: _Optional[idol.tests.basic.TestOptionalField]
    test_struct: _Optional[idol.tests.basic.TestStruct]
    test_triplet: _Optional[idol.all.required.TripletOfSideImport2]
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [{"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestAtleastOne", "type_name": "TestAtleastOne"}}, {"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestEnum", "type_name": "TestEnum"}}, {"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestKind", "type_name": "TestKind"}}, {"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "all.required", "qualified_name": "all.required.ListOfTestKind", "type_name": "ListOfTestKind"}}, {"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestListOfListStruct", "type_name": "TestListOfListStruct"}}, {"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralStruct", "type_name": "TestLiteralStruct"}}, {"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralTop", "type_name": "TestLiteralTop"}}, {"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestMap", "type_name": "TestMap"}}, {"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestOptionalField", "type_name": "TestOptionalField"}}, {"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestStruct", "type_name": "TestStruct"}}, {"from": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "is_abstraction": false, "is_local": false, "to": {"module_name": "all.required", "qualified_name": "all.required.TripletOfSideImport2", "type_name": "TripletOfSideImport2"}}], "fields": {"test_atleast_one": {"field_name": "test_atleast_one", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestAtleastOne", "type_name": "TestAtleastOne"}, "struct_kind": "Scalar"}}, "test_enum": {"field_name": "test_enum", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestEnum", "type_name": "TestEnum"}, "struct_kind": "Scalar"}}, "test_kind": {"field_name": "test_kind", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestKind", "type_name": "TestKind"}, "struct_kind": "Scalar"}}, "test_list_of": {"field_name": "test_list_of", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "all.required", "qualified_name": "all.required.ListOfTestKind", "type_name": "ListOfTestKind"}, "struct_kind": "Scalar"}}, "test_list_of_list_struct": {"field_name": "test_list_of_list_struct", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestListOfListStruct", "type_name": "TestListOfListStruct"}, "struct_kind": "Scalar"}}, "test_literal_struct": {"field_name": "test_literal_struct", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralStruct", "type_name": "TestLiteralStruct"}, "struct_kind": "Scalar"}}, "test_literal_top": {"field_name": "test_literal_top", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralTop", "type_name": "TestLiteralTop"}, "struct_kind": "Scalar"}}, "test_map": {"field_name": "test_map", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestMap", "type_name": "TestMap"}, "struct_kind": "Scalar"}}, "test_optional_field": {"field_name": "test_optional_field", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestOptionalField", "type_name": "TestOptionalField"}, "struct_kind": "Scalar"}}, "test_struct": {"field_name": "test_struct", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestStruct", "type_name": "TestStruct"}, "struct_kind": "Scalar"}}, "test_triplet": {"field_name": "test_triplet", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "all.required", "qualified_name": "all.required.TripletOfSideImport2", "type_name": "TripletOfSideImport2"}, "struct_kind": "Scalar"}}}, "is_a": null, "named": {"module_name": "all.optional", "qualified_name": "all.optional.Assembled", "type_name": "Assembled"}, "options": [], "tags": [], "type_vars": []}')