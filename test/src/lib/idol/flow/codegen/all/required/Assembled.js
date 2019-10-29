//  @flow
// DO NOT EDIT
// This file was generated by idol_flow, any changes will be overwritten when idol_flow is run again.;
import type {
  TestsBasicTestAtleastOnePayload as CodegenTestsBasicTestAtleastOnePayload,
  TestsBasicTestAtleastOneFactory as CodegenTestsBasicTestAtleastOneFactory
} from "../../tests/basic/TestAtleastOne";
import type { TestsBasicTestEnumPayload as CodegenTestsBasicTestEnumPayload } from "../../tests/basic/TestEnum";
import { TestsBasicTestEnumFactory as CodegenTestsBasicTestEnumFactory } from "../../tests/basic/TestEnum";
import type {
  TestsBasicTestKindPayload as CodegenTestsBasicTestKindPayload,
  TestsBasicTestKindFactory as CodegenTestsBasicTestKindFactory
} from "../../tests/basic/TestKind";
import type {
  AllRequiredListOfTestKindPayload as CodegenAllRequiredListOfTestKindPayload,
  AllRequiredListOfTestKindFactory as CodegenAllRequiredListOfTestKindFactory
} from "./ListOfTestKind";
import type { TestsBasicTestListOfListStructPayload as CodegenTestsBasicTestListOfListStructPayload } from "../../tests/basic/TestListOfListStruct";
import { TestsBasicTestListOfListStructFactory as CodegenTestsBasicTestListOfListStructFactory } from "../../tests/basic/TestListOfListStruct";
import type { TestsBasicTestLiteralStructPayload as CodegenTestsBasicTestLiteralStructPayload } from "../../tests/basic/TestLiteralStruct";
import { TestsBasicTestLiteralStructFactory as CodegenTestsBasicTestLiteralStructFactory } from "../../tests/basic/TestLiteralStruct";
import type {
  TestsBasicTestLiteralTopPayload as CodegenTestsBasicTestLiteralTopPayload,
  TestsBasicTestLiteralTopFactory as CodegenTestsBasicTestLiteralTopFactory
} from "../../tests/basic/TestLiteralTop";
import type {
  TestsBasicTestMapPayload as CodegenTestsBasicTestMapPayload,
  TestsBasicTestMapFactory as CodegenTestsBasicTestMapFactory
} from "../../tests/basic/TestMap";
import type { TestsBasicTestOptionalFieldPayload as CodegenTestsBasicTestOptionalFieldPayload } from "../../tests/basic/TestOptionalField";
import { TestsBasicTestOptionalFieldFactory as CodegenTestsBasicTestOptionalFieldFactory } from "../../tests/basic/TestOptionalField";
import type { TestsBasicTestStructPayload as CodegenTestsBasicTestStructPayload } from "../../tests/basic/TestStruct";
import { TestsBasicTestStructFactory as CodegenTestsBasicTestStructFactory } from "../../tests/basic/TestStruct";
import type { AllRequiredTripletOfSideImport2Payload as CodegenAllRequiredTripletOfSideImport2Payload } from "./TripletOfSideImport2";
import { AllRequiredTripletOfSideImport2Factory as CodegenAllRequiredTripletOfSideImport2Factory } from "./TripletOfSideImport2";

export interface AllRequiredAssembledPayload {
  test_atleast_one: CodegenTestsBasicTestAtleastOnePayload;
  test_enum: CodegenTestsBasicTestEnumPayload;
  test_kind: CodegenTestsBasicTestKindPayload;
  test_list_of: CodegenAllRequiredListOfTestKindPayload;
  test_list_of_list_struct: CodegenTestsBasicTestListOfListStructPayload;
  test_literal_struct: CodegenTestsBasicTestLiteralStructPayload;
  test_literal_top: CodegenTestsBasicTestLiteralTopPayload;
  test_map: CodegenTestsBasicTestMapPayload;
  test_optional_field: CodegenTestsBasicTestOptionalFieldPayload;
  test_struct: CodegenTestsBasicTestStructPayload;
  test_triplet: CodegenAllRequiredTripletOfSideImport2Payload;
}
export const AllRequiredAssembledFactory: () => AllRequiredAssembledPayload = () => ({
  test_atleast_one: CodegenTestsBasicTestAtleastOneFactory(),
  test_enum: CodegenTestsBasicTestEnumFactory(),
  test_kind: CodegenTestsBasicTestKindFactory(),
  test_list_of: CodegenAllRequiredListOfTestKindFactory(),
  test_list_of_list_struct: CodegenTestsBasicTestListOfListStructFactory(),
  test_literal_struct: CodegenTestsBasicTestLiteralStructFactory(),
  test_literal_top: CodegenTestsBasicTestLiteralTopFactory(),
  test_map: CodegenTestsBasicTestMapFactory(),
  test_optional_field: CodegenTestsBasicTestOptionalFieldFactory(),
  test_struct: CodegenTestsBasicTestStructFactory(),
  test_triplet: CodegenAllRequiredTripletOfSideImport2Factory()
});
