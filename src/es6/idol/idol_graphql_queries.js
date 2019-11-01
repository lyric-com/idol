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

export class IdolGraphqlQueries implements GeneratorContext {
  config: GeneratorConfig;
  state: GeneratorAcc;
  codegenImpl: (IdolGraphqlQueries, Path, Type) => IdolGraphqlQueriesCodegenFile;
  scaffoldImpl: (IdolGraphqlQueries, Path, Type) => IdolGraphqlQueriesScaffoldFile;

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
    ) => new IdolGraphqlQueriesScaffoldFile(idolGraphqlQueries, path, type)
  ) {
    this.state = new GeneratorAcc();
    this.config = config;
    this.codegenImpl = codegenImpl;
    this.scaffoldImpl = scaffoldImpl;
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

  get anythingGraphqlTypeName(): string {
    return "IdolGraphQLAnything";
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

  graphqlTypeName(inputVariant: boolean): string {
      return this.typeStruct.bind(ts => ts.graphqlTypeName(inputVariant)).getOr(
          this.type.named.qualifiedName in this.config.params.scaffoldTypes ?
              this.type.named.typeName + (inputVariant ? "Input" : "") :
              this.type.named.asQualifiedIdent + (inputVariant ? "Input" : "")
      );
  }

  get defaultFragmentName(): string {
    return this.type.named.asQualifiedIdent + "Fragment";
  }

  get graphqlFieldsName(): string {
    return this.typeStruct.bind(ts => ts.graphqlFieldsName).getOr(
    this.type.named.asQualifiedIdent + "Fields"
    );
  }

  get declaredFragments(): Alt<Exported> {
    return cachedProperty(this, "declaredFragments", () => {
      return this.typeStruct
        .bind(ts => ts.declaredFragment)
        .either(this.struct.bind(struct => struct.declaredFragments));
    });
  }

  get struct(): Alt<IdolGraphqlQueriesCodegenStruct> {
    return cachedProperty(this, "struct", () =>
      this.typeDecon
        .getStruct()
        .map(
          fields =>
            new IdolGraphqlQueriesCodegenStruct(
              this,
              fields.map(tsDecon => new IdolGraphQLQueriesCodegenTypeStruct(this.parent, tsDecon))
            )
        )
    );
  }

  get typeStruct(): Alt<IdolGraphqlCodegenTypeStructDeclaration> {
    return cachedProperty(this, "typeStruct", () =>
      this.typeDecon
        .getTypeStruct()
        .map(tsDecon => new IdolGraphqlCodegenTypeStructDeclaration(this, tsDecon))
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

  graphqlTypeName(inputVariant: boolean): string {
    return this.typeDecon.t.named.typeName + (inputVariant ? "Input" : "");
  }

  get defaultFragmentName(): string {
    return this.type.named.typeName + "Fragment";
  }

  get graphqlFieldsName(): string {
    return this.typeDecon.t.named.typeName + "Fields";
  }

  get service(): Alt<IdolGraphqlQueriesService> {
    return cachedProperty(this, "service", () =>
      this.typeDecon
        .getStruct()
        .filter(_ => includesTag(this.type.tags, "service"))
        .map(
          fields =>
            new IdolGraphqlQueriesService(
              this,
              fields.map(tsDecon => new IdolGraphQLQueriesCodegenTypeStruct(this.parent, tsDecon))
            )
        )
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

      return Alt.lift(
        this.export(this.codegenFile.defaultFragmentName, (ident: string) => [
          scripter.comment(
            getTagValues(this.codegenFile.typeDecon.t.tags, "description").join("\n")
          ),
          scripter.variable(
            this.applyExpr(
              graphqlTag(
                `fragment ${
                  this.codegenFile.graphqlFieldsName
                } on ${this.codegenFile.graphqlTypeName(false)} {`,
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
      );
    });
  }
}

export class IdolGraphQLQueriesCodegenTypeStruct implements GeneratorContext {
  tsDecon: TypeStructDeconstructor;
  state: GeneratorAcc;
  config: GeneratorConfig;
  idolGraphqlQueries: IdolGraphqlQueries;

  constructor(idolGraphqlQueries: IdolGraphqlQueries, tsDecon: TypeStructDeconstructor) {
    this.tsDecon = tsDecon;
    this.state = idolGraphqlQueries.state;
    this.config = idolGraphqlQueries.config;
    this.idolGraphqlQueries = idolGraphqlQueries;
  }

  get fragmentExpr(): Alt<Expression> {
    if (!this.tsDecon.getMap().isEmpty()) {
      return Alt.empty();
    }

    return this.innerScalar.bind(scalar => scalar.fragmentExpr);
  }

  graphqlTypeName(inputVariant: boolean): Alt<string> {
    return this.tsDecon
      .getRepeated()
      .bind(_ =>
        this.innerScalar.bind(scalar => scalar.graphqlTypeName(inputVariant)).map(s => s + "[]")
      )
      .concat(this.innerScalar.bind(scalar => scalar.graphqlTypeName(inputVariant)));
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

export class IdolGraphqlCodegenTypeStructDeclaration extends IdolGraphQLQueriesCodegenTypeStruct {
  codegenFile: IdolGraphqlQueriesCodegenFile;

  constructor(codegenFile: IdolGraphqlQueriesCodegenFile, tsDecon: TypeStructDeconstructor) {
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
  materialTypeDecon: Alt<TypeDeconstructor>;
  aliasScaffoldFile: Alt<IdolGraphqlQueriesScaffoldFile>;
  aliasCodegenFile: Alt<IdolGraphqlQueriesCodegenFile>;

  constructor(idolGraphqlQueries: IdolGraphqlQueries, scalarDecon: ScalarDeconstructor) {
    this.scalarDecon = scalarDecon;
    this.state = idolGraphqlQueries.state;
    this.config = idolGraphqlQueries.config;
    this.idolGraphqlQueries = idolGraphqlQueries;

    this.materialTypeDecon = this.scalarDecon
      .getAlias()
      .map(ref =>
        getMaterialTypeDeconstructor(
          this.config.params.allTypes,
          this.config.params.allTypes.obj[ref.qualified_name]
        )
      );

    this.aliasScaffoldFile = this.materialTypeDecon
      .map(tDecon => tDecon.t.named)
      .filter(ref => ref.qualified_name in this.config.params.scaffoldTypes.obj)
      .map(ref => this.idolGraphqlQueries.scaffoldFile(ref));

    this.aliasCodegenFile = this.materialTypeDecon
      .map(tDecon => tDecon.t.named)
      .filter(ref => !(ref.qualified_name in this.config.params.scaffoldTypes.obj))
      .map(ref => this.idolGraphqlQueries.codegenFile(ref));
  }

  get fragmentExpr(): Alt<Expression> {
    return this.aliasScaffoldFile
      .bind(sf => sf.declaredFragments)
      .either(this.aliasCodegenFile.bind(cf => cf.declaredFragments))
      .map(importExpr);
  }

  get graphqlFieldsName(): Alt<string> {
    return this.aliasScaffoldFile
      .map(sf => sf.graphqlFieldsName)
      .either(this.aliasCodegenFile.map(cf => cf.graphqlFieldsName));
  }

  graphqlTypeName(inputVariant: boolean): Alt<string> {
    return this.scalarDecon
      .getPrimitive()
      .map(prim => {
        if (prim === PrimitiveType.ANY) {
          return this.idolGraphqlQueries.anythingGraphqlTypeName;
        } else if (prim === PrimitiveType.BOOL) {
          return "GraphQLBoolean";
        } else if (prim === PrimitiveType.DOUBLE) {
          return "GraphQLFloat";
        } else if (prim === PrimitiveType.INT) {
          return "GraphQLInt";
        } else if (prim === PrimitiveType.STRING) {
          return "GraphQLString";
        }

        throw new Error(`Unexpected primitive type ${prim}`);
      })
      .either(
        this.aliasScaffoldFile
          .map(sf => sf.graphqlTypeName(inputVariant))
          .concat(this.aliasCodegenFile.map(cf => cf.graphqlTypeName(inputVariant)))
      );
  }
}

export class IdolGraphqlQueriesService extends GeneratorFileContext<IdolGraphqlQueries> {
  fields: OrderedObj<IdolGraphQLQueriesCodegenTypeStruct>;
  codegenFile: IdolGraphqlQueriesCodegenFile;
  scaffoldFile: IdolGraphqlQueriesScaffoldFile;
  methods: Array<IdolGraphqlMethod>;

  constructor(
    scaffoldFile: IdolGraphqlQueriesScaffoldFile,
    fields: OrderedObj<IdolGraphQLQueriesCodegenTypeStruct>
  ) {
    super(scaffoldFile.parent, scaffoldFile.path);
    this.fields = fields;
    this.scaffoldFile = scaffoldFile;
    this.codegenFile = this.parent.codegenFile(this.scaffoldFile.typeDecon.t.named);

    this.methods = [
      ...this.fields
        .mapAndFilter(codegenTypeStruct =>
          codegenTypeStruct.tsDecon
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
          this.methodFor(tDecon, fieldName, this.fields.obj[fieldName].tsDecon.context.fieldTags)
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
          .bind(outputTs => outputTs.getScalar().concat(outputTs.getRepeated()))
          .bind(s => s.getAlias())
          .map(ref => {
            const materialType = getMaterialTypeDeconstructor(
                this.config.params.allTypes,
                this.config.params.allTypes.obj[ref.qualified_name]
            );
            return this.idolGraphqlQueries.codegenFile(materialType.t.named);
          })
          .bind(codegenFile =>
            codegenFile.declaredFragments.map(fragments => [
              fragments,
              codegenFile.graphqlFieldsName
            ])
          );

        const inputFields: Alt<OrderedObj<string>> = fields
          .get("input")
          .bind(inputTs => inputTs.getScalar().bind(scalar => scalar.getAlias()))
          .bind(ref => {
            const materialType = getMaterialTypeDeconstructor(
              this.config.params.allTypes,
              this.config.params.allTypes.obj[ref.qualified_name]
            );
            return this.idolGraphqlQueries.codegenFile(materialType.t.named).struct;
          })
          .map(struct => struct.fields.map(f => f.graphqlTypeName(true).unwrap()));

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
          const fieldsSpread = outputFields.map(([_, fieldsName]) => `{ ...${fieldsName} }`).getOr("");
          const fragment = outputFields.map(([fragment, _]) => "${" + this.scaffoldFile.importIdent(fragment) + "}").getOr("");

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
