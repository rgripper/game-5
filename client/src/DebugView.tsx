import React from 'react';
import { World } from './sim/worldProcessor';
import { Point, intersects } from './sim/Geometry';

export default function ({ world, position }: { world: World, position?: Point }) {
    const entity = position && Object.values(world.entities).find(e => intersects(e, { size: { width: 1, height: 2 }, location: position }))
    const processes = entity && Object.values(world.activities).filter(process => process.entityId === entity.id);

    if (!entity || !processes) {
        return <div>{position ? `[${position.x}, ${position.y}]` : ''} No selection</div>
    }

    return (
        <div>
            <div>{position ? `[${position.x}, ${position.y}]` : ''}</div>
            <div>{JSON.stringify(entity)}</div>
            <ul style={{ listStyleType: "none" }}>
                {processes.map(p => <li>{JSON.stringify(p)}</li>)}
            </ul>
        </div>
    );
}