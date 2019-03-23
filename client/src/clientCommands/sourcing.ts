import { fromEvent, merge, Observable } from "rxjs";
import { ClientCommand } from "../sim/process";
import { filter, map, tap } from "rxjs/operators";
import { FromEventTarget } from "rxjs/internal/observable/fromEvent";

function mapKeyboard(event: KeyboardEvent, isOn: boolean): ClientCommand | undefined {
  switch (event.key) {
    case 'w': return { type: "Vertical", actorId: 1, isOn, isNegative: false };
    case 's': return { type: "Vertical", actorId: 1, isOn, isNegative: true };
    case 'd': return { type: "Horizontal", actorId: 1, isOn, isNegative: true };
    case 'a': return { type: "Horizontal", actorId: 1, isOn, isNegative: false };
    default: return undefined;
  }
}

function mapMouse(event: MouseEvent, isOn: boolean): ClientCommand | undefined {
  switch (event.button) {
    case 0: return { type: "Shoot", actorId: 1, isOn };
    default: return undefined;
  }
}

const keyMap = new Map<string, { negative?: ClientCommand; positive?: ClientCommand; }>();
function rememberPressedKeys(command: ClientCommand): ClientCommand {
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
}

export function convertEventsToCommands (target: FromEventTarget<any>) {
  const keyCommandsOn = fromEvent<KeyboardEvent>(target, 'keydown').pipe(filter(x => !x.repeat), map(event => mapKeyboard(event, true)));
  const keyCommandsOff = fromEvent<KeyboardEvent>(target, 'keyup').pipe(map(event => mapKeyboard(event, false)));
  
  const keyCommands = merge(keyCommandsOn, keyCommandsOff).pipe(filter(x => x !== null)) as Observable<ClientCommand>;
  
  const improvedKeyCommands = keyCommands.pipe(map(rememberPressedKeys))
  
  const mouseCommandsOn = fromEvent<MouseEvent>(document, 'mousedown').pipe(map(event => mapMouse(event, true)));
  const mouseCommandsOff = fromEvent<MouseEvent>(document, 'mouseup').pipe(map(event => mapMouse(event, false)));
  const mouseCommands = merge(mouseCommandsOn, mouseCommandsOff).pipe(filter(x => x !== null)) as Observable<ClientCommand>;
  
  const allCommands = merge(improvedKeyCommands, mouseCommands).pipe(tap(x => console.log(x)));

  return allCommands;
}

