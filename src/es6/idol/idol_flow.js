#! /usr/bin/env node
// @flow

import { start } from "./cli";
import {
  build,
  GeneratorAcc,
  GeneratorConfig,
  GeneratorFileContext,
  getMaterialTypeDeconstructor,
  importExpr,
  includesTag,
  Path,
  ScalarDeconstructor,
  TypeDeconstructor,
  TypeStructDeconstructor,
  wrapExpression
} from "./generators";
import type { Exported, Expression, GeneratorContext } from "./generators";
import { Type } from "./js/schema/Type";
import { Alt, cachedProperty, OrderedObj } from "./functional";
import { Reference } from "./js/schema/Reference";
import * as scripter from "./scripter";
import { PrimitiveType } from "./js/schema/PrimitiveType";

type AM = "b" | "c";
const A: { [k: string]: AM } = {
  A: "b",
  C: "c"
};

export class IdolFlow implements GeneratorContext {
  config: GeneratorConfig;
  state: GeneratorAcc;
  codegenImpl: (IdolFlow, Path, Type) => IdolFlowCodegenFile;
  scaffoldImpl: (IdolFlow, Path, Type) => IdolFlowScaffoldFile;

  constructor(
    config: GeneratorConfig,
    codegenImpl: (IdolFlow, Path, Type) => IdolFlowCodegenFile = (idolFlow, path, type) =>
      new IdolFlowCodegenFile(idolFlow, path, type),
    scaffoldImpl: (IdolFlow, Path, Type) => IdolFlowScaffoldFile = (idolFlow, path, type) =>
      new IdolFlowScaffoldFile(idolFlow, path, type)
  ) {
    this.state = new GeneratorAcc();
    this.config = config;
    this.codegenImpl = codegenImpl;
    this.scaffoldImpl = scaffoldImpl;
  }

  codegenFile(ref: Reference): IdolFlowCodegenFile {
    const path = this.state.reservePath(this.config.pathsOf({ codegen: ref }));
    const type = this.config.params.allTypes.obj[ref.qualified_name];

    return cachedProperty(this, `codegenFile${path.path}`, () =>
      this.codegenImpl(this, path, type)
    );
  }

  scaffoldFile(ref: Reference): IdolFlowScaffoldFile {
    const path = this.state.reservePath(this.config.pathsOf({ scaffold: ref }));
    const type = this.config.params.allTypes.obj[ref.qualified_name];

    return cachedProperty(this, `scaffoldFile${path.path}`, () =>
      this.scaffoldImpl(this, path, type)
    );
  }

  render(): OrderedObj<string> {
    const scaffoldTypes = this.config.params.scaffoldTypes.values();
    scaffoldTypes.forEach((t, i) => {
      const scaffoldFile = this.scaffoldFile(t.named);
      if (!scaffoldFile.declaredType.isEmpty()) {
        // Also add the declared enum
        scaffoldFile.declaredEnum;
        scaffoldFile.declaredFactory;

        console.log(
          `Generated ${scaffoldFile.defaultTypeName} (${i + 1} / ${scaffoldTypes.length})`
        );
      } else {
        console.log(`Skipped ${scaffoldFile.defaultTypeName} (${i + 1} / ${scaffoldTypes.length})`);
      }
    });

    return this.state.render({
      codegen:
        " @flow\nDO NOT EDIT\nThis file was generated by idol_flow, any changes will be overwritten when idol_flow is run again.",
      scaffold:
        " @flow\nThis file was scaffolded by idol_flow.  Feel free to edit as you please.  It can be regenerated by deleting the file and rerunning idol_flow."
    });
  }
}

export class IdolFlowCodegenFile extends GeneratorFileContext<IdolFlow> {
  typeDecon: TypeDeconstructor;
  inputTypeVariant: boolean;

