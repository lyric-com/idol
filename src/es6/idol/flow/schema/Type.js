//  @flow
// This file was scaffolded by idol_flow.  Feel free to edit as you please.  It can be regenerated by deleting the file and rerunning idol_flow.;
import type { SchemaTypePayload } from "../codegen/schema/Type";
import { SchemaTypeFactory } from "../codegen/schema/Type";

export interface TypePayload extends SchemaTypePayload {}
export const TypeFactory: () => TypePayload = SchemaTypeFactory;
