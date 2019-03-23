import { World } from "./process";
import playerImage from '../assets/Player.png';

const actorSprites = new Map<number, PIXI.Sprite>();

export function loadWorld (world: World, app: PIXI.Application) {
  
  world.actors.forEach(actor => {
    const actorSprite = PIXI.Sprite.from(playerImage);
    actorSprites.set(actor.id, actorSprite);
    actorSprite.anchor.set(0.5);
    actorSprite.scale.x = actorSprite.scale.x / 6;
    actorSprite.scale.y = actorSprite.scale.y / 6;
    app.stage.addChild(actorSprite);
  });

}

export function renderWorld(world: World, app: PIXI.Application) {
  world.actors.forEach(actor => {
    //console.log('actor', actor.id, actor.location.x, actor.location.y);
    const actorSprite = actorSprites.get(actor.id)!;
    actorSprite.position.x = actor.location.x;
    actorSprite.position.y = actor.location.y; 
    //actorSprite.position.set(actor.location.x, actor.location.y);
  })
}
