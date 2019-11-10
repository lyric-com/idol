#! /usr/bin/env node
// @flow
import { resolve } from "path";
import * as scripter from "./scripter";
import { start } from "./cli";
import { Reference } from "./js/schema/Reference";
import { Type } from "./js/schema/Type";
import {
  build,
  GeneratorAcc,
  GeneratorConfig,
  GeneratorFileContext,
  getMaterialTypeDeconstructor,
  getTagValues,
  importExpr,
  includesTag,
  Path,
  ScalarDeconstructor,
  TypeDeconstructor,
  TypeStructDeconstructor
} from "./generators";
import type { Exported, Expression, GeneratorContext } from "./generators";
import { Alt, cachedProperty, OrderedObj } from "./functional";
import { PrimitiveType } from "./js/schema/PrimitiveType";
import { TypeStruct } from "./js/schema/TypeStruct";
import {
  IdolGraphql,
  IdolGraphqlCodegenFile,
  IdolGraphQLCodegenTypeStruct,
  IdolGraphqlCodegenTypeStructDeclaration
} from "./idol_graphql";

export class IdolGraphqlQueries {
  config: GeneratorConfig;
  state: GeneratorAcc;
  codegenImpl: (IdolGraphqlQueries, Path, Type) => IdolGraphqlQueriesCodegenFile;
  scaffoldImpl: (IdolGraphqlQueries, Path, Type) => IdolGraphqlQueriesScaffoldFile;
  idolGraphql: IdolGraphql;

  constructor(
    config: GeneratorConfig,
    codegenImpl: (IdolGraphqlQueries, Path, Type) => IdolGraphqlQueriesCodegenFile = (
      idolGraphqlQueries,
      path,
      type
    ) => new IdolGraphqlQueriesCodegenFile(idolGraphqlQueries, path, type),
    scaffoldImpl: (IdolGraphqlQueries, Path, Type) => IdolGraphqlQueriesScaffoldFile = (
      idolGraphqlQueries,
      path,
      type
    ) => new IdolGraphqlQueriesScaffoldFile(idolGraphqlQueries, path, type),
    idolGraphql: IdolGraphql = new IdolGraphql(config)
  ) {
    this.state = new GeneratorAcc();
    this.config = config;
    this.codegenImpl = codegenImpl;
    this.scaffoldImpl = scaffoldImpl;
    this.idolGraphql = idolGraphql;
  }

  codegenFile(ref: Reference): IdolGraphqlQueriesCodegenFile {
    const path = this.state.reservePath(this.config.pathsOf({ codegen: ref }));
    const type = this.config.params.allTypes.obj[ref.qualified_name];

    return cachedProperty(this, `codegenFile${path.path}`, () =>
      this.codegenImpl(this, path, type)
    );
  }

  scaffoldFile(ref: Reference): IdolGraphqlQueriesScaffoldFile {
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
      if (!scaffoldFile.declaredFragments.isEmpty()) {
        console.log(
          `Generated ${scaffoldFile.declaredFragments.unwrap().ident} (${i + 1} / ${
            scaffoldTypes.length
          })`
        );
      } else {
        console.log(
          `Skipped ${scaffoldFile.defaultFragmentName} (${i + 1} / ${scaffoldTypes.length})`
        );
      }
    });

    return this.state.render({
      codegen:
        "DO NOT EDIT\nThis file was generated by idol_graphql_queries, any changes will be overwritten when idol_graphql_queries is run again.",
      scaffold:
        "This file was scaffolded by idol_graphql_queries.  Feel free to edit as you please.  It can be regenerated by deleting the file and rerunning idol_graphql_queries."
    });
  }
}

const gql: Exported = { ident: "@@default", path: new Path("graphql-tag") };

function graphqlTag(...lines: string[]): Expression {
  return (state: GeneratorAcc, path: Path) =>
    state.importIdent(path, gql, "gql") + "`\n" + lines.join("\n") + "\n`;";
}

export class IdolGraphqlQueriesCodegenFile extends GeneratorFileContext<IdolGraphqlQueries> {
  typeDecon: TypeDeconstructor;

