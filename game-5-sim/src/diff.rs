use crate::world::{ID, Entity, Process};

#[derive(Debug, Copy, Clone)]
pub enum Diff {
    DeleteEntity(ID),
    DeleteProcess(ID),
    UpsertEntity(Entity),
    UpsertProcess(Process),
}