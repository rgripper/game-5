import React, { useEffect, useState, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { createRenderingPipe } from './rendering/rendering';
import { concat } from 'rxjs';
import DebugView, { createDebuggingPipe } from './DebugView';
import { createPipeline } from './SimClient';
import { WorldState, Player, ID, Process, Entity } from './sim/world';
import createCommands from './clientCommands/createCommands';

function App () {
  const worldParams = { size: { width: 500, height: 500 } };

  // TODO: refactor duplicate init world
  const initialWorld: WorldState = {
    boundaries: { top_left: { x: 0, y: 0 }, size: worldParams.size },
    players: new Map<ID, Player>(),
    processes: new Map<ID, Process>(), 
    entities: new Map<ID, Entity>(), 
  };

  const [debuggedWorld, setDebuggedWorld] = useState<WorldState>(initialWorld);
  const gameViewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (gameViewRef.current === null) {
      return;
    }

    const gameView = gameViewRef.current;
    const app = new PIXI.Application({backgroundColor : 0xFFAAFF, ...worldParams.size});
    gameView.appendChild(app.view);

    const commandSet = createCommands();
    const commands$ = concat(commandSet.initCommands$, commandSet.controlCommands$);

    const pipelineClient = createPipeline({ worldParams });
    
    const subscription = pipelineClient.output$.pipe(
        createRenderingPipe(app), 
        createDebuggingPipe(initialWorld, setDebuggedWorld)
      )
      .subscribe();
    
    pipelineClient.subscribeInput(commands$);

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      <DebugView worldState={debuggedWorld}>
        <div ref={gameViewRef}></div>
      </DebugView>
    </div>
  );
}

export default App;