  constructor(idolGraphqlQueries: IdolGraphqlQueries, path: Path, type: Type) {
    super(idolGraphqlQueries, path);
    this.typeDecon = new TypeDeconstructor(type);

    this.reserveIdent(this.defaultFragmentName);
  }

  get type(): Type {
    return this.typeDecon.t;
  }

  graphqlTypeName(inputVariant: boolean): Alt<string> {
    return this.parent.idolGraphql
      .codegenFile(this.type.named, inputVariant)
      .declaredTypeIdent.map(ex => ex.graphqlTypeName);
  }

  get defaultFragmentName(): string {
    return this.type.named.asQualifiedIdent + "Fragment";
  }

  get graphqlFieldsName(): Alt<string> {
    return this.graphqlTypeName(false).map(s => s + "Fields");
  }

  get declaredFragments(): Alt<Exported> {
    return cachedProperty(this, "declaredFragments", () => {
      return this.typeStruct
        .bind(ts => ts.declaredFragment)
        .either(this.struct(false).bind(struct => struct.declaredFragments));
    });
  }

  graphqlCodegenFile(inputVariant: boolean): IdolGraphqlCodegenFile {
    return this.parent.idolGraphql.codegenFile(this.type.named, inputVariant);
  }

  struct(inputVariant: boolean): Alt<IdolGraphqlQueriesCodegenStruct> {
    return cachedProperty(this, `struct${inputVariant.toString()}`, () =>
      this.graphqlCodegenFile(inputVariant).struct.map(
        struct =>
          new IdolGraphqlQueriesCodegenStruct(
            this,
            struct.fields.map(field => new IdolGraphQLQueriesCodegenTypeStruct(this.parent, field))
          )
      )
    );
  }

  get typeStruct(): Alt<IdolGraphqlQueriesCodegenTypeStructDeclaration> {
    return cachedProperty(this, "typeStruct", () =>
      this.graphqlCodegenFile(false).typeStruct.map(
        ts => new IdolGraphqlQueriesCodegenTypeStructDeclaration(this, ts)
      )
    );
  }
}

export class IdolGraphqlQueriesScaffoldFile extends GeneratorFileContext<IdolGraphqlQueries> {
  typeDecon: TypeDeconstructor;
  type: Type;

  constructor(idolGraphqlQueries: IdolGraphqlQueries, path: Path, type: Type) {
    super(idolGraphqlQueries, path);
    this.typeDecon = getMaterialTypeDeconstructor(idolGraphqlQueries.config.params.allTypes, type);
    this.type = type;

    this.reserveIdent(this.defaultFragmentName);
  }

  get defaultFragmentName(): string {
    return this.type.named.typeName + "Fragment";
  }

  get service(): Alt<IdolGraphqlQueriesService> {
    return cachedProperty(this, "service", () =>
      this.typeDecon
        .getStruct()
        .filter(_ => includesTag(this.type.tags, "service"))
        .map(fields => new IdolGraphqlQueriesService(this, fields))
    );
  }

  get declaredFragments(): Alt<Exported> {
    return cachedProperty(this, "declaredFragments", () => {
      const codegenFile = this.parent.codegenFile(this.typeDecon.t.named);

      if (!this.service.isEmpty()) {
        return this.service.bind(service => service.declaredFragments);
      }

      return codegenFile.declaredFragments.map(fragment =>
        this.export(this.defaultFragmentName, scripter.variable(this.importIdent(fragment)))
      );
    });
  }
}

export class IdolGraphqlQueriesCodegenStruct extends GeneratorFileContext<IdolGraphqlQueries> {
  fields: OrderedObj<IdolGraphQLQueriesCodegenTypeStruct>;
  codegenFile: IdolGraphqlQueriesCodegenFile;

  constructor(
    codegenFile: IdolGraphqlQueriesCodegenFile,
    fields: OrderedObj<IdolGraphQLQueriesCodegenTypeStruct>
  ) {
    super(codegenFile.parent, codegenFile.path);
    this.fields = fields;
    this.codegenFile = codegenFile;
  }

