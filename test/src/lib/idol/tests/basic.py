from idol.__idol__ import Struct as _Struct, List as _List, Map as _Map, Optional as _Optional, Enum as _Enum, Any as _Any, Literal as _Literal, expand_primitive as _expand_primitive, validate_primitive as _validate_primitive
import json
import types

import idol.tests.basic
# DO NOT EDIT THIS FILE
# This file is generated via idol_py.py.  You can either subclass these types
# in your own module file or update the relevant model.toml file and regenerate.

__all__ = [
    "TestEnum",
    "TestLiteralTop",
    "TestOptionalField",
    "TestTagsStruct",
    "TestStructInner",
    "TestStruct",
    "TestKind",
    "TestAtleastOne",
    "TestMap",
    "LiteralHello",
    "LiteralThreeO",
    "Literal1",
    "LiteralTrue",
    "LiteralFive",
    "TestLiteralStruct",
    "TestListOfListStruct",
]


class TestEnum(_Enum):
    A = 'a'
    B = 'b'
    C = 'c'
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [], "fields": {}, "is_a": null, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestEnum", "type_name": "TestEnum"}, "options": ["a", "b", "c"], "tags": [], "type_vars": []}')


class TestLiteralTop(_Literal[str]):
    literal: str = 'mooo'
    
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [], "fields": {}, "is_a": {"literal": {"bool": false, "double": 0.0, "int": 0, "string": "mooo"}, "parameters": [], "primitive_type": "string", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralTop", "type_name": "TestLiteralTop"}, "options": [], "tags": [], "type_vars": []}')


class TestOptionalField(_Struct):
    optional: _Optional[str]
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [], "fields": {"optional": {"field_name": "optional", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "string", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}}}, "is_a": null, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestOptionalField", "type_name": "TestOptionalField"}, "options": [], "tags": [], "type_vars": []}')


class TestTagsStruct(_Struct):
    a: int
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [], "fields": {"a": {"field_name": "a", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}}}, "is_a": null, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestTagsStruct", "type_name": "TestTagsStruct"}, "options": [], "tags": ["tag-a", "tag-b"], "type_vars": []}')


class TestStructInner(_Struct):
    d: bool
    e: float
    f: int
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [], "fields": {"d": {"field_name": "d", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "bool", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}}, "e": {"field_name": "e", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "double", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}}, "f": {"field_name": "f", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}}}, "is_a": null, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestStructInner", "type_name": "TestStructInner"}, "options": [], "tags": [], "type_vars": []}')


class TestStruct(_Struct):
    a: str
    b: int
    c: TestStructInner
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [{"from": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestStruct", "type_name": "TestStruct"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestStructInner", "type_name": "TestStructInner"}}], "fields": {"a": {"field_name": "a", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "string", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}}, "b": {"field_name": "b", "tags": ["tag"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}}, "c": {"field_name": "c", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestStructInner", "type_name": "TestStructInner"}, "struct_kind": "Scalar"}}}, "is_a": null, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestStruct", "type_name": "TestStruct"}, "options": [], "tags": [], "type_vars": []}')


TestKind = str
locals()["TestKind"] = types.new_class("TestKind", (locals()["TestKind"],))
TestKind.__metadata__ = json.loads('{"dependencies": [], "fields": {}, "is_a": {"literal": null, "parameters": [], "primitive_type": "string", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestKind", "type_name": "TestKind"}, "options": [], "tags": [], "type_vars": []}')
TestKind.expand = classmethod(_expand_primitive)
TestKind.validate = classmethod(_validate_primitive)


TestAtleastOne = _List[TestKind]
locals()["TestAtleastOne"] = types.new_class("TestAtleastOne", (locals()["TestAtleastOne"],))
TestAtleastOne.__metadata__ = json.loads('{"dependencies": [{"from": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestAtleastOne", "type_name": "TestAtleastOne"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestKind", "type_name": "TestKind"}}], "fields": {}, "is_a": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestKind", "type_name": "TestKind"}, "struct_kind": "Repeated"}, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestAtleastOne", "type_name": "TestAtleastOne"}, "options": [], "tags": ["atleast_one"], "type_vars": []}')


TestMap = _Map[TestAtleastOne]
locals()["TestMap"] = types.new_class("TestMap", (locals()["TestMap"],))
TestMap.__metadata__ = json.loads('{"dependencies": [{"from": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestMap", "type_name": "TestMap"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestAtleastOne", "type_name": "TestAtleastOne"}}], "fields": {}, "is_a": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestAtleastOne", "type_name": "TestAtleastOne"}, "struct_kind": "Map"}, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestMap", "type_name": "TestMap"}, "options": [], "tags": [], "type_vars": []}')


