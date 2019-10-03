"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SchemaStructKind = void 0;

var _idol__ = require("../__idol__");

// DO NOT EDIT
// This file was generated by idol_js, any changes will be overwritten when idol_js is run again.;
// Scalars are non contained values
// Repeated are homogenous lists.  They can be upgraded or downgraded to and from Scalars.
// A repeated is indicated in a TypeDec by ending with '[]'
// Maps are homogenous 'dictionaries', whose key is always a string, mapping to js objects.
// A map is indicated in a TypeDec by ending with '{}';
var SchemaStructKind = {
  SCALAR: "Scalar",
  REPEATED: "Repeated",
  MAP: "Map",
  options: ["Scalar", "Repeated", "Map"],
  "default": "Scalar",
  // These methods are implemented via the runtime, stubs exist here for reference.,
  validate: function validate(val) {},
  isValid: function isValid(val) {
    return true;
  },
  expand: function expand(val) {
    return val;
  },
  wrap: function wrap(val) {
    return val;
  },
  unwrap: function unwrap(val) {
    return val;
  }
};
exports.SchemaStructKind = SchemaStructKind;
(0, _idol__.Enum)(SchemaStructKind);