  constructor(idolFlow: IdolFlow, path: Path, type: Type) {
    super(idolFlow, path);
    this.typeDecon = new TypeDeconstructor(type);

    this.reserveIdent(this.defaultTypeName);
    this.reserveIdent(this.defaultEnumName);
    this.reserveIdent(this.defaultFactoryName);
  }

  get defaultTypeName(): string {
    return this.typeDecon.t.named.asQualifiedIdent + "Payload";
  }

  get defaultEnumName(): string {
    return this.typeDecon.t.named.asQualifiedIdent;
  }

  get defaultFactoryName(): string {
    return this.typeDecon.t.named.asQualifiedIdent + "Factory";
  }

  get declaredType(): Alt<Exported> {
    return cachedProperty(this, "declaredType", () =>
      this.enum.bind(e => e.declaredType).either(this.typeStruct.bind(ts => ts.declaredType)).either(this.struct.bind(struct => struct.declaredType))
    );
  }

  get declaredEnum(): Alt<Exported> {
    return cachedProperty(this, "declaredEnum", () => this.enum.bind(e => e.declaredEnum));
  }

  get declaredFactory(): Alt<Exported> {
    return cachedProperty(this, "declaredFactory", () =>
      this.enum.bind(e => e.declaredFactory).either(this.typeStruct.bind(ts => ts.declaredFactory)).either(this.struct.bind(struct => struct.declaredFactory))
    );
  }

  get declaredFactoryTyping(): Alt<Expression> {
    return cachedProperty(this, "declaredFactoryTyping", () =>
      this.declaredType.map(declaredType => (state: GeneratorAcc, path: Path) =>
        `() => ${state.importIdent(path, declaredType)}`
      )
    );
  }

  get enum(): Alt<IdolFlowCodegenEnum> {
    return cachedProperty(this, "enum", () =>
      this.typeDecon.getEnum().map(options => new IdolFlowCodegenEnum(this, options))
    );
  }

  get typeStruct(): Alt<IdolFlowCodegenTypeStructDecalaration> {
    return cachedProperty(this, "typeStruct", () =>
      this.typeDecon
        .getTypeStruct()
        .map(tsDecon => new IdolFlowCodegenTypeStructDecalaration(this, tsDecon))
    );
  }

  get struct(): Alt<IdolFlowCodegenStruct> {
    return cachedProperty(this, "struct", () =>
        this.typeDecon
            .getStruct()
            .map(fields => new IdolFlowCodegenStruct(this, fields.map(tsDecon => new IdolFlowCodegenTypestruct(this.parent, tsDecon))))
    );
  }
}

export class IdolFlowCodegenEnum extends GeneratorFileContext<IdolFlow> {
  options: string[];
  codegenFile: IdolFlowCodegenFile;

  constructor(codegenFile: IdolFlowCodegenFile, options: string[]) {
    super(codegenFile.parent, codegenFile.path);
    this.codegenFile = codegenFile;
    this.options = options;
  }

  get declaredType(): Alt<Exported> {
    return cachedProperty(this, "declaredType", () =>
      Alt.lift(
        this.export(
          this.codegenFile.defaultTypeName,
          scripter.variable(scripter.typeSum(...this.options.map(scripter.literal)), "type"),
          true
        )
      )
    );
  }

  get declaredEnum(): Alt<Exported> {
    return cachedProperty(this, "declaredEnum", () =>
      this.declaredType.map(declaredType =>
        this.export(
          this.codegenFile.defaultEnumName,
          scripter.variable(
            scripter.objLiteral(
              ...this.options.map(option =>
                scripter.propDec(option.toUpperCase(), scripter.literal(option))
              )
            ),
            "const",
            true,
            `{ [k: string]: ${this.importIdent(declaredType)} }`
          )
        )
      )
    );
  }

  get declaredFactory(): Alt<Exported> {
    return cachedProperty(this, "declaredFactory", () =>
      this.codegenFile.declaredFactoryTyping.map(factoryTyping =>
        this.export(
          this.codegenFile.defaultFactoryName,
          scripter.variable(
            scripter.arrowFunc([], scripter.literal(this.options[0])),
            "const",
            true,
            this.applyExpr(factoryTyping)
          )
        )
      )
    );
  }
}

