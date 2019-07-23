#! /usr/bin/env node
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}
"use strict";

var _process = _interopRequireDefault(require("process"));

var _fs = _interopRequireDefault(require("fs"));

var _idol__ = require("./__idol__");

var _schema = require("./schema");

var _path = _interopRequireDefault(require("path"));

var _os = _interopRequireDefault(require("os"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var BuildEnv =
/*#__PURE__*/
function () {
  function BuildEnv(ignoreIdolJs) {
    _classCallCheck(this, BuildEnv);

    this.buildDir = _fs["default"].mkdtempSync(_os["default"].tmpdir() + _path["default"].sep + "idol_js.js");
    this.ignoreIdolJs = ignoreIdolJs;
  }

  _createClass(BuildEnv, [{
    key: "buildModule",
    value: function buildModule(module) {
      return new ModuleBuildEnv(this, module.moduleName).writeModule(module);
    }
  }, {
    key: "finalize",
    value: function finalize(outputDir) {
      this.finalizeIdolFile(outputDir);
      recursiveCopy(this.buildDir, outputDir);
    }
  }, {
    key: "finalizeIdolFile",
    value: function finalizeIdolFile(outputDir) {
      _fs["default"].existsSync(outputDir) || mkdirP(outputDir);

      if (!this.ignoreIdolJs) {
        var content = _fs["default"].readFileSync(require.resolve('./__idol__'));

        _fs["default"].writeFileSync(_path["default"].join(outputDir, '__idol__.js'), content);
      }
    }
  }]);

  return BuildEnv;
}();

var ModuleBuildEnv =
/*#__PURE__*/
function () {
  function ModuleBuildEnv(buildEnv, moduleName) {
    _classCallCheck(this, ModuleBuildEnv);

    this.buildEnv = buildEnv;
    this.moduleName = moduleName;
    this.moduleNameParts = moduleName.split(".");
    this.indentionLevel = 0;
  }

  _createClass(ModuleBuildEnv, [{
    key: "writeModule",
    value: function writeModule(module) {
      var moduleFilePath = _path["default"].join(this.buildEnv.buildDir, ModuleBuildEnv.modulePathOf(module));

      var moduleDir = _path["default"].dirname(moduleFilePath);

      _fs["default"].existsSync(moduleDir) || mkdirP(moduleDir);
      var lines = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.genModule(module)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var line = _step.value;
          lines.push(ModuleBuildEnv.INDENTIONS[this.indentionLevel] + line);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      _fs["default"].writeFileSync(moduleFilePath, lines.join("\n"));
    }
  }, {
    key: "genModule",
    value:
    /*#__PURE__*/
    regeneratorRuntime.mark(function genModule(module) {
      var _this = this;

      var self, seenModules, i, type_name, type;
      return regeneratorRuntime.wrap(function genModule$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              self = this;
              _context2.next = 3;
              return "import {";

            case 3:
              return _context2.delegateYield(this.withIndention(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee() {
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        return _context.delegateYield(['Enum', 'Struct', 'List', 'Map', 'Literal', 'Primitive'].map(function (s) {
                          return "".concat(s, " as ").concat(s, "_,");
                        }), "t0", 1);

                      case 1:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee);
              })), "t0", 4);

            case 4:
              _context2.next = 6;
              return "} from ".concat(this.importPathOf("__idol__"));

            case 6:
              seenModules = {};
              return _context2.delegateYield(module.dependencies.filter(function (dep) {
                if (seenModules[dep.to.module_name]) return false;
                seenModules[dep.to.module_name] = true;
                return dep.to.module_name !== module.moduleName;
              }).map(function (dep) {
                return "import * as ".concat(_this.importedModuleNameOf(dep.to.module_name), " from ").concat(_this.importPathOf(dep.to.module_name));
              }), "t1", 8);

            case 8:
              _context2.next = 10;
              return "// DO NOT EDIT THIS FILE";

            case 10:
              _context2.next = 12;
              return "// This file is generated via idol_js.js.  You can either subclass these types";

            case 12:
              _context2.next = 14;
              return "// in your own module file or update the relevant model.toml file and regenerate.";

            case 14:
              i = 0;

            case 15:
              if (!(i < module.typesDependencyOrdering.length)) {
                _context2.next = 46;
                break;
              }

              _context2.next = 18;
              return "";

            case 18:
              type_name = module.typesDependencyOrdering[i];
              type = module.typesByName[type_name];

              if (!type.isA) {
                _context2.next = 36;
                break;
              }

              _context2.t2 = type.isA.structKind;
              _context2.next = _context2.t2 === _schema.StructKind.SCALAR ? 24 : _context2.t2 === _schema.StructKind.REPEATED ? 30 : _context2.t2 === _schema.StructKind.MAP ? 32 : 34;
              break;

            case 24:
              if (!type.isA.literal) {
                _context2.next = 28;
                break;
              }

              return _context2.delegateYield(this.genLiteral(module, type), "t3", 26);

            case 26:
              _context2.next = 29;
              break;

            case 28:
              return _context2.delegateYield(this.genPrimitive(module, type), "t4", 29);

            case 29:
              return _context2.abrupt("break", 34);

            case 30:
              return _context2.delegateYield(this.genRepeated(module, type), "t5", 31);

            case 31:
              return _context2.abrupt("break", 34);

            case 32:
              return _context2.delegateYield(this.genMapped(module, type), "t6", 33);

            case 33:
              return _context2.abrupt("break", 34);

            case 34:
              _context2.next = 41;
              break;

            case 36:
              if (!(type.options.length > 0)) {
                _context2.next = 40;
                break;
              }

              return _context2.delegateYield(this.genEnum(module, type), "t7", 38);

            case 38:
              _context2.next = 41;
              break;

            case 40:
              return _context2.delegateYield(this.genStruct(module, type), "t8", 41);

            case 41:
              _context2.next = 43;
              return "".concat(type.named.typeName, ".metadata = ").concat(JSON.stringify(sortObj(type)), ";");

            case 43:
              ++i;
              _context2.next = 15;
              break;

            case 46:
              _context2.next = 48;
              return "";

            case 48:
            case "end":
              return _context2.stop();
          }
        }
      }, genModule, this);
    })
  }, {
    key: "genLiteral",
    value:
    /*#__PURE__*/
    regeneratorRuntime.mark(function genLiteral(module, type) {
      return regeneratorRuntime.wrap(function genLiteral$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return "export function ".concat(type.named.typeName, "(val) {");

            case 2:
              return _context4.delegateYield(this.withIndention(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee2() {
                return regeneratorRuntime.wrap(function _callee2$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return "".concat(type.named.typeName, ".literal");

                      case 2:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee2);
              })), "t0", 3);

            case 3:
              _context4.next = 5;
              return "}";

            case 5:
              _context4.next = 7;
              return "";

            case 7:
              _context4.t1 = type.isA.primitiveType;
              _context4.next = _context4.t1 === _schema.PrimitiveType.BOOL ? 10 : _context4.t1 === _schema.PrimitiveType.DOUBLE ? 13 : _context4.t1 === _schema.PrimitiveType.INT ? 16 : _context4.t1 === _schema.PrimitiveType.STRING ? 19 : 22;
              break;

            case 10:
              _context4.next = 12;
              return "".concat(type.named.typeName, ".literal = ").concat(JSON.stringify(type.isA.literal.bool), ";");

            case 12:
              return _context4.abrupt("break", 22);

            case 13:
              _context4.next = 15;
              return "".concat(type.named.typeName, ".literal = ").concat(JSON.stringify(type.isA.literal["double"]), ";");

            case 15:
              return _context4.abrupt("break", 22);

            case 16:
              _context4.next = 18;
              return "".concat(type.named.typeName, ".literal = ").concat(JSON.stringify(type.isA.literal["int"]), ";");

            case 18:
              return _context4.abrupt("break", 22);

            case 19:
              _context4.next = 21;
              return "".concat(type.named.typeName, ".literal = ").concat(JSON.stringify(type.isA.literal.string), ";");

            case 21:
              return _context4.abrupt("break", 22);

            case 22:
              _context4.next = 24;
              return "Literal_(".concat(type.named.typeName, ");");

            case 24:
            case "end":
              return _context4.stop();
          }
        }
      }, genLiteral, this);
    })
  }, {
    key: "genPrimitive",
    value:
    /*#__PURE__*/
    regeneratorRuntime.mark(function genPrimitive(module, type) {
      return regeneratorRuntime.wrap(function genPrimitive$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return "export function ".concat(type.named.typeName, "(val) {");

            case 2:
              return _context6.delegateYield(this.withIndention(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee3() {
                return regeneratorRuntime.wrap(function _callee3$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        _context5.next = 2;
                        return "return val;";

                      case 2:
                      case "end":
                        return _context5.stop();
                    }
                  }
                }, _callee3);
              })), "t0", 3);

            case 3:
              _context6.next = 5;
              return "}";

            case 5:
              _context6.next = 7;
              return "Primitive_(".concat(type.named.typeName, ", ").concat(JSON.stringify(type.isA.primitiveType), ");");

            case 7:
            case "end":
              return _context6.stop();
          }
        }
      }, genPrimitive, this);
    })
  }, {
    key: "genRepeated",
    value:
    /*#__PURE__*/
    regeneratorRuntime.mark(function genRepeated(module, type) {
      return regeneratorRuntime.wrap(function genRepeated$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return "export function ".concat(type.named.typeName, "(val) {");

            case 2:
              return _context8.delegateYield(this.withIndention(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee4() {
                return regeneratorRuntime.wrap(function _callee4$(_context7) {
                  while (1) {
                    switch (_context7.prev = _context7.next) {
                      case 0:
                        _context7.next = 2;
                        return "return ".concat(type.named.typeName, ".wrap.apply(this, arguments);");

                      case 2:
                      case "end":
                        return _context7.stop();
                    }
                  }
                }, _callee4);
              })), "t0", 3);

            case 3:
              _context8.next = 5;
              return "}";

            case 5:
              _context8.next = 7;
              return "";

            case 7:
              _context8.next = 9;
              return "List_(".concat(type.named.typeName, ", ").concat(this.typeStructScalarFunc(type.isA), ");");

            case 9:
            case "end":
              return _context8.stop();
          }
        }
      }, genRepeated, this);
    })
  }, {
    key: "genMapped",
    value:
    /*#__PURE__*/
    regeneratorRuntime.mark(function genMapped(module, type) {
      return regeneratorRuntime.wrap(function genMapped$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              _context10.next = 2;
              return "export function ".concat(type.named.typeName, "(val) {");

            case 2:
              return _context10.delegateYield(this.withIndention(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee5() {
                return regeneratorRuntime.wrap(function _callee5$(_context9) {
                  while (1) {
                    switch (_context9.prev = _context9.next) {
                      case 0:
                        _context9.next = 2;
                        return "return ".concat(type.named.typeName, ".wrap.apply(this, arguments);");

                      case 2:
                      case "end":
                        return _context9.stop();
                    }
                  }
                }, _callee5);
              })), "t0", 3);

            case 3:
              _context10.next = 5;
              return "}";

            case 5:
              _context10.next = 7;
              return "";

            case 7:
              _context10.next = 9;
              return "Map_(".concat(type.named.typeName, ", ").concat(this.typeStructScalarFunc(type.isA), ");");

            case 9:
            case "end":
              return _context10.stop();
          }
        }
      }, genMapped, this);
    })
  }, {
    key: "genEnum",
    value:
    /*#__PURE__*/
    regeneratorRuntime.mark(function genEnum(module, type) {
      var options;
      return regeneratorRuntime.wrap(function genEnum$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              _context12.next = 2;
              return "export function ".concat(type.named.typeName, "(val) {");

            case 2:
              return _context12.delegateYield(this.withIndention(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee6() {
                return regeneratorRuntime.wrap(function _callee6$(_context11) {
                  while (1) {
                    switch (_context11.prev = _context11.next) {
                      case 0:
                        _context11.next = 2;
                        return "return val;";

                      case 2:
                      case "end":
                        return _context11.stop();
                    }
                  }
                }, _callee6);
              })), "t0", 3);

            case 3:
              _context12.next = 5;
              return "}";

            case 5:
              _context12.next = 7;
              return "";

            case 7:
              options = type.options.slice();
              options.sort();
              return _context12.delegateYield(options.map(function (option) {
                return "".concat(type.named.typeName, ".").concat(option.toUpperCase(), " = ").concat(JSON.stringify(option), ";");
              }), "t1", 10);

            case 10:
              _context12.next = 12;
              return "".concat(type.named.typeName, ".default = ").concat(type.named.typeName, ".").concat(type.options[0].toUpperCase(), ";");

            case 12:
              _context12.next = 14;
              return "Enum_(".concat(type.named.typeName, ", ").concat(JSON.stringify(type.options), ");");

            case 14:
            case "end":
              return _context12.stop();
          }
        }
      }, genEnum, this);
    })
  }, {
    key: "genStruct",
    value:
    /*#__PURE__*/
    regeneratorRuntime.mark(function genStruct(module, type) {
      var fieldNames, self;
      return regeneratorRuntime.wrap(function genStruct$(_context15) {
        while (1) {
          switch (_context15.prev = _context15.next) {
            case 0:
              fieldNames = Object.keys(type.fields);
              fieldNames.sort();
              self = this;
              _context15.next = 5;
              return "export function ".concat(type.named.typeName, "(val) {");

            case 5:
              return _context15.delegateYield(this.withIndention(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee7() {
                return regeneratorRuntime.wrap(function _callee7$(_context13) {
                  while (1) {
                    switch (_context13.prev = _context13.next) {
                      case 0:
                        _context13.next = 2;
                        return "return ".concat(type.named.typeName, ".wrap.apply(this, arguments)");

                      case 2:
                      case "end":
                        return _context13.stop();
                    }
                  }
                }, _callee7);
              })), "t0", 6);

            case 6:
              _context15.next = 8;
              return "}";

            case 8:
              _context15.next = 10;
              return "";

            case 10:
              _context15.next = 12;
              return "Struct_(".concat(type.named.typeName, ", [");

            case 12:
              return _context15.delegateYield(this.withIndention(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee8() {
                var i, fieldName, cameled, field, func;
                return regeneratorRuntime.wrap(function _callee8$(_context14) {
                  while (1) {
                    switch (_context14.prev = _context14.next) {
                      case 0:
                        i = 0;

                      case 1:
                        if (!(i < fieldNames.length)) {
                          _context14.next = 11;
                          break;
                        }

                        fieldName = fieldNames[i];
                        cameled = camelCase(fieldName);
                        field = type.fields[fieldName];
                        func = self.typeStructFunc(field.typeStruct);
                        _context14.next = 8;
                        return "[".concat(JSON.stringify(cameled), ", ").concat(JSON.stringify(fieldName), ", ").concat(func, "],");

                      case 8:
                        ++i;
                        _context14.next = 1;
                        break;

                      case 11:
                      case "end":
                        return _context14.stop();
                    }
                  }
                }, _callee8);
              })), "t1", 13);

            case 13:
              _context15.next = 15;
              return "]);";

            case 15:
              _context15.next = 17;
              return "";

            case 17:
            case "end":
              return _context15.stop();
          }
        }
      }, genStruct, this);
    })
  }, {
    key: "withIndention",
    value:
    /*#__PURE__*/
    regeneratorRuntime.mark(function withIndention(f) {
      return regeneratorRuntime.wrap(function withIndention$(_context16) {
        while (1) {
          switch (_context16.prev = _context16.next) {
            case 0:
              this.indentionLevel += 1;
              return _context16.delegateYield(f(), "t0", 2);

            case 2:
              this.indentionLevel -= 1;

            case 3:
            case "end":
              return _context16.stop();
          }
        }
      }, withIndention, this);
    })
  }, {
    key: "typeStructScalarFunc",
    value: function typeStructScalarFunc(typeStruct) {
      if (typeStruct.reference.moduleName) {
        var reference = typeStruct.reference;

        if (reference.moduleName === this.moduleName) {
          return reference.typeName;
        }

        return "".concat(this.importedModuleNameOf(reference.moduleName), ".").concat(reference.typeName);
      }

      return "Primitive_.of(".concat(JSON.stringify(typeStruct.primitiveType), ")");
    }
  }, {
    key: "typeStructFunc",
    value: function typeStructFunc(typeStruct) {
      var scalar = this.typeStructScalarFunc(typeStruct);

      switch (typeStruct.structKind) {
        case _schema.StructKind.MAP:
          return "Map_.of(".concat(scalar, ")");

        case _schema.StructKind.REPEATED:
          return "List_.of(".concat(scalar, ")");
      }

      return scalar;
    }
  }, {
    key: "importedModuleNameOf",
    value: function importedModuleNameOf(moduleName) {
      return camelCase(moduleName.replace(/\./g, "_"));
    }
  }, {
    key: "importPathOf",
    value: function importPathOf(moduleName) {
      var moduleNameParts = moduleName.split(".");
      var parts = [];
      var i = this.moduleNameParts.length - 1;

      for (; i > 0 && this.moduleNameParts.slice(0, i + 1).join("") != moduleNameParts.slice(0, i + 1).join("."); --i) {
        parts.push('..');
      }

      for (; i < moduleNameParts.length; ++i) {
        parts.push(moduleNameParts[i]);
      }

      return JSON.stringify("./" + parts.join("/"));
    }
  }], [{
    key: "modulePathOf",
    value: function modulePathOf(module) {
      return module.moduleName.split(".").join("/") + ".js";
    }
  }]);

  return ModuleBuildEnv;
}();

