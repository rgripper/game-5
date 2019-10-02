// extern crate protobuf_codegen_pure;

// fn main() {
//     protobuf_codegen_pure::run(protobuf_codegen_pure::Args {
//         out_dir: "src/proto",
//         input: &["proto/sim_command.proto"],
//         includes: &["proto"],
//         customize: protobuf_codegen_pure::Customize {
//             ..Default::default()
//         },
//     })
//     .expect("protoc");
// }

// extern crate pb_rs;

// use std::path::{Path, PathBuf};
// use pb_rs::types::{Config, FileDescriptor,RpcGeneratorFunction};
// use std::env;

// fn main() {
//     let out_dir = "src/proto";
//     let out_file = Path::new(out_dir).join("sim_command.rs");

//     let config = Config {
//         in_file: PathBuf::from("protos/sim_command.proto"),
//         out_file,
//         single_module: false,
//         import_search_path: vec![PathBuf::from("protos")],
//         no_output: false,
//         error_cycle: false, // may change a required field to an optional
//         headers: false, // do not generate headers
//         dont_use_cow: false, // Don't use Cow<_,_> for Strings and Bytes
//         custom_struct_derive: vec![], // Nothing
//         custom_rpc_generator: RpcGeneratorFunction::default(),
//         custom_includes: vec![],
//         owned: true
//     };

//     FileDescriptor::write_proto(&config).unwrap();
// }

fn main() {
    let mut prost_build = prost_build::Config::new();
    prost_build.out_dir("./src/protos");
    prost_build.compile_protos(&["protos/sim_command.proto"],
                                &["protos/"]).unwrap();
}