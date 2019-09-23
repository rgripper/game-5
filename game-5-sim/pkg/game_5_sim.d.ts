/* tslint:disable */
/**
* @param {number} width 
* @param {number} height 
* @returns {SimInterop} 
*/
export function create_sim(width: number, height: number): SimInterop;
/**
* @param {SimInterop} sim_interop 
* @param {any} js_sim_commands 
* @returns {any} 
*/
export function update_sim(sim_interop: SimInterop, js_sim_commands: any): any;
/**
*/
export class ActorId {
  free(): void;
  actor_id: number;
}
/**
*/
export class ActorMove {
  free(): void;
  actor_id: number;
  direction: number;
}
/**
*/
export class JS_Diff {
  free(): void;
  delete_entity_id: number;
  delete_player_id: number;
  delete_process_id: number;
  upsert_entity: number;
  upsert_player: number;
  upsert_process: number;
}
/**
*/
export class JS_SimCommand {
  free(): void;
  actor_move: ActorMove;
  actor_move_stop: ActorId;
  actor_shoot: ActorId;
  actor_shoot_stop: ActorId;
}
/**
*/
export class SimInterop {
  free(): void;
}

/**
* If `module_or_path` is {RequestInfo}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {RequestInfo | BufferSource | WebAssembly.Module} module_or_path
*
* @returns {Promise<any>}
*/
export default function init (module_or_path?: RequestInfo | BufferSource | WebAssembly.Module): Promise<any>;
        