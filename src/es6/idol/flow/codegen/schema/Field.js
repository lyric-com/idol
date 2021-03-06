//  @flow
// DO NOT EDIT
// This file was generated by idol_flow, any changes will be overwritten when idol_flow is run again.
import type { TypeStructPayload as ScaffoldTypeStructPayload } from "../../schema/TypeStruct";
import { TypeStructFactory as ScaffoldTypeStructFactory } from "../../schema/TypeStruct";

export interface SchemaFieldPayload {
  field_name: string;
  tags: Array<string>;
  type_struct: ScaffoldTypeStructPayload;
}

export const SchemaFieldFactory: () => SchemaFieldPayload = () => ({
  field_name: (() => "")(),
  tags: (() => [])(),
  type_struct: ScaffoldTypeStructFactory()
});
