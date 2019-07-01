use crate::models::declarations::*;
use crate::schema::*;
use regex::Regex;
use std::collections::HashMap;
use std::collections::HashSet;
use std::error::Error;
use std::fmt::Display;

pub enum FieldError {
    LiteralParseError(String),
    UnknownPrimitiveType(String),
    UnspecifiedType,
    LiteralAnyError,
}

pub enum DecError {
    FieldError(String, FieldError),
    DecError(FieldError),
}

pub enum ModuleError {
    DecError(String, DecError),
}

pub enum ProcessingError {
    ModuleError(String, ModuleError),
}

impl From<serde_json::Error> for FieldError {
    fn from(e: serde_json::Error) -> FieldError {
        FieldError::LiteralParseError(e.description().to_string())
    }
}

impl Display for ProcessingError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        (match self {
            ProcessingError::ModuleError(m, err) => write!(f, "module {}: {}", m, err),
        })
    }
}

impl Display for ModuleError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        (match self {
            ModuleError::DecError(m, err) => write!(f, "declaration {}: {}", m, err),
        })
    }
}

impl Display for DecError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        (match self {
            DecError::FieldError(field, err) => write!(f, "field {}: {}", field, err),
            DecError::DecError(err) => write!(f, "{}", err),
        })
    }
}

impl Display for FieldError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        (match self {
            FieldError::LiteralParseError(field) => {
                write!(f, "problem parsing literal value for field {}", field)
            }
            FieldError::UnknownPrimitiveType(msg) => write!(f, "unknown primitive type: {}", msg),
            FieldError::UnspecifiedType => write!(f, "type was unspecified"),
            FieldError::LiteralAnyError => write!(f, "literal field cannot be 'any' type"),
        })
    }
}

pub struct SchemaRegistry {
    pub modules: HashMap<String, Module>,
    pub missing_module_lookups: HashSet<String>,
    pub missing_type_lookups: HashMap<Reference, Reference>,
}

impl SchemaRegistry {
    pub fn from_modules(modules: HashMap<String, Module>) -> SchemaRegistry {
        SchemaRegistry {
            modules,
            missing_module_lookups: HashSet::new(),
            missing_type_lookups: HashMap::new(),
        }
    }

    pub fn process_module(
        &mut self,
        module_name: String,
        module_dec: &ModuleDec,
    ) -> Result<(), ProcessingError> {
        let mut module = Module::default();

        module.module_name = module_name.to_owned();

        self.process_models(&mut module, module_dec)
            .map_err(|e| ProcessingError::ModuleError(module_name.to_owned(), e))?;
        self.order_local_dependencies(&mut module);

        self.missing_module_lookups.remove(&module_name);
        for type_name in module.types_by_name.keys() {
            let module_model = Reference::from(format!("{}.{}", module_name, type_name).as_str());
            self.missing_type_lookups.remove(&module_model);
        }

        for dep in module.dependencies.iter() {
            if dep.is_local {
                if !module.types_by_name.contains_key(&dep.to.type_name) {
                    self.missing_type_lookups
                        .insert(dep.to.clone(), dep.from.clone());
                }

                continue;
            }

            if self.resolve(&dep.to).is_none() {
                self.missing_type_lookups
                    .insert(dep.to.clone(), dep.from.clone());
            }

            if !self.modules.contains_key(&dep.to.module_name) {
                self.missing_module_lookups
                    .insert(dep.to.module_name.clone());
            }
        }

        self.modules.insert(module.module_name.to_owned(), module);
        Ok(())
    }

    pub fn resolve(&self, model_reference: &Reference) -> Option<&Type> {
        self.modules
            .get(&model_reference.module_name)
            .and_then(|module| module.types_by_name.get(&model_reference.type_name))
    }

