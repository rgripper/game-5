use world::{ WorldState }

fn createWorldEntity<T>(world_state: &WorldState, value: &T) -> WorldEntity {
    let entity = WorldEntity {
        id: world_state.newId,
        value
    };

    world_state.newId = world_state.newId + 1;
    return entity;
}