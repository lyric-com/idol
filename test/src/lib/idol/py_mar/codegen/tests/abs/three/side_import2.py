# DO NOT EDIT
# This file was generated by idol_mar, any changes will be lost when idol_mar is rerun again
from marshmallow import Schema
from marshmallow.fields import Int, Nested
from ....__idol__ import wrap_field


class TestsAbsThreeSideImport2Schema(Schema):
    side_import2 = Int(
        dump_to="side_import2", load_from="side_import2", allow_none=False
    )


TestsAbsThreeSideImport2Field = wrap_field(
    Nested, "TestsAbsThreeSideImport2Field", (lambda: TestsAbsThreeSideImport2Schema)
)
