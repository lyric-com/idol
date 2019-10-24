// DO NOT EDIT
// This file was generated by idol_js, any changes will be overwritten when idol_js is run again.;
import { TestsBasicLiteralFive as CodegenTestsBasicLiteralFive } from "./LiteralFive";
import { TestsBasicLiteralTrue as CodegenTestsBasicLiteralTrue } from "./LiteralTrue";
import { TestsBasicLiteral1 as CodegenTestsBasicLiteral1 } from "./Literal1";
import { TestsBasicLiteralThreeO as CodegenTestsBasicLiteralThreeO } from "./LiteralThreeO";
import { TestsBasicLiteralHello as CodegenTestsBasicLiteralHello } from "./LiteralHello";
import { Struct } from "../../__idol__";

export class TestsBasicTestLiteralStruct {
  constructor(val) {
    this._original = val;
  }
  // These methods are implemented via the runtime, stubs exist here for reference.
  static validate(val) {}
  static isValid(val) {
    return true;
  }
  static expand(val) {
    return val;
  }
  static unwrap(val) {
    return val;
  }
  static wrap(val) {
    return null;
  }

  get five() {
    return CodegenTestsBasicLiteralFive.wrap(this._original["five"]);
  }
  set five(val) {
    this._original["five"] = CodegenTestsBasicLiteralFive.unwrap(val);
  }

  get four() {
    return CodegenTestsBasicLiteralTrue.wrap(this._original["four"]);
  }
  set four(val) {
    this._original["four"] = CodegenTestsBasicLiteralTrue.unwrap(val);
  }

  get one() {
    return CodegenTestsBasicLiteral1.wrap(this._original["one"]);
  }
  set one(val) {
    this._original["one"] = CodegenTestsBasicLiteral1.unwrap(val);
  }

  get three() {
    return CodegenTestsBasicLiteralThreeO.wrap(this._original["three"]);
  }
  set three(val) {
    this._original["three"] = CodegenTestsBasicLiteralThreeO.unwrap(val);
  }

  get two() {
    return CodegenTestsBasicLiteralHello.wrap(this._original["two"]);
  }
  set two(val) {
    this._original["two"] = CodegenTestsBasicLiteralHello.unwrap(val);
  }
}

Struct(TestsBasicTestLiteralStruct, [
  { fieldName: "five", type: CodegenTestsBasicLiteralFive, optional: true },
  { fieldName: "four", type: CodegenTestsBasicLiteralTrue, optional: false },
  { fieldName: "one", type: CodegenTestsBasicLiteral1, optional: false },
  { fieldName: "three", type: CodegenTestsBasicLiteralThreeO, optional: false },
  { fieldName: "two", type: CodegenTestsBasicLiteralHello, optional: false }
]);
