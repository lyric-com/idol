// DO NOT EDIT
// This file was generated by idol_graphql_queries, any changes will be overwritten when idol_graphql_queries is run again.;
import { SchemaTypeFragment } from "./Type";
import { gql } from "graphql-tag";

// Metadata contained about a module.;
export const SchemaModuleFragment = gql`
  fragment SchemaModuleFields on SchemaModule {
    module_name
    types_by_name {
      ...SchemaTypeFields
    }
    types_dependency_ordering
  }
  ${SchemaTypeFragment}
`;
