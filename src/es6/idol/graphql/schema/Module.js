// This file was scaffolded by idol_graphql.  Feel free to edit as you please.  It can be regenerated by deleting the file and rerunning idol_graphql.;
import { GraphQLObjectType } from "graphql";
import { SchemaModuleFields } from "../codegen/schema/Module";

export const ModuleType = new GraphQLObjectType({
  name: "Module",
  description: "Metadata contained about a module.",
  fields: { ...SchemaModuleFields }
});
