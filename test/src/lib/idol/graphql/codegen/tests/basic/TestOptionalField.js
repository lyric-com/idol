// DO NOT EDIT
// This file was generated by idol_graphql, any changes will be overwritten when idol_graphql is run again.;
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLInputObjectType
} from "graphql";

export const TestsBasicTestOptionalFieldFields = {
  optional: { type: GraphQLString, description: "" }
};
export const TestsBasicTestOptionalFieldType = new GraphQLObjectType({
  name: "TestsBasicTestOptionalField",
  description: "",
  fields: { ...TestsBasicTestOptionalFieldFields }
});
export const TestsBasicTestOptionalFieldInputFields = {
  optional: { type: GraphQLString, description: "" }
};
export const TestsBasicTestOptionalFieldInputType = new GraphQLInputObjectType({
  name: "TestsBasicTestOptionalFieldInput",
  description: "",
  fields: { ...TestsBasicTestOptionalFieldInputFields }
});
