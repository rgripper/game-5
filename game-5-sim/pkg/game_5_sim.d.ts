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
export function set_panic(): void;
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
