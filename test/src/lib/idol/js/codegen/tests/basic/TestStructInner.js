// DO NOT EDIT
// This file was generated by idol_js, any changes will be overwritten when idol_js is run again.
import { Primitive, Struct } from "../../__idol__";

export class TestsBasicTestStructInner {
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

  get d() {
    return Primitive.of("bool").wrap(this._original["d"]);
  }
  set d(val) {
    this._original["d"] = Primitive.of("bool").unwrap(val);
  }

  get e() {
    return Primitive.of("double").wrap(this._original["e"]);
  }
  set e(val) {
    this._original["e"] = Primitive.of("double").unwrap(val);
  }

  get f() {
    return Primitive.of("int").wrap(this._original["f"]);
  }
  set f(val) {
    this._original["f"] = Primitive.of("int").unwrap(val);
  }
}

Struct(TestsBasicTestStructInner, [
  { fieldName: "d", type: Primitive.of("bool"), optional: false },
  { fieldName: "e", type: Primitive.of("double"), optional: false },
  { fieldName: "f", type: Primitive.of("int"), optional: false }
]);
