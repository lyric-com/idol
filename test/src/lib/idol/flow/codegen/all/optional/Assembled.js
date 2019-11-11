//  @flow
// DO NOT EDIT
// This file was generated by idol_flow, any changes will be overwritten when idol_flow is run again.;
import type { TestsBasicTestAtleastOnePayload as CodegenTestsBasicTestAtleastOnePayload } from "../../tests/basic/TestAtleastOne";
import type { TestsBasicTestEnumPayload as CodegenTestsBasicTestEnumPayload } from "../../tests/basic/TestEnum";
import type { TestsBasicTestKindPayload as CodegenTestsBasicTestKindPayload } from "../../tests/basic/TestKind";
import type { AllRequiredListOfTestKindPayload as CodegenAllRequiredListOfTestKindPayload } from "../required/ListOfTestKind";
import type { TestsBasicTestListOfListStructPayload as CodegenTestsBasicTestListOfListStructPayload } from "../../tests/basic/TestListOfListStruct";
import type { TestsBasicTestLiteralStructPayload as CodegenTestsBasicTestLiteralStructPayload } from "../../tests/basic/TestLiteralStruct";
import type { TestsBasicTestLiteralTopPayload as CodegenTestsBasicTestLiteralTopPayload } from "../../tests/basic/TestLiteralTop";
import type { TestsBasicTestMapPayload as CodegenTestsBasicTestMapPayload } from "../../tests/basic/TestMap";
import type { TestsBasicTestOptionalFieldPayload as CodegenTestsBasicTestOptionalFieldPayload } from "../../tests/basic/TestOptionalField";
import type { TestsBasicTestStructPayload as CodegenTestsBasicTestStructPayload } from "../../tests/basic/TestStruct";
import type { AllRequiredTripletOfSideImport2Payload as CodegenAllRequiredTripletOfSideImport2Payload } from "../required/TripletOfSideImport2";

export interface AllOptionalAssembledPayload {
  test_atleast_one:
    | CodegenTestsBasicTestAtleastOnePayload
    | null
    | typeof undefined;
  test_enum: CodegenTestsBasicTestEnumPayload | null | typeof undefined;
  test_kind: CodegenTestsBasicTestKindPayload | null | typeof undefined;
  test_list_of:
    | CodegenAllRequiredListOfTestKindPayload
    | null
    | typeof undefined;
  test_list_of_list_struct:
    | CodegenTestsBasicTestListOfListStructPayload
    | null
    | typeof undefined;
  test_literal_struct:
    | CodegenTestsBasicTestLiteralStructPayload
    | null
    | typeof undefined;
  test_literal_top:
    | CodegenTestsBasicTestLiteralTopPayload
    | null
    | typeof undefined;
  test_map: CodegenTestsBasicTestMapPayload | null | typeof undefined;
  test_optional_field:
    | CodegenTestsBasicTestOptionalFieldPayload
    | null
    | typeof undefined;
  test_struct: CodegenTestsBasicTestStructPayload | null | typeof undefined;
  test_triplet:
    | CodegenAllRequiredTripletOfSideImport2Payload
    | null
    | typeof undefined;
}
export const AllOptionalAssembledFactory: () => AllOptionalAssembledPayload = () => ({
  test_atleast_one: (() => null)(),
  test_enum: (() => null)(),
  test_kind: (() => null)(),
  test_list_of: (() => null)(),
  test_list_of_list_struct: (() => null)(),
  test_literal_struct: (() => null)(),
  test_literal_top: (() => null)(),
  test_map: (() => null)(),
  test_optional_field: (() => null)(),
  test_struct: (() => null)(),
  test_triplet: (() => null)()
});