ModuleBuildEnv.INDENTIONS = ['', '    ', '        ', '            ', '                ', '                    '];

function main() {
  var args = processArgs();
  var data;

  if (_process["default"].stdin.isTTY) {
    if (!args.input_json) {
      showHelp();
    }

    data = _fs["default"].readFileSync(args.input_json, 'utf-8');
  } else {
    data = _fs["default"].readFileSync(0, 'utf-8');
  }

  var json = JSON.parse(data);

  var modules = _idol__.Map.of(_schema.Module)(json);

  var buildEnv = new BuildEnv(args.ignoreIdolJs);

  for (var moduleName in modules) {
    var module = modules[moduleName];
    buildEnv.buildModule(module);
  }

  buildEnv.finalize(args.output);
}

function processArgs() {
  var result = {};
  var argName;

  for (var i = 2; i < _process["default"].argv.length; ++i) {
    var arg = _process["default"].argv[i];

    if (argName) {
      result[argName] = arg;
      argName = null;
      continue;
    }

    switch (arg) {
      case "-h":
      case "--help":
        showHelp();
        break;

      case "--output":
        argName = "output";
        break;

      case "--ignore-idol-js":
        result.ignoreIdolJs = true;
        break;

      default:
        if (i === _process["default"].argv.length - 1) result.input_json = arg;
    }
  }

  return result;
}

