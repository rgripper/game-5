import React, { Component, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import './App.css';
import mosterImage from './assets/Monster.png';
import playerImage from './assets/Player.png';
import patternSandImage from './assets/PatternSand.jpg';
import projectileImage from './assets/Projectile.png';
import { World, ClientCommand, reduceWorldOnTick } from './sim/process';
import { interval, fromEvent, pipe, merge, Observable } from 'rxjs';
import { buffer, map, filter, bufferTime, reduce, scan, distinct, tap } from 'rxjs/operators';
import { Key } from 'ts-key-enum';
import { number } from 'prop-types';
function App () {

    useEffect(() => {
      const app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
      document.getElementById('app')!.appendChild(app.view);
      const sandTexture = PIXI.extras.TilingSprite.from(patternSandImage, 800, 600);
      const projectile = PIXI.Sprite.from(projectileImage);
      const monster = PIXI.Sprite.from(mosterImage);
      monster.scale.x = monster.scale.x / 6;
      monster.scale.y = monster.scale.y / 6;

      const player = PIXI.Sprite.from(playerImage);
      player.scale.x = player.scale.x / 6;
      player.scale.y = player.scale.y / 6;

      // move the sprite to the center of the screen
      monster.x = app.screen.width / 2;
      monster.y = app.screen.height / 2;

      projectile.x = app.screen.width / 3;
      projectile.y = app.screen.height / 3;


      app.stage.addChild(sandTexture);

      monster.anchor.set(0.5);
      app.stage.addChild(monster);


      app.stage.addChild(projectile);
      let initialWorld: World = { activities: [], actors: [{ location: { x: 25, y: 25 }, id: 1 }, { location: { x: 125, y: 125 }, id: 2 }], projectiles: [] } 

      function mapKeyboard (event: KeyboardEvent, isOn: boolean) {
        switch(event.key) {
          case 'w': return { type: "Vertical", actorId: 1, isOn, isNegative: false } as ClientCommand;
          case 's': return { type: "Vertical", actorId: 1, isOn, isNegative: true } as ClientCommand;
          case 'd': return { type: "Horizontal", actorId: 1, isOn, isNegative: true } as ClientCommand;
          case 'a': return { type: "Horizontal", actorId: 1, isOn, isNegative: false } as ClientCommand;
          default: return null;
        }
      }

      function mapMouse (event: MouseEvent, isOn: boolean) {
        switch(event.button) {
          case 0: return { type: "Shoot", actorId: 1, isOn } as ClientCommand;
          default: return null;
        }
      }
      const keyMap = new Map<string, { negative?: ClientCommand; positive?: ClientCommand; }>();
      const keyCommandsOn = fromEvent(document, 'keydown').pipe(filter(x => !(x as KeyboardEvent).repeat), map(event => mapKeyboard(event as KeyboardEvent, true)));
      const keyCommandsOff = fromEvent(document, 'keyup').pipe(map(event => mapKeyboard(event as KeyboardEvent, false)));

      const keyCommands = merge(keyCommandsOn, keyCommandsOff).pipe(filter(x => x !== null)) as Observable<ClientCommand>;

      const improvedKeyCommands = keyCommands.pipe(map(command => {
        if (command && (command.type === "Horizontal" || command.type === "Vertical")) {
          
          const key = command.type + ':' + command.actorId;
          const commands = keyMap.get(key) || {};
          if (command.isOn) {
            keyMap.set(key, { ...commands, ...(command.isNegative ? { negative: command } : { positive: command }) });
            return command;
          }
          else {
            const newCommands = { ...commands, ...(command.isNegative ? { negative: undefined } : { positive: undefined }) };
            keyMap.set(key, newCommands);
            return newCommands.negative || newCommands.positive || command
          }
        }
        else {
          return command;
        }
      }))

      const mouseCommandsOn = fromEvent(document, 'mousedown').pipe(map(event => mapMouse(event as MouseEvent, true)));
      const mouseCommandsOff = fromEvent(document, 'mouseup').pipe(map(event => mapMouse(event as MouseEvent, false)));
      const mouseCommands = merge(mouseCommandsOn, mouseCommandsOff).pipe(filter(x => x !== null)) as Observable<ClientCommand>;
      const mergedCommands = merge(improvedKeyCommands, mouseCommands).pipe(tap(x => console.log(x)));
      const commandBatches = mergedCommands.pipe(bufferTime(10));
      
      const worldStream = commandBatches.pipe(scan(reduceWorldOnTick, initialWorld));
      
      let currentWorld = initialWorld;

      worldStream.subscribe(x => currentWorld = x);

      const actorSprites = new Map<number, PIXI.Sprite>();
      initialWorld.actors.forEach(actor => {
        const actorSprite = PIXI.Sprite.from(playerImage);
        actorSprites.set(actor.id, actorSprite);
        actorSprite.anchor.set(0.5);
        actorSprite.scale.x = actorSprite.scale.x / 6;
        actorSprite.scale.y = actorSprite.scale.y / 6;
        app.stage.addChild(actorSprite);
      });

      app.ticker.add(x => {
        const world = currentWorld;

        world.actors.forEach(actor => {
          //console.log('actor', actor.id, actor.location.x, actor.location.y);
          const actorSprite = actorSprites.get(actor.id)!;
          actorSprite.position.x = actor.location.x;
          actorSprite.position.y = actor.location.y; 
          //actorSprite.position.set(actor.location.x, actor.location.y);
        })
      });
    })

    return (
      <div className="App" id="app">
      </div>
    );
}

export default App;