export class IdolFlowCodegenStruct extends GeneratorFileContext<IdolFlow> {
  fields: OrderedObj<IdolFlowCodegenTypestruct>;
  codegenFile: IdolFlowCodegenFile;

  constructor(codegenFile: IdolFlowCodegenFile, fields: OrderedObj<IdolFlowCodegenTypestruct>) {
    super(codegenFile.parent, codegenFile.path);
    this.codegenFile = codegenFile;
    this.fields = fields;
  }


  get declaredType(): Alt<Exported> {
    return cachedProperty(this, "declaredType", () => {
      const fieldExprs = this.fields.mapAndFilter(f => f.typeExpr);

      return Alt.lift(
          this.export(
              this.codegenFile.defaultTypeName,
              scripter.iface(true, null, ...fieldExprs.keys().map(fieldName => scripter.propDec(fieldName, this.applyExpr(fieldExprs.obj[fieldName])))),
              true
          )
      );
    });
  }

  get declaredFactory(): Alt<Exported> {
    return cachedProperty(this, "declaredFactory", () => {
      const fieldExprs = this.fields.mapAndFilter(f => f.factoryExpr);

      return this.codegenFile.declaredFactoryTyping.map(factoryTyping =>
          this.export(
              this.codegenFile.defaultFactoryName,
              scripter.variable(
                  scripter.arrowFunc([], scripter.objLiteral(
                      ...fieldExprs.keys().map(fieldName => scripter.propDec(fieldName, scripter.invocation(this.applyExpr(fieldExprs.obj[fieldName])))
                  ))),
                  "const",
                  true,
                  this.applyExpr(factoryTyping)
              )
          )
      );
    });
  }
}


export class IdolFlowCodegenTypestruct implements GeneratorContext {
  tsDecon: TypeStructDeconstructor;
  state: GeneratorAcc;
  config: GeneratorConfig;
  idolFlow: IdolFlow;

  constructor(idolFlow: IdolFlow, tsDecon: TypeStructDeconstructor) {
    this.tsDecon = tsDecon;
    this.state = idolFlow.state;
    this.config = idolFlow.config;
    this.idolFlow = idolFlow;
  }

  get innerScalar(): Alt<IdolFlowCodegenScalar> {
    return cachedProperty(this, "innerScalar", () => {
      return this.tsDecon
        .getScalar()
        .concat(this.tsDecon.getMap())
        .concat(this.tsDecon.getRepeated())
        .map(scalarDecon => new IdolFlowCodegenScalar(this.idolFlow, scalarDecon));
    });
  }

  get typeExpr(): Alt<Expression> {
    return this.innerScalar.bind(innerScalar =>
      this.tsDecon
        .getScalar()
        .bind(_ => innerScalar.typeExpr)
        .either(
          this.tsDecon
            .getRepeated()
            .bind(_ => innerScalar.typeExpr)
            .map(expr => wrapExpression(expr, s => `Array<${s}>`))
        )
        .either(
          this.tsDecon
            .getMap()
            .bind(_ => innerScalar.typeExpr)
            .map(expr => wrapExpression(expr, s => `{ [k: string]: ${s} }`))
        )
        .map(expr =>
          includesTag(this.tsDecon.context.fieldTags, "optional")
            ? wrapExpression(expr, s => `${s} | null | typeof undefined`)
            : expr
        )
    );
  }

  get factoryExpr(): Alt<Expression> {
    if (includesTag(this.tsDecon.context.fieldTags, "optional")) {
      return Alt.lift(() => scripter.arrowFunc([], scripter.literal(null)));
    }

    return this.tsDecon
      .getScalar()
      .bind(_ => this.innerScalar)
      .bind(innerScalar => innerScalar.factoryExpr)
      .either(this.tsDecon.getMap().map(_ => () => scripter.arrowFunc([], scripter.literal({}))))
      .either(
        this.tsDecon.getRepeated().map(_ => () => scripter.arrowFunc([], scripter.literal([])))
      );
  }
}

