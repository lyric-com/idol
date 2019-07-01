extern crate idol;
extern crate serde_json;
extern crate structopt;

use idol::loader::Loader;
use idol::models::declarations::ModuleDec;
use idol::registry::SchemaRegistry;
use std::path::PathBuf;
use structopt::StructOpt;

#[derive(StructOpt)]
#[structopt(name = "idol")]
struct Opt {
    /// Directories to search for module files within.  This is in addition to the directories of any src files.
    #[structopt(long = "include", short = "I")]
    include_dirs: Vec<String>,
    /// Which extensions to search modules by.  This is in addition to those on any src files.
    #[structopt(long = "extension", short = "x")]
    extensions: Vec<String>,
    src_files: Vec<String>,
}

fn do_load(module_name: &String, loader: &Loader) -> Result<ModuleDec, i32> {
    match loader.load_module(&module_name) {
        Ok(Some(value)) => Ok(value),
        Ok(None) => {
            eprintln!("Could not find or open module {}!", module_name);
            Err(1)
        }
        Err(err) => {
            eprintln!("{}", err);
            Err(1)
        }
    }
    .and_then(|v| {
        let module: ModuleDec = serde_json::from_value(v).map_err(|err| {
            eprintln!("Error parsing json: {}", err);
            1
        })?;
        Ok(module)
    })
}

fn prepare_opts(opt: &mut Opt) -> Result<(), i32> {
    for src in opt.src_files.iter() {
        let src_path = PathBuf::from(src);
        let dir = src_path
            .parent()
            .map(|p| String::from(p.to_str().unwrap()))
            .unwrap_or_else(|| String::from(""));

        if !opt.include_dirs.contains(&dir) {
            opt.include_dirs.push(dir);
        }

        let ext = src_path
            .extension()
            .map(|oss| String::from(oss.to_string_lossy()))
            .unwrap_or_else(|| String::from(""));

        if !opt.extensions.contains(&ext) {
            opt.extensions.push(ext);
        }
    }

    Ok(())
}

fn main() -> Result<(), i32> {
    let mut opt = Opt::from_args();
    prepare_opts(&mut opt)?;

    let loader = Loader::new(opt.include_dirs, opt.extensions);

    let mut registry = SchemaRegistry::new();

    for src_file in opt.src_files.iter() {
        let module_name = Loader::module_name_from_filename(src_file);

        if registry.modules.contains_key(&module_name) {
            continue;
        }

        let module_def = do_load(&module_name, &loader)?;
        registry
            .process_module(module_name.to_owned(), &module_def)
            .or_else(|err| {
                eprintln!("Problem processing {}", err);
                Err(1)
            })?;

        while let Some(missing_module) = registry.missing_module_lookups.iter().cloned().next() {
            registry
                .process_module(missing_module, &module_def)
                .or_else(|err| {
                    eprintln!("Problem processing {}", err);
                    Err(1)
                })?
        }

        if registry.missing_type_lookups.is_empty() {
            continue;
        }

        for entry in registry.missing_type_lookups.iter() {
            eprintln!(
                "Could not find model definition {} which was required by {}.",
                entry.0, entry.1
            );
        }
        return Err(1);
    }

    println!("{}", serde_json::to_string(&registry.modules).unwrap());

    return Ok(());
}