#! /usr/bin/env node
// @flow
import { start } from "./cli";
import {
  build,
  ExternFileContext,
  GeneratorAcc,
  GeneratorConfig,
  GeneratorFileContext,
  getMaterialTypeDeconstructor,
  getTagValue,
  getTagValues,
  includesTag,
  Path,
  TypeDeconstructor
} from "./generators";
import type { Exported } from "./generators";
import { Type } from "./js/schema/Type";
import { IdolGraphql } from "./idol_graphql";
import { Reference } from "./js/schema/Reference";
import { Alt, cachedProperty, OrderedObj } from "./functional";
import * as scripter from "./scripter";
import { resolve } from "path";

export class IdolJSHttpCodegenFile extends GeneratorFileContext<IdolJsHttp> {
  typeDecon: TypeDeconstructor;
  type: Type;

  constructor(idolJsHttp: IdolJsHttp, path: Path, type: Type) {
    super(idolJsHttp, path);
    this.typeDecon = new TypeDeconstructor(type);
    this.type = type;

    this.reserveIdent(this.defaultServiceName);
  }

  get service(): Alt<Exported> {
    return cachedProperty(this, "service", () =>
      this.typeDecon
        .getStruct()
        .filter(_ => includesTag(this.type.tags, "service"))
        .map(fields => {
          const methods = fields.mapAndFilter(field =>
            field
              .getScalar()
              .bind(s => s.getAlias())
              .bind(ref => this.methodFor(ref).methodConfiguration)
          );
          return this.export(
            this.defaultServiceName,
            scripter.classDec(
              [
                ...methods.mapIntoIterable((methodName, methodConfig) => {
                  return scripter.methodDec(
                    methodName,
                    ["args"],
                    [
                      scripter.ret(
                        scripter.invocation(
                          scripter.propAccess("this", "_invoke"),
                          scripter.literal(methodConfig),
                          "args"
                        )
                      )
                    ]
                  );
                })
              ],
              this.importIdent(this.parent.serviceBaseFile.HttpServiceBase)
            )
          );
        })
    );
  }

  get defaultServiceName(): string {
    return this.type.named.asQualifiedIdent;
  }

  methodFor(ref: Reference): IdolJSHttpCodegenMethod {
    return cachedProperty(
      this,
      `methodFor${ref.qualified_name}`,
      () =>
        new this.IdolJSHttpCodegenMethod(
          this.parent,
          this.path,
          this.type.tags,
          getMaterialTypeDeconstructor(
            this.config.params.allTypes,
            this.config.params.allTypes.obj[ref.qualified_name]
          )
        )
    );
  }

  get IdolJSHttpCodegenMethod() {
    return IdolJSHttpCodegenMethod;
  }
}

export class IdolJSHttpCodegenMethod extends GeneratorFileContext<IdolJsHttp> {
  typeDecon: TypeDeconstructor;
  serviceTags: string[];

  constructor(
    idolJsHttp: IdolJsHttp,
    path: Path,
    serviceTags: string[],
    typeDecon: TypeDeconstructor
  ) {
    super(idolJsHttp, path);
    this.typeDecon = typeDecon;
    this.serviceTags = serviceTags;
  }

  get inputTypeDecon(): Alt<TypeDeconstructor> {
    return cachedProperty(this, "inputTypeDecon", () => {
      return this.typeDecon
        .getStruct()
        .bind(fields =>
          fields
            .get("input")
            .bind(input => input.getScalar().bind(s => s.getAlias()))
            .map(ref =>
              getMaterialTypeDeconstructor(
                this.config.params.allTypes,
                this.config.params.allTypes.obj[ref.qualified_name]
              )
            )
        )
        .filter(tDecon => !tDecon.getStruct().isEmpty());
    });
  }

  get methodConfiguration(): Alt<any> {
    return this.inputTypeDecon.map(inputTypeDecon => ({
      servicePath: getTagValue(this.serviceTags, "/", "path"),
      methodPath: getTagValue(this.typeDecon.t.tags, "", "path"),
      pathMappings: getTagValues(this.typeDecon.t.tags, "pathMapping"),
      method: getTagValue(this.typeDecon.t.tags, "POST", "method").toUpperCase()
    }));
  }
}

export class IdolJSHttpScaffoldFile extends GeneratorFileContext<IdolJsHttp> {
  typeDecon: TypeDeconstructor;
  type: Type;