  get declaredFragments(): Alt<Exported> {
    return cachedProperty(this, "declaredFragments", () => {
      const fieldFragments: OrderedObj<[string, string]> = this.fields.mapAndFilter(
        codegenTypeStruct =>
          codegenTypeStruct.fragmentExpr.bind(fragment =>
            codegenTypeStruct.graphqlFieldsName.map(fragmentName => [
              fragmentName,
              this.applyExpr(fragment)
            ])
          )
      );
      const fragments: Array<string> = Object.keys(
        fieldFragments.values().reduce((o, n) => {
          o[n[1]] = n;
          return o;
        }, {})
      );

      return this.codegenFile.graphqlFieldsName.bind(fieldsName =>
        this.codegenFile
          .graphqlTypeName(false)
          .map(typeName =>
            this.export(this.codegenFile.defaultFragmentName, (ident: string) => [
              scripter.comment(
                getTagValues(this.codegenFile.typeDecon.t.tags, "description").join("\n")
              ),
              scripter.variable(
                this.applyExpr(
                  graphqlTag(
                    `fragment ${fieldsName} on ${typeName} {`,
                    ...this.fields.concatMap(
                      (fieldName, _) => [
                        "    " +
                          fieldName +
                          (fieldName in fieldFragments.obj
                            ? `{ ...${fieldFragments.obj[fieldName][0]} }`
                            : "")
                      ],
                      []
                    ),
                    "}",
                    ...fragments.map(fragmentIdent => "${" + fragmentIdent + "}")
                  )
                )
              )(ident)
            ])
          )
      );
    });
  }
}

export class IdolGraphQLQueriesCodegenTypeStruct implements GeneratorContext {
  idolGraphqlTypeStruct: IdolGraphQLCodegenTypeStruct;
  state: GeneratorAcc;
  config: GeneratorConfig;
  idolGraphqlQueries: IdolGraphqlQueries;

  constructor(
    idolGraphqlQueries: IdolGraphqlQueries,
    idolGraphqlTypeStruct: IdolGraphQLCodegenTypeStruct
  ) {
    this.state = idolGraphqlQueries.state;
    this.config = idolGraphqlQueries.config;
    this.idolGraphqlQueries = idolGraphqlQueries;
    this.idolGraphqlTypeStruct = idolGraphqlTypeStruct;
  }

  get tsDecon(): TypeStructDeconstructor {
    return this.idolGraphqlTypeStruct.tsDecon;
  }

  get fragmentExpr(): Alt<Expression> {
    if (!this.tsDecon.getMap().isEmpty()) {
      return Alt.empty();
    }

    return this.innerScalar.bind(scalar => scalar.fragmentExpr);
  }

  get graphqlTypeName(): Alt<string> {
    return this.idolGraphqlTypeStruct.typeExpr.map(typeExpr => typeExpr.graphqlTypeName);
  }

  get graphqlFieldsName(): Alt<string> {
    return this.innerScalar.bind(scalar => scalar.graphqlFieldsName);
  }

  get innerScalar(): Alt<IdolGraphqlCodegenScalar> {
    return cachedProperty(this, "innerScalar", () => {
      return this.tsDecon
        .getScalar()
        .concat(this.tsDecon.getRepeated())
        .map(scalarDecon => new IdolGraphqlCodegenScalar(this.idolGraphqlQueries, scalarDecon));
    }).concat(
      this.tsDecon
        .getMap()
        .map(
          map =>
            new IdolGraphqlCodegenScalar(
              this.idolGraphqlQueries,
              new ScalarDeconstructor(
                new TypeStruct(TypeStruct.expand({ primitive_type: PrimitiveType.ANY })),
                map.context
              )
            )
        )
    );
  }
}

export class IdolGraphqlQueriesCodegenTypeStructDeclaration extends IdolGraphQLQueriesCodegenTypeStruct {
  codegenFile: IdolGraphqlQueriesCodegenFile;

