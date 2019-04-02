import { fromEvent, merge, Observable } from "rxjs";
import { ClientCommand, CharacterCommand } from "../sim/process";
import { filter, map, tap } from "rxjs/operators";
import { FromEventTarget } from "rxjs/internal/observable/fromEvent";

function mapKeyboard(event: KeyboardEvent, isOn: boolean, playerId: number): ClientCommand | undefined {
  switch (event.key) {
    case 'w': return { type: "CharacterCommand", activity: { type: "Vertical", playerId,  actorId: 1, isOn, isNegative: false } };
    case 's': return { type: "CharacterCommand", activity: { type: "Vertical", playerId, actorId: 1, isOn, isNegative: true } };
    case 'd': return { type: "CharacterCommand", activity: { type: "Horizontal", playerId, actorId: 1, isOn, isNegative: true } };
    case 'a': return { type: "CharacterCommand", activity: { type: "Horizontal", playerId, actorId: 1, isOn, isNegative: false } };
    default: return undefined;
  }
}

function mapMouse(event: MouseEvent, isOn: boolean, playerId: number): ClientCommand | undefined {
  switch (event.button) {
    case 0: return { type: "CharacterCommand", activity: { type: "Shoot", playerId, actorId: 1, isOn } };
    default: return undefined;
  }
}

const keyMap = new Map<string, { negative?: CharacterCommand; positive?: CharacterCommand; }>();
function rememberPressedKeys(command: CharacterCommand): CharacterCommand {
  if (command && ((command.activity.type === "Horizontal" || command.activity.type === "Vertical"))) {
    const activity = command.activity;
    const key = activity.type + ':' + activity.actorId;
    const commands = keyMap.get(key) || {};
    if (activity.isOn) {
      keyMap.set(key, { ...commands, ...(activity.isNegative ? { negative: command } : { positive: command }) });
      return command;
    }
    else {
      const newCommands = { ...commands, ...(activity.isNegative ? { negative: undefined } : { positive: undefined }) };
      keyMap.set(key, newCommands);
      return newCommands.negative || newCommands.positive || command
    }
  }
  else {
    return command;
  }
}

export function convertEventsToCommands (target: FromEventTarget<any>, playerId: number) {
  const keyCommandsOn = fromEvent<KeyboardEvent>(target, 'keydown').pipe(filter(x => !x.repeat), map(event => mapKeyboard(event, true, playerId)));
  const keyCommandsOff = fromEvent<KeyboardEvent>(target, 'keyup').pipe(map(event => mapKeyboard(event, false, playerId)));
  
  const keyCommands = merge(keyCommandsOn, keyCommandsOff).pipe(filter(x => x !== null)) as Observable<ClientCommand>;
  
  const improvedKeyCommands = keyCommands.pipe(map(rememberPressedKeys))
  
  const mouseCommandsOn = fromEvent<MouseEvent>(document, 'mousedown').pipe(map(event => mapMouse(event, true, playerId)));
  const mouseCommandsOff = fromEvent<MouseEvent>(document, 'mouseup').pipe(map(event => mapMouse(event, false, playerId)));
  const mouseCommands = merge(mouseCommandsOn, mouseCommandsOff).pipe(filter(x => x !== null)) as Observable<ClientCommand>;
  
  const allCommands = merge(improvedKeyCommands, mouseCommands).pipe(tap(x => console.log(x)));

  return allCommands;
}

