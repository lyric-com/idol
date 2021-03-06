use std::error::Error;
use std::fmt::Display;

#[derive(Debug, PartialEq)]
pub enum FieldDecError {
    LiteralParseError(String),
    UnknownPrimitiveType(String),
    InvalidParameter(String),
    UnspecifiedType,
    LiteralAnyError,
    LiteralInStructError,
    CompositionError(String),
}

#[derive(Debug, PartialEq)]
pub enum TypeDecError {
    FieldError(String, FieldDecError),
    BadFieldNameError(String),
    IsAError(FieldDecError),
    MixedDec(String),
}

#[derive(Debug, PartialEq)]
pub enum ModuleError {
    TypeDecError(String, TypeDecError),
    BadTypeNameError(String),
}

#[derive(Debug, PartialEq)]
pub enum ProcessingError {
    ModuleError(String, ModuleError),
    BadModuleNameError(String),
    CircularImportError(String),
    CircularTypeError(String),
    DuplicateImportError(String),
}

impl From<serde_json::Error> for FieldDecError {
    fn from(e: serde_json::Error) -> FieldDecError {
        FieldDecError::LiteralParseError(e.description().to_string())
    }
}

impl Display for ProcessingError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        (match self {
            ProcessingError::ModuleError(m, err) => write!(f, "module {}: {}", m, err),
            ProcessingError::BadModuleNameError(m) => write!(f, "module {}: invalid name", m),
            ProcessingError::CircularImportError(desc) => {
                write!(f, "circular module dependency found: {}", desc)
            }
            ProcessingError::CircularTypeError(desc) => {
                write!(f, "circular type dependency found: {}", desc)
            }
            ProcessingError::DuplicateImportError(m) => write!(
                f,
                "module {}: process_module was called twice for same module!",
                m
            ),
        })
    }
}

impl Display for ModuleError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        (match self {
            ModuleError::TypeDecError(m, err) => write!(f, "declaration {}: {}", m, err),
            ModuleError::BadTypeNameError(m) => write!(f, "declaration {}", m),
        })
    }
}

impl Display for TypeDecError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        (match self {
            TypeDecError::FieldError(field, err) => write!(f, "field {}: {}", field, err),
            TypeDecError::IsAError(err) => write!(f, "{}", err),
            TypeDecError::BadFieldNameError(field) => write!(f, "field {}: invalid name", field),
            TypeDecError::MixedDec(err) => write!(f, "{}", err),
        })
    }
}

impl Display for FieldDecError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        (match self {
            FieldDecError::LiteralParseError(field) => {
                write!(f, "problem parsing literal value for field {}", field)
            }
            FieldDecError::UnknownPrimitiveType(msg) => {
                write!(f, "unknown primitive type: {}", msg)
            }
            FieldDecError::UnspecifiedType => write!(f, "type was unspecified"),
            FieldDecError::LiteralAnyError => write!(f, "literal field cannot be 'any' type"),
            FieldDecError::InvalidParameter(s) => {
                write!(f, "field includes an invalid type parameter: {}", s)
            },
            FieldDecError::LiteralInStructError => write!(f, "literals in fields must be wrapped in a type alias.  Use is_a and create a new type to wrap the literal."),
            FieldDecError::CompositionError(s) => write!(f, "composition error: {}", s)
        })
    }
}