  constructor(idolJsHttp: IdolJsHttp, path: Path, type: Type) {
    super(idolJsHttp, path);
    this.typeDecon = getMaterialTypeDeconstructor(idolJsHttp.config.params.allTypes, type);
    this.type = type;

    this.reserveIdent(this.defaultServiceName);
  }

  get defaultServiceName(): string {
    return this.type.named.typeName;
  }

  get service(): Alt<Exported> {
    return cachedProperty(this, "service", () =>
      this.parent
        .codegenFile(this.typeDecon.t.named)
        .service.map(codegenService =>
          this.export(
            this.defaultServiceName,
            scripter.classDec(
              [],
              this.importIdent(codegenService, "Codegen" + this.defaultServiceName)
            )
          )
        )
    );
  }
}

export class HttpServiceBase extends ExternFileContext<IdolJsHttp> {
  constructor(parent: IdolJsHttp, path: Path) {
    super(resolve(__dirname, "HttpServiceBase.js.flow"), parent, path);
  }

  get HttpServiceBase(): Exported {
    return this.exportExtern("HttpServiceBase");
  }
}

export class IdolJsHttp {
  config: GeneratorConfig;
  state: GeneratorAcc;
  idolGraphql: IdolGraphql;

  constructor(
      config: GeneratorConfig,
      idolGraphql: IdolGraphql = new this.IdolGraphql(config)
  ) {
    this.state = new GeneratorAcc();
    this.config = config;
    this.idolGraphql = idolGraphql;
  }

  get IdolGraphql() {
    return IdolGraphql;
  }

  get IdolJSHttpCodegenFile() {
    return IdolJSHttpCodegenFile;
  }

  get IdolJSHttpScaffoldFile() {
    return IdolJSHttpScaffoldFile;
  }

  get HttpServiceBase() {
    return HttpServiceBase;
  }

  codegenFile(ref: Reference): IdolJSHttpCodegenFile {
    const path = this.state.reservePath(this.config.pathsOf({ codegen: ref }));
    const type = this.config.params.allTypes.obj[ref.qualified_name];

    return cachedProperty(this, `codegenFile${path.path}`, () =>
        new this.IdolJSHttpCodegenFile(this, path, type)
    );
  }

  scaffoldFile(ref: Reference): IdolJSHttpScaffoldFile {
    const path = this.state.reservePath(this.config.pathsOf({ scaffold: ref }));
    const type = this.config.params.allTypes.obj[ref.qualified_name];

    return cachedProperty(this, `scaffoldFile${path.path}`, () =>
        new this.IdolJSHttpScaffoldFile(this, path, type)
    );
  }

  get serviceBaseFile(): HttpServiceBase {
    return cachedProperty(
        this,
        "serviceBaseFile",
        () => new this.HttpServiceBase(this, this.state.reservePath({ runtime: "service-base.js" }))
    );
  }

  render(): OrderedObj<string> {
    const scaffoldTypes = this.config.params.scaffoldTypes.values();
    scaffoldTypes.forEach((t, i) => {
      const scaffoldFile = this.scaffoldFile(t.named);
      if (!scaffoldFile.service.isEmpty()) {
        console.log(
            `Generated ${scaffoldFile.service.unwrap().ident} (${i + 1} / ${scaffoldTypes.length})`
        );
      } else {
        console.log(
            `Skipped ${scaffoldFile.type.named.typeName} (${i + 1} / ${scaffoldTypes.length})`
        );
      }
    });

    return this.state.render({
      codegen:
          "DO NOT EDIT\nThis file was generated by idol_js_http, any changes will be overwritten when idol_js_http is run again.",
      scaffold:
          "This file was scaffolded by idol_js_http.  Feel free to edit as you please.  It can be regenerated by deleting the file and rerunning idol_js_http."
    });
  }
}


function main() {
  const params = start({
    flags: {},
    args: {
      target: "idol module names whose contents will have extensible types scaffolded.",
      output: "a directory to generate the scaffolds and codegen into."
    }
  });

  const config = new GeneratorConfig(params);
  config.withPathMappings({
    codegen: config.inCodegenDir(GeneratorConfig.oneFilePerType),
    scaffold: GeneratorConfig.oneFilePerType
  });

  const idolJsHttp = new IdolJsHttp(config);
  const moveTo = build(config, idolJsHttp.render());
  moveTo(params.outputDir);
}

if (require.main === module) {
  main();
}