    fn order_local_dependencies(&mut self, module: &mut Module) {
        let mut local_dependenants: HashMap<&String, Vec<&String>> = HashMap::new();
        let mut processing_stack: Vec<(Vec<&String>, &Vec<&String>)> = Vec::new();
        let mut ordered: HashSet<&String> = HashSet::new();

        let mut model_names: Vec<&String> = module.types_by_name.keys().collect();
        model_names.sort();

        for model_name in model_names.iter() {
            local_dependenants.insert(model_name, vec![]);
        }

        processing_stack.push((vec![], &model_names));

        for dependency in module.dependencies.iter() {
            if dependency.is_local {
                if let Some(from_deps) = local_dependenants.get_mut(&dependency.from.type_name) {
                    from_deps.push(&dependency.to.type_name);
                }
            }
        }

        while let Some((path, children)) = processing_stack.last().map(|v| v.to_owned()) {
            let mut found_unresolved_child = false;
            for child in children.iter() {
                if ordered.contains(child) || path.contains(child) {
                    continue;
                }

                if let Some(child_children) = local_dependenants.get(child) {
                    found_unresolved_child = true;
                    let mut new_parent = path.clone();
                    new_parent.push(child);
                    processing_stack.push((new_parent, child_children));
                }
            }

            if !found_unresolved_child {
                processing_stack.pop();
                if let Some(tail) = path.last() {
                    if ordered.contains(tail) {
                        continue;
                    }
                    ordered.insert(tail);
                    module
                        .types_dependency_ordering
                        .push(tail.to_owned().to_owned());
                }
            }
        }
    }

    fn process_models(
        &mut self,
        module: &mut Module,
        module_dec: &ModuleDec,
    ) -> Result<(), ModuleError> {
        let module_resolver = ModuleResolver(&module.module_name);
        let mut type_names: Vec<&String> = module_dec.0.keys().collect();
        type_names.sort();

        for next in type_names {
            let from = Reference {
                qualified_name: module_resolver.qualify(next),
                module_name: module.module_name.to_owned(),
                type_name: next.to_owned(),
            };

            let t = module_resolver
                .type_from_dec(next, &module_dec.0[next])
                .map_err(|e| ModuleError::DecError(next.to_string(), e))?;

            let fields = &t.fields;
            let dependencies = &mut module.dependencies;

            t.is_a
                .iter()
                .filter_map(|ts| SchemaRegistry::dependency_to_type_struct(&ts, &from))
                .for_each(|d| dependencies.push(d));

            let mut field_names = t.fields.keys().cloned().collect::<Vec<String>>();
            field_names.sort();

            field_names
                .iter()
                .filter_map(|f| {
                    fields.get(f).and_then(|f| {
                        SchemaRegistry::dependency_to_type_struct(&f.type_struct, &from)
                    })
                })
                .for_each(|d| dependencies.push(d));

            module.types_by_name.insert(next.to_owned(), t);
        }

        Ok(())
    }

    fn dependency_to_type_struct(type_struct: &TypeStruct, from: &Reference) -> Option<Dependency> {
        if type_struct.reference.qualified_name.len() == 0 {
            return None;
        }
        return Some(from.dependency_to(&type_struct.reference));
    }

    pub fn new() -> SchemaRegistry {
        return SchemaRegistry {
            modules: HashMap::new(),
            missing_type_lookups: HashMap::new(),
            missing_module_lookups: HashSet::new(),
        };
    }
}

struct ModuleResolver<'a>(&'a str);

impl<'a> ModuleResolver<'a> {
    fn qualify(&self, name: &str) -> String {
        if name.find(".").is_some() {
            return name.to_owned();
        }

        if name.chars().next().unwrap_or(' ').is_ascii_uppercase() {
            return format!("{}.{}", self.0, name);
        }

        return name.to_owned();
    }

    fn type_from_dec(&self, type_name: &str, type_dec: &TypeDec) -> Result<Type, DecError> {
        Ok(Type {
            type_name: type_name.to_owned(),
            ..self.type_of_dec(type_dec)?
        })
    }

    fn type_of_dec(&self, type_dec: &TypeDec) -> Result<Type, DecError> {
        let mut result = Type::default();
        result.tags = type_dec.tags.to_owned();

        if type_dec.is_a.len() > 0 {
            result.is_a = Some(
                self.type_struct_of_dec(&type_dec.is_a)
                    .map_err(|e| DecError::DecError(e))?,
            );
            return Ok(result);
        }

        if type_dec.r#enum.len() > 0 {
            result.options = type_dec.r#enum.to_owned();
            return Ok(result);
        }