function showHelp() {
  console.error("Usage:", _process["default"].argv[1], "--output <output> <input_json>");
  console.error("");
  console.error("Options:");
  console.error(" -h --help:  Show this help");
  console.error("  --output: the output directory for the generated js files");
  console.error("");

  _process["default"].exit(1);
} // Required to create deterministic serialization of metadata


function sortObj(obj) {
  return obj === null || _typeof(obj) !== 'object' ? obj : Array.isArray(obj) ? obj.map(sortObj) : Object.assign.apply(Object, [{}].concat(_toConsumableArray(Object.entries(obj).sort(function (_ref, _ref2) {
    var _ref3 = _slicedToArray(_ref, 1),
        keyA = _ref3[0];

    var _ref4 = _slicedToArray(_ref2, 1),
        keyB = _ref4[0];

    return keyA.localeCompare(keyB);
  }).map(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2),
        k = _ref6[0],
        v = _ref6[1];

    return _defineProperty({}, k, sortObj(v));
  }))));
}

function recursiveCopy(src, dest) {
  if (_fs["default"].lstatSync(src).isDirectory()) {
    if (!_fs["default"].lstatSync(dest).isDirectory()) {
      mkdirP(dest);
    }

    _fs["default"].readdirSync(src).forEach(function (file) {
      recursiveCopy(_path["default"].join(src, file), _path["default"].join(dest, file));
    });
  } else {
    _fs["default"].copyFileSync(src, dest);
  }
}

function camelCase(s) {
  return s.replace(/([-_][a-z])/ig, function (v) {
    return v.toUpperCase().replace('_', '');
  });
}

function mkdirP(p) {
  if (_fs["default"].existsSync(p)) return;

  var parent = _path["default"].dirname(p);

  if (!_fs["default"].existsSync(parent)) {
    mkdirP(parent);
  }

  _fs["default"].mkdirSync(p);
}

main();