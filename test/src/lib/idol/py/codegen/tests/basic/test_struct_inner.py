# DO NOT EDIT
# This file was generated by idol_py, any changes will be lost when idol_py is rerun again
from ...__idol__ import Struct, Primitive


class TestsBasicTestStructInner(Struct):
    d: bool

    e: float

    f: int

    __field_constructors__ = [
        ("d", "d", Primitive.of(bool), dict(optional=False),),
        ("e", "e", Primitive.of(float), dict(optional=False),),
        ("f", "f", Primitive.of(int), dict(optional=False),),
    ]
