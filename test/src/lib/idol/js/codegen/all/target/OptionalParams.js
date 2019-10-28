// DO NOT EDIT
// This file was generated by idol_js, any changes will be overwritten when idol_js is run again.;
import { AssembledOptional as ScaffoldAssembledOptional } from "../../../all/target/AssembledOptional";
import { Struct } from "../../__idol__";

export class AllTargetOptionalParams {
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

  get optional() {
    return ScaffoldAssembledOptional.wrap(this._original["optional"]);
  }
  set optional(val) {
    this._original["optional"] = ScaffoldAssembledOptional.unwrap(val);
  }
}

Struct(AllTargetOptionalParams, [
  { fieldName: "optional", type: ScaffoldAssembledOptional, optional: false }
]);