export class IdolFlowCodegenTypeStructDecalaration extends IdolFlowCodegenTypestruct {
  codegenFile: IdolFlowCodegenFile;

  constructor(codegenFile: IdolFlowCodegenFile, tsDecon: TypeStructDeconstructor) {
    super(codegenFile.parent, tsDecon);
    this.codegenFile = codegenFile;
  }

  get path(): Path {
    return this.codegenFile.path;
  }

  get export() {
    return GeneratorFileContext.prototype.export;
  }

  get applyExpr() {
    return GeneratorFileContext.prototype.applyExpr;
  }

  get declaredType(): Alt<Exported> {
    return cachedProperty(this, "declaredType", () =>
      this.typeExpr.map(typeExpr =>
        this.export(
          this.codegenFile.defaultTypeName,
          scripter.variable(this.applyExpr(typeExpr), "type"),
          true
        )
      )
    );
  }

  get declaredFactory(): Alt<Exported> {
    return cachedProperty(this, "declaredFactory", () =>
      this.factoryExpr.map(factoryExpr =>
        this.export(
          this.codegenFile.defaultFactoryName,
          scripter.variable(this.applyExpr(factoryExpr), "type"),
          true
        )
      )
    );
  }
}

export class IdolFlowCodegenScalar implements GeneratorContext {
  scalarDecon: ScalarDeconstructor;
  state: GeneratorAcc;
  config: GeneratorConfig;
  idolFlow: IdolFlow;
  aliasScaffoldFile: Alt<IdolFlowScaffoldFile>;
  aliasCodegenFile: Alt<IdolFlowCodegenFile>;

  constructor(idolFlow: IdolFlow, scalarDecon: ScalarDeconstructor) {
    this.scalarDecon = scalarDecon;
    this.state = idolFlow.state;
    this.config = idolFlow.config;
    this.idolFlow = idolFlow;

    this.aliasScaffoldFile = this.scalarDecon
      .getAlias()
      .filter(ref => ref.qualified_name in this.config.params.scaffoldTypes.obj)
      .map(ref => this.idolFlow.scaffoldFile(ref));
    this.aliasCodegenFile = this.scalarDecon.getAlias().map(ref => this.idolFlow.codegenFile(ref));
  }

  get typeExpr(): Alt<Expression> {
    return this.referenceImportType.either(this.primType).either(this.literalType);
  }

  get factoryExpr(): Alt<Expression> {
    return this.referenceImportFactory.either(this.primFactory).either(this.literalFactory);
  }

  get referenceImportType(): Alt<Expression> {
    if (this.aliasScaffoldFile.isEmpty()) {
      return this.aliasCodegenFile
        .bind(codegenFile => codegenFile.declaredType)
        .map(codegenType => importExpr(codegenType, "Codegen" + codegenType.ident));
    }

    return this.aliasScaffoldFile
      .bind(scaffoldFile => scaffoldFile.declaredType)
      .map(scaffoldType => importExpr(scaffoldType, "Scaffold" + scaffoldType.ident));
  }

  get referenceImportFactory(): Alt<Expression> {
    if (this.aliasScaffoldFile.isEmpty()) {
      return this.aliasCodegenFile
        .bind(codegenFile => codegenFile.declaredFactory)
        .map(codegenFactory => importExpr(codegenFactory, "Codegen" + codegenFactory.ident));
    }

    return this.aliasScaffoldFile
      .bind(scaffoldFile => scaffoldFile.declaredFactory)
      .map(scaffoldFactory => importExpr(scaffoldFactory, "Scaffold" + scaffoldFactory.ident));
  }

