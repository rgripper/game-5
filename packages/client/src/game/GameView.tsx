import React, { useEffect, useState, useRef } from "react";
import * as PIXI from "pixi.js";
import { createRenderingPipe } from "./rendering/rendering";
import { concat } from "rxjs";
import DebugView, { createDebuggingPipe } from "./DebugView";
import createCommands from "./client-commands/createCommands";
import {
  WorldState,
  Player,
  ID,
  Process,
  Entity,
  ChannelClient,
  WorldParams
} from "page-server";
import { createPipeline } from "../SimClient";

function GameView() {
  // TODO: refactor duplicate init world

  const worldParams = { size: { width: 500, height: 500 } };
  const initialWorld: WorldState = {
    boundaries: { top_left: { x: 0, y: 0 }, size: worldParams.size },
    players: new Map<ID, Player>(),
    processes: new Map<ID, Process>(),
    entities: new Map<ID, Entity>()
  };

  const [isConnecting, setIsConnecting] = useState(false);
  const [channelClient, setСhannelClient] = useState<ChannelClient | undefined>(
    undefined
  );

  const [debuggedWorld, setDebuggedWorld] = useState<WorldState>(initialWorld);
  const gameViewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isConnecting) {
      return;
    }
    createPipeline({ worldParams }).then(setСhannelClient);
  }, [isConnecting]);

  useEffect(() => {
    if (gameViewRef.current === null) {
      return;
    }

    if (channelClient === undefined) {
      return;
    }

    console.log("channelClient", channelClient);

    const gameView = gameViewRef.current;
    const app = new PIXI.Application({
      backgroundColor: 0xffaaff,
      ...worldParams.size
    });
    gameView.appendChild(app.view);

    const commandSet = createCommands();
    const commands$ = concat(
      commandSet.initCommands$,
      commandSet.controlCommands$
    );

    const subscription = channelClient.cycleOutputs
      .pipe(
        createRenderingPipe(app),
        createDebuggingPipe(initialWorld, setDebuggedWorld)
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [channelClient]);

  return (
    <div className="App">
      <DebugView worldState={debuggedWorld}>
        <div ref={gameViewRef}></div>
        <button onClick={() => setIsConnecting(true)}>Connect</button>
      </DebugView>
    </div>
  );
}

export default GameView;