  constructor(
    codegenFile: IdolGraphqlQueriesCodegenFile,
    idolGraphqlTsDec: IdolGraphqlCodegenTypeStructDeclaration
  ) {
    super(codegenFile.parent, idolGraphqlTsDec);
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

  get declaredFragment(): Alt<Exported> {
    return cachedProperty(this, "declaredFragment", () =>
      this.fragmentExpr.map(expr => {
        return this.export(
          this.codegenFile.defaultFragmentName,
          scripter.commented(
            getTagValues(this.tsDecon.context.typeTags, "description").join("\n"),
            scripter.variable(this.applyExpr(expr))
          )
        );
      })
    );
  }
}

export class IdolGraphqlCodegenScalar implements GeneratorContext {
  scalarDecon: ScalarDeconstructor;
  state: GeneratorAcc;
  config: GeneratorConfig;
  idolGraphqlQueries: IdolGraphqlQueries;

  constructor(idolGraphqlQueries: IdolGraphqlQueries, scalarDecon: ScalarDeconstructor) {
    this.scalarDecon = scalarDecon;
    this.state = idolGraphqlQueries.state;
    this.config = idolGraphqlQueries.config;
    this.idolGraphqlQueries = idolGraphqlQueries;
  }

  get aliasScaffoldFile(): Alt<IdolGraphqlQueriesScaffoldFile> {
    return this.scalarDecon
      .getAlias()
      .filter(ref => ref.qualified_name in this.config.params.scaffoldTypes.obj)
      .map(ref => this.idolGraphqlQueries.scaffoldFile(ref));
  }

  get aliasCodegenFile(): Alt<IdolGraphqlQueriesCodegenFile> {
    return this.scalarDecon
      .getAlias()
      .filter(ref => !(ref.qualified_name in this.config.params.scaffoldTypes.obj))
      .map(ref => this.idolGraphqlQueries.codegenFile(ref));
  }

  get graphqlFieldsName(): Alt<string> {
    return this.scalarDecon
      .getAlias()
      .bind(ref => this.idolGraphqlQueries.codegenFile(ref).graphqlFieldsName);
  }

  get fragmentExpr(): Alt<Expression> {
    return this.aliasScaffoldFile
      .bind(sf => sf.declaredFragments)
      .either(this.aliasCodegenFile.bind(cf => cf.declaredFragments))
      .map(importExpr);
  }
}

export class IdolGraphqlQueriesService extends GeneratorFileContext<IdolGraphqlQueries> {
  fields: OrderedObj<TypeStructDeconstructor>;
  codegenFile: IdolGraphqlQueriesCodegenFile;
  scaffoldFile: IdolGraphqlQueriesScaffoldFile;
  methods: Array<IdolGraphqlMethod>;

  constructor(
    scaffoldFile: IdolGraphqlQueriesScaffoldFile,
    fields: OrderedObj<TypeStructDeconstructor>
  ) {
    super(scaffoldFile.parent, scaffoldFile.path);
    this.fields = fields;
    this.scaffoldFile = scaffoldFile;
    this.codegenFile = this.parent.codegenFile(this.scaffoldFile.typeDecon.t.named);

    this.methods = [
      ...this.fields
        .mapAndFilter(tsDecon =>
          tsDecon
            .getScalar()
            .bind(scalar => scalar.getAlias())
            .map(ref =>
              getMaterialTypeDeconstructor(
                this.config.params.allTypes,
                this.config.params.allTypes.obj[ref.qualified_name]
              )
            )
        )
        .mapIntoIterable((fieldName, tDecon) =>
          this.methodFor(tDecon, fieldName, this.fields.obj[fieldName].context.fieldTags)
        )
    ];
    this.methods.forEach(method => this.reserveIdent(method.serviceMethodFragmentName));
  }

  get declaredFragments(): Alt<Exported> {
    return cachedProperty(this, "declaredFragments", () => {
      this.methods.forEach(method => method.declaredMethodFragment);
      return Alt.empty();
    });
  }

  methodFor(
    tDecon: TypeDeconstructor,
    serviceFieldName: string,
    fieldTags: Array<string>
  ): IdolGraphqlMethod {
    return new IdolGraphqlMethod(
      this.scaffoldFile,
      tDecon,
      this.codegenFile.type.named.typeName,
      serviceFieldName,
      includesTag(fieldTags, "mutation")
    );
  }
}

export class IdolGraphqlMethod implements GeneratorContext {
  tDecon: TypeDeconstructor;
  state: GeneratorAcc;
  config: GeneratorConfig;
  idolGraphqlQueries: IdolGraphqlQueries;
  scaffoldFile: IdolGraphqlQueriesScaffoldFile;
  serviceName: string;
  methodName: string;
  isMutation: boolean;

