import React from 'react';
import { WorldState, Entity } from './sim/sim';
import { Point, intersects } from './sim/Geometry';

function EntityView ({ entity }: { entity: Entity }) {
    return <span>{JSON.stringify(entity)}</span>
}

function PointView ({ point }: { point: Point }) {
    return <span>[{point.x}, {point.y}]</span>
}

function WorldStateView ({ worldState }: { worldState: WorldState }) {
    return (
        <table>
            <tbody>
                <tr>
                    <td>Number of entities:</td>
                    <td>{Object.values(worldState.entities).length}</td>
                </tr>
                <tr>
                    <td>Number of activities:</td>
                    <td>{Object.values(worldState.activities).length}</td>
                </tr>
                <tr>
                    <td>Number of players:</td>
                    <td>{Object.values(worldState.players).length}</td>
                </tr>
            </tbody>
        </table>
    )
}


function InfoAtPosition ({ worldState, position }: { worldState: WorldState, position?: Point }) {
    const entity = position && Object.values(worldState.entities).find(e => intersects(e, { size: { width: 1, height: 2 }, location: position }))
    const processes = entity && Object.values(worldState.activities).filter(process => process.entityId === entity.id);

    if (!entity || !processes || !position) {
        return <span>{position && <PointView point={position}/>} No selection</span>
    }

    return (
        <div>
            <div><PointView point={position} /></div>
            <div><EntityView entity={entity} /></div>
            <ul style={{ listStyleType: "none" }}>
                {processes.map(p => <li key={p.id}>{JSON.stringify(p)}</li>)}
            </ul>
            <hr></hr>
            
        </div>
    );
}

export default function ({ worldState, position }: { worldState: WorldState, position?: Point }) {
    return <div>
        <InfoAtPosition worldState={worldState} position={position} />
        <WorldStateView worldState={worldState}/>
    </div>
}