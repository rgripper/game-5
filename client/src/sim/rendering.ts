import { Diff } from "./Diff";
import characterImage from '../assets/Player.png';
import projectileImage from '../assets/Projectile.png';
import { World } from "./process";

const sprites = new Map<number, PIXI.Sprite>();

function createCharacter (actorId: number, app: PIXI.Application): PIXI.Sprite {
  const character = PIXI.Sprite.from(characterImage);
  character.scale.x = character.scale.x / 6;
  character.scale.y = character.scale.y / 6;
  sprites.set(actorId, character);
  app.stage.addChild(character);
  return character;
}

function createProjectile (projectileId: number, app: PIXI.Application): PIXI.Sprite {
  const projectileSprite = PIXI.Sprite.from(projectileImage);
  projectileSprite.scale.x = projectileSprite.scale.x;
  projectileSprite.scale.y = projectileSprite.scale.y;
  sprites.set(projectileId, projectileSprite);
  app.stage.addChild(projectileSprite);
  return projectileSprite;
}

export function renderWorld(world: World, app: PIXI.Application) {
  Object.values(world.entities).filter(entity => entity.type === "Actor").forEach(entity => {
    const character = createCharacter(entity.id, app);
    character.x = entity.location.x;
    character.y = entity.location.y;
  })
}

export function renderDiffs(diffs: Diff[], app: PIXI.Application) {
  diffs.forEach(diff => {
    if (diff.targetType !== "Entity") {
      return;
    }
    switch(diff.type) {
      case "Upsert": {
        if (diff.target.type === "Actor") {
          const character = sprites.get(diff.target.id) || createCharacter(diff.target.id, app);
          character.x = diff.target.location.x;
          character.y = diff.target.location.y;
        }
        else if(diff.target.type === "Projectile") {
          const projectileSprite = sprites.get(diff.target.id) || createProjectile(diff.target.id, app);
          projectileSprite.rotation = diff.target.rotation;
          projectileSprite.x = diff.target.location.x;
          projectileSprite.y = diff.target.location.y;
        }
        return;
      }
      case "Delete": {
        if (diff.target.type === "Actor") {
          const character = sprites.get(diff.target.id)!;
          app.stage.removeChild(character);
          sprites.delete(diff.target.id);
        }
        else {
          const projectileSprite = sprites.get(diff.target.id)!;
          app.stage.removeChild(projectileSprite);
          sprites.delete(diff.target.id);
        }
        return;
      }
    }
  })
  // Object.values(world.actors).forEach(actor => {
  //   //console.log('actor', actor.id, actor.location.x, actor.location.y);
  //   const actorSprite = actorSprites.get(actor.id)!;
  //   actorSprite.position.x = actor.location.x;
  //   actorSprite.position.y = actor.location.y; 
  //   //actorSprite.position.set(actor.location.x, actor.location.y);
  // })
}