  constructor(
    scaffoldFile: IdolGraphqlQueriesScaffoldFile,
    tDecon: TypeDeconstructor,
    serviceName: string,
    methodName: string,
    isMutation: boolean
  ) {
    this.tDecon = tDecon;
    this.scaffoldFile = scaffoldFile;

    const idolGraphqlQueries = scaffoldFile.parent;
    this.state = idolGraphqlQueries.state;
    this.config = idolGraphqlQueries.config;
    this.idolGraphqlQueries = idolGraphqlQueries;
    this.serviceName = serviceName;
    this.methodName = methodName;
    this.isMutation = isMutation;
  }

  get serviceMethodFragmentName(): string {
    if (this.isMutation) {
      return (
        this.serviceName + this.methodName[0].toUpperCase() + this.methodName.slice(1) + "Mutation"
      );
    }

    return this.serviceName + this.methodName[0].toUpperCase() + this.methodName.slice(1) + "Query";
  }

  get declaredMethodFragment(): Alt<Exported> {
    return cachedProperty(this, "declaredMethod", () => {
      return this.tDecon.getStruct().bind(fields => {
        const outputFields: Alt<[Exported, string]> = fields
          .get("output")
          .bind(outputTs => outputTs.getScalar())
          .bind(s => s.getAlias())
          .map(ref => {
            const materialType = getMaterialTypeDeconstructor(
              this.config.params.allTypes,
              this.config.params.allTypes.obj[ref.qualified_name]
            );
            return this.idolGraphqlQueries.codegenFile(materialType.t.named);
          })
          .bind(codegenFile =>
            codegenFile.declaredFragments.bind(fragments =>
              codegenFile.graphqlFieldsName.map(fieldsName => [fragments, fieldsName])
            )
          );

        const inputFields: Alt<OrderedObj<string>> = fields
          .get("input")
          .bind(inputTs => inputTs.getScalar().bind(scalar => scalar.getAlias()))
          .bind(ref => {
            const materialType = getMaterialTypeDeconstructor(
              this.config.params.allTypes,
              this.config.params.allTypes.obj[ref.qualified_name]
            );
            return this.idolGraphqlQueries.codegenFile(materialType.t.named).struct(true);
          })
          .map(struct => struct.fields.map(f => f.graphqlTypeName.unwrap()));

        if (outputFields.isEmpty()) {
          throw new Error(this.serviceName + " is missing a valid output field.");
        }

        if (inputFields.isEmpty()) {
          throw new Error(this.serviceName + " is missing a valid input field.");
        }

        return inputFields.map(inputFields => {
          const operationArgs = [
            ...inputFields.mapIntoIterable((fieldName, fieldType) => `$${fieldName}: ${fieldType}`)
          ];
          const callArgs = [
            ...inputFields.mapIntoIterable((fieldName, fieldType) => `${fieldName}: $${fieldName}`)
          ];
          const outerHeaderLine = `${this.isMutation ? "mutation" : "query"} ${
            this.methodName
          }(${operationArgs.join(", ")})`;

          const innerHeaderLine = `${this.methodName}(${callArgs.join(", ")})`;
          const fieldsSpread = outputFields
            .map(([_, fieldsName]) => `{ ...${fieldsName} }`)
            .getOr("");
          const fragment = outputFields
            .map(([fragment, _]) => "${" + this.scaffoldFile.importIdent(fragment) + "}")
            .getOr("");

          return this.scaffoldFile.export(
            this.serviceMethodFragmentName,
            scripter.variable(
              graphqlTag(
                "  " + outerHeaderLine + " {",
                "    " + innerHeaderLine + " " + fieldsSpread,
                "  }",
                fragment
              )(this.state, this.scaffoldFile.path)
            )
          );
        });
      });
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

  const idolGraphqlQueries = new IdolGraphqlQueries(config);
  const moveTo = build(config, idolGraphqlQueries.render());
  moveTo(params.outputDir);
}

if (require.main === module) {
  main();
}
