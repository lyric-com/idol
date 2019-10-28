// This file was scaffolded by idol_graphql.  Feel free to edit as you please.  It can be regenerated by deleting the file and rerunning idol_graphql.;
import { AssembledOptionalType as ScaffoldAssembledOptionalType } from "./AssembledOptional";
import { AllTargetOptionalParamsInputFields } from "../../codegen/all/target/OptionalParams";
import { GraphQLObjectType } from "graphql";

export const OptionalServiceQueries = {
  optional: {
    type: ScaffoldAssembledOptionalType,
    resolve: (root, args, context) => null,
    args: { ...AllTargetOptionalParamsInputFields },
    description: ""
  }
};
export const OptionalServiceType = new GraphQLObjectType({
  name: "OptionalService",
  description: "",
  fields: { ...OptionalServiceQueries }
});