class LiteralHello(_Literal[str]):
    literal: str = 'hello'
    
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [], "fields": {}, "is_a": {"literal": {"bool": false, "double": 0.0, "int": 0, "string": "hello"}, "parameters": [], "primitive_type": "string", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralHello", "type_name": "LiteralHello"}, "options": [], "tags": [], "type_vars": []}')


class LiteralThreeO(_Literal[float]):
    literal: float = 3.0
    
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [], "fields": {}, "is_a": {"literal": {"bool": false, "double": 3.0, "int": 0, "string": ""}, "parameters": [], "primitive_type": "double", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralThreeO", "type_name": "LiteralThreeO"}, "options": [], "tags": [], "type_vars": []}')


class Literal1(_Literal[int]):
    literal: int = 1
    
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [], "fields": {}, "is_a": {"literal": {"bool": false, "double": 0.0, "int": 1, "string": ""}, "parameters": [], "primitive_type": "int", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.Literal1", "type_name": "Literal1"}, "options": [], "tags": [], "type_vars": []}')


class LiteralTrue(_Literal[bool]):
    literal: bool = True
    
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [], "fields": {}, "is_a": {"literal": {"bool": true, "double": 0.0, "int": 0, "string": ""}, "parameters": [], "primitive_type": "bool", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralTrue", "type_name": "LiteralTrue"}, "options": [], "tags": [], "type_vars": []}')


class LiteralFive(_Literal[int]):
    literal: int = 5
    
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [], "fields": {}, "is_a": {"literal": {"bool": false, "double": 0.0, "int": 5, "string": ""}, "parameters": [], "primitive_type": "int", "reference": {"module_name": "", "qualified_name": "", "type_name": ""}, "struct_kind": "Scalar"}, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralFive", "type_name": "LiteralFive"}, "options": [], "tags": [], "type_vars": []}')


class TestLiteralStruct(_Struct):
    five: _Optional[LiteralFive]
    four: LiteralTrue
    one: Literal1
    three: LiteralThreeO
    two: LiteralHello
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [{"from": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralStruct", "type_name": "TestLiteralStruct"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralFive", "type_name": "LiteralFive"}}, {"from": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralStruct", "type_name": "TestLiteralStruct"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralTrue", "type_name": "LiteralTrue"}}, {"from": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralStruct", "type_name": "TestLiteralStruct"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.Literal1", "type_name": "Literal1"}}, {"from": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralStruct", "type_name": "TestLiteralStruct"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralThreeO", "type_name": "LiteralThreeO"}}, {"from": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralStruct", "type_name": "TestLiteralStruct"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralHello", "type_name": "LiteralHello"}}], "fields": {"five": {"field_name": "five", "tags": ["optional"], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralFive", "type_name": "LiteralFive"}, "struct_kind": "Scalar"}}, "four": {"field_name": "four", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralTrue", "type_name": "LiteralTrue"}, "struct_kind": "Scalar"}}, "one": {"field_name": "one", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.Literal1", "type_name": "Literal1"}, "struct_kind": "Scalar"}}, "three": {"field_name": "three", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralThreeO", "type_name": "LiteralThreeO"}, "struct_kind": "Scalar"}}, "two": {"field_name": "two", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.LiteralHello", "type_name": "LiteralHello"}, "struct_kind": "Scalar"}}}, "is_a": null, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestLiteralStruct", "type_name": "TestLiteralStruct"}, "options": [], "tags": [], "type_vars": []}')


class TestListOfListStruct(_Struct):
    list_of_list: _List[TestAtleastOne]
    
    # Required to ensure stable ordering.  str() on python dicts is unstable,
    # but the json.dumps is stable.
    __metadata__ = json.loads('{"dependencies": [{"from": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestListOfListStruct", "type_name": "TestListOfListStruct"}, "is_abstraction": false, "is_local": true, "to": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestAtleastOne", "type_name": "TestAtleastOne"}}], "fields": {"list_of_list": {"field_name": "list_of_list", "tags": [], "type_struct": {"literal": null, "parameters": [], "primitive_type": "int", "reference": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestAtleastOne", "type_name": "TestAtleastOne"}, "struct_kind": "Repeated"}}}, "is_a": null, "named": {"module_name": "tests.basic", "qualified_name": "tests.basic.TestListOfListStruct", "type_name": "TestListOfListStruct"}, "options": [], "tags": [], "type_vars": []}')