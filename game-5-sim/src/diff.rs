use crate::world::{ID, Entity, Process};

pub enum Diff {
    DeleteEntity(ID),
    DeleteProcess(ID),
    UpsertEntity(Entity),
    UpsertProcess(Process),
}