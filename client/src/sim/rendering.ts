import { Diff } from "./Diff";
import humanImage from '../assets/Human.png';
import monsterImage from '../assets/Monster.png';
import projectileImage from '../assets/Projectile.png';
import { World, Entity } from "./process";

const sprites = new Map<number, PIXI.Sprite>();

function getImageByEntityType(entity: Entity): string {
  switch (entity.type) {
    case "Actor": switch(entity.unitType) {
      case "Human": return humanImage;
      case "Monster": return monsterImage;
    };
    case "Projectile": return projectileImage;
  }
}

function createSprite (entityId: number, app: PIXI.Application, image: string): PIXI.Sprite {
  const sprite = PIXI.Sprite.from(image);
  sprite.scale.x /= 6;
  sprite.scale.y /= 6;
  sprites.set(entityId, sprite);
  app.stage.addChild(sprite);
  return sprite;
}

// TODO: convert to Diffs somehow?
export function renderWorld(world: World, app: PIXI.Application) {
  Object.values(world.entities).forEach(entity => {
    const sprite = createSprite(entity.id, app, getImageByEntityType(entity));
    sprite.rotation = entity.rotation;
    sprite.x = entity.location.x;
    sprite.y = entity.location.y;
  })
}

export function renderDiffs(diffs: Diff[], app: PIXI.Application) {
  diffs.forEach(diff => {
    if (diff.targetType !== "Entity") {
      return;
    }
    switch(diff.type) {
      case "Upsert": {
        const sprite = sprites.get(diff.target.id) || createSprite(diff.target.id, app, getImageByEntityType(diff.target));
        sprite.rotation = diff.target.rotation;
        sprite.x = diff.target.location.x;
        sprite.y = diff.target.location.y;
        return;
      }
      case "Delete": {
        const sprite = sprites.get(diff.targetId)!;
        app.stage.removeChild(sprite);
        sprites.delete(diff.targetId);
        return;
      }
    }
  })
}
