// build.rs

fn main() {
    let mut prost_build = prost_build::Config::new();
    prost_build.out_dir("./src/protos");
    prost_build.compile_protos(&["protos/sim_command.proto"],
                                &["protos/"]).unwrap();
}

// Cargo.toml

build = "build.rs"

[dependencies]
bytes = "0.4"
prost = "0.5"

[build-dependencies]
prost-build = "0.5"
