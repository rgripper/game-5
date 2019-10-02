#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SimCommand {
    #[prost(oneof="sim_command::Type", tags="1, 2, 3, 4, 5, 6")]
    pub r#type: ::std::option::Option<sim_command::Type>,
}
pub mod sim_command {
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Type {
        #[prost(message, tag="1")]
        ActorMoveStart(super::ActorMoveStart),
        #[prost(message, tag="2")]
        ActorMoveStop(super::ActorMoveStop),
        #[prost(message, tag="3")]
        ActorShootStart(super::ActorShootStart),
        #[prost(message, tag="4")]
        ActorShootStop(super::ActorShootStop),
        #[prost(message, tag="5")]
        AddEntity(super::AddEntity),
        #[prost(message, tag="6")]
        AddPlayer(super::AddPlayer),
    }
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ActorMoveStart {
    #[prost(int32, tag="1")]
    pub id: i32,
    #[prost(int32, tag="2")]
    pub direction: i32,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ActorMoveStop {
    #[prost(int32, tag="1")]
    pub id: i32,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ActorShootStart {
    #[prost(int32, tag="1")]
    pub id: i32,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ActorShootStop {
    #[prost(int32, tag="1")]
    pub id: i32,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct AddEntity {
    #[prost(message, optional, tag="1")]
    pub entity: ::std::option::Option<Entity>,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct AddPlayer {
    #[prost(message, optional, tag="1")]
    pub player: ::std::option::Option<Player>,
}
/// TODO
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Entity {
}
/// TODO
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Player {
}
