// DO NOT EDIT
// This file was generated by idol_graphql, any changes will be overwritten when idol_graphql is run again.;
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLInputObjectType
} from "graphql";

export const TestsBasicTestStructInnerFields = {
  d: { type: GraphQLBoolean, description: "" },
  e: { type: GraphQLFloat, description: "" },
  f: { type: GraphQLInt, description: "" }
};
export const TestsBasicTestStructInnerType = new GraphQLObjectType({
  name: "TestsBasicTestStructInner",
  description: "",
  fields: { ...TestsBasicTestStructInnerFields }
});
export const TestsBasicTestStructInnerInputFields = {
  d: { type: GraphQLBoolean, description: "" },
  e: { type: GraphQLFloat, description: "" },
  f: { type: GraphQLInt, description: "" }
};
export const TestsBasicTestStructInnerInputType = new GraphQLInputObjectType({
  name: "TestsBasicTestStructInnerInput",
  description: "",
  fields: { ...TestsBasicTestStructInnerInputFields }
});