  get primType(): Alt<Expression> {
    return this.scalarDecon.getPrimitive().map(prim => () => {
      switch (prim) {
        case PrimitiveType.STRING:
          return "string";
        case PrimitiveType.INT:
        case PrimitiveType.DOUBLE:
          return "number";
        case PrimitiveType.BOOL:
          return "boolean";
      }

      return "any";
    });
  }

  get literalType(): Alt<Expression> {
    return this.scalarDecon.getLiteral().map((_, val) => () => scripter.literal(val));
  }

  get primFactory(): Alt<Expression> {
    return this.scalarDecon
      .getPrimitive()
      .map(prim => {
        switch (prim) {
          case PrimitiveType.STRING:
            return scripter.literal("");
          case PrimitiveType.INT:
            return scripter.literal(0);
          case PrimitiveType.DOUBLE:
            return scripter.literal(0);
          case PrimitiveType.BOOL:
            return scripter.literal(false);
        }

        return scripter.literal({});
      })
      .map(val => () => scripter.arrowFunc([], val));
  }

  get literalFactory(): Alt<Expression> {
    return this.scalarDecon
      .getLiteral()
      .map((_, val) => () => scripter.arrowFunc([], scripter.literal(val)));
  }
}

export class IdolFlowScaffoldFile extends GeneratorFileContext<IdolFlow> {
  typeDecon: TypeDeconstructor;
  type: Type;
  inputTypeVariant: boolean;
  codegenFile: IdolFlowCodegenFile;

  constructor(idolFlow: IdolFlow, path: Path, type: Type) {
    super(idolFlow, path);
    this.typeDecon = getMaterialTypeDeconstructor(idolFlow.config.params.allTypes, type);
    this.type = type;

    this.codegenFile = idolFlow.codegenFile(this.typeDecon.t.named);

    this.reserveIdent(this.defaultTypeName);
    this.reserveIdent(this.defaultEnumName);
    this.reserveIdent(this.defaultFactoryName);
  }

  get defaultTypeName(): string {
    return this.type.named.typeName + "Payload";
  }

  get defaultEnumName(): string {
    return this.type.named.typeName;
  }

  get defaultFactoryName(): string {
    return this.type.named.typeName + "Factory";
  }

  get declaredType(): Alt<Exported> {
    return cachedProperty(this, "declaredType", () =>
      this.codegenFile.declaredType.bind(codegenType => {
        const codegenTypeIdent = this.importIdent(codegenType);
        let scriptable: (string) => string = scripter.variable(codegenTypeIdent, "type", true);

        if (!this.typeDecon.getStruct().isEmpty()) {
          scriptable = scripter.iface(true, codegenTypeIdent);
        }

        return Alt.lift(
          this.export(
            this.defaultTypeName,
            scriptable,
            true
          )
        );
      })
    );
  }

  get declaredEnum(): Alt<Exported> {
    return cachedProperty(this, "declaredEnum", () =>
      this.codegenFile.declaredEnum.map(codegenEnum =>
        this.export(this.defaultEnumName, scripter.variable(this.importIdent(codegenEnum)))
      )
    );
  }

  get declaredFactoryTyping(): Alt<Expression> {
    return cachedProperty(this, "declaredFactoryTyping", () =>
      this.declaredType.map(declaredType => (state: GeneratorAcc, path: Path) =>
        `() => ${state.importIdent(path, declaredType)}`
      )
    );
  }

  get declaredFactory(): Alt<Exported> {
    return cachedProperty(this, "declaredFactory", () =>
      this.codegenFile.declaredFactory.bind(codegenFactory =>
        this.declaredFactoryTyping.map(factoryTyping =>
          this.export(
            this.defaultFactoryName,
            scripter.variable(
              this.importIdent(codegenFactory),
              "const",
              true,
              this.applyExpr(factoryTyping)
            )
          )
        )
      )
    );
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

  const idolFlow = new IdolFlow(config);
  const moveTo = build(config, idolFlow.render());
  moveTo(params.outputDir);
}

if (require.main === module) {
  main();
}
