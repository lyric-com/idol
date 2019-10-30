//  @flow
// DO NOT EDIT
// This file was generated by idol_flow, any changes will be overwritten when idol_flow is run again.;
import type { LiteralPayload as ScaffoldLiteralPayload } from "../../schema/Literal";
import type { PrimitiveTypePayload as ScaffoldPrimitiveTypePayload } from "../../schema/PrimitiveType";
import { PrimitiveTypeFactory as ScaffoldPrimitiveTypeFactory } from "../../schema/PrimitiveType";
import type { ReferencePayload as ScaffoldReferencePayload } from "../../schema/Reference";
import { ReferenceFactory as ScaffoldReferenceFactory } from "../../schema/Reference";
import type { StructKindPayload as ScaffoldStructKindPayload } from "../../schema/StructKind";
import { StructKindFactory as ScaffoldStructKindFactory } from "../../schema/StructKind";

export interface SchemaTypeStructPayload {
  literal: ScaffoldLiteralPayload | null | typeof undefined;
  primitive_type: ScaffoldPrimitiveTypePayload;
  reference: ScaffoldReferencePayload;
  struct_kind: ScaffoldStructKindPayload;
}
export const SchemaTypeStructFactory: () => SchemaTypeStructPayload = () => ({
  literal: (() => null)(),
  primitive_type: ScaffoldPrimitiveTypeFactory(),
  reference: ScaffoldReferenceFactory(),
  struct_kind: ScaffoldStructKindFactory()
});