        for field in type_dec.fields.iter() {
            let field_name = field.0.to_owned();
            let field_dec = field.1;
            let tags = Vec::from(&field_dec.0[1..]);
            if field_dec.0.len() < 1 {
                return Err(DecError::FieldError(
                    field_name.to_owned(),
                    FieldError::UnspecifiedType,
                ));
            }
            let type_struct = self
                .type_struct_of_dec(&field_dec.0[0])
                .map_err(|e| DecError::FieldError(field_name.to_owned(), e))?;

            result.fields.insert(
                field_name.to_owned(),
                Field {
                    field_name,
                    tags,
                    type_struct,
                },
            );
        }

        return Ok(result);
    }

    fn type_struct_of_dec(&self, field_val: &str) -> Result<TypeStruct, FieldError> {
        let (mut type_struct, unused) = parse_type_annotation(field_val)?;

        if let Some(field_val) = unused {
            if is_model_ref(field_val) {
                type_struct.reference = Reference::from(self.qualify(field_val).as_ref());
            } else {
                type_struct.primitive_type = parse_primitive_type(field_val)?;
            }
        }

        return Ok(type_struct);
    }
}

fn is_model_ref<'a>(type_val: &'a str) -> bool {
    return type_val.find(".").is_some()
        || type_val.chars().next().unwrap_or(' ').is_ascii_uppercase();
}

fn parse_type_annotation<'a>(
    field_val: &'a str,
) -> Result<(TypeStruct, Option<&'a str>), FieldError> {
    lazy_static! {
        static ref TYPE_ANNOTATION_REGEX: Regex =
            Regex::new(r"^literal:(.*):(.*)$|(.*)\{\}$|(.*)\[\]$$").unwrap();
    }

    TYPE_ANNOTATION_REGEX
        .captures(field_val)
        .and_then(|c| {
            c.get(1)
                .map(|t| {
                    parse_literal_annotation(t.as_str(), c.get(2).unwrap().as_str())
                        .map(|s| (s, None))
                })
                .or_else(|| {
                    c.get(3).map(|t| {
                        Ok((
                            TypeStruct {
                                struct_kind: StructKind::Map,
                                ..TypeStruct::default()
                            },
                            Some(t.as_str()),
                        ))
                    })
                })
                .or_else(|| {
                    c.get(4).map(|t| {
                        Ok((
                            TypeStruct {
                                struct_kind: StructKind::Repeated,
                                ..TypeStruct::default()
                            },
                            Some(t.as_str()),
                        ))
                    })
                })
        })
        .or_else(|| Some(Ok((TypeStruct::default(), Some(field_val)))))
        .unwrap()
}

fn parse_literal_annotation<'a>(lit_type: &'a str, val: &'a str) -> Result<TypeStruct, FieldError> {
    let mut result = TypeStruct::default();
    result.struct_kind = StructKind::Scalar;
    result.primitive_type = parse_primitive_type(lit_type)?;
    result.is_literal = true;

    match result.primitive_type {
        PrimitiveType::int53 => result.literal_int53 = serde_json::from_str(val)?,
        PrimitiveType::int64 => result.literal_int64 = serde_json::from_str(val)?,
        PrimitiveType::string => result.literal_string = serde_json::from_str(val)?,
        PrimitiveType::double => result.literal_double = serde_json::from_str(val)?,
        PrimitiveType::bool => result.literal_bool = serde_json::from_str(val)?,
        PrimitiveType::any => return Err(FieldError::LiteralAnyError),
    }
    return Ok(result);
}

fn parse_primitive_type(prim_kind: &str) -> Result<PrimitiveType, FieldError> {
    serde_json::from_value(serde_json::Value::String(prim_kind.to_owned()))
        .map_err(|e| FieldError::UnknownPrimitiveType(e.to_string()))
}