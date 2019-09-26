import * as wasm from './game_5_sim_bg.wasm';

/**
* @param {number} width
* @param {number} height
* @returns {SimInterop}
*/
export function create_sim(width, height) {
    const ret = wasm.create_sim(width, height);
    return SimInterop.__wrap(ret);
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

const heap = new Array(32);

heap.fill(undefined);

heap.push(undefined, null, true, false);

let stack_pointer = 32;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}
/**
* @param {SimInterop} sim_interop
* @param {any} js_sim_commands
* @returns {any}
*/
export function update_sim(sim_interop, js_sim_commands) {
    _assertClass(sim_interop, SimInterop);
    try {
        const ret = wasm.update_sim(sim_interop.ptr, addBorrowedObject(js_sim_commands));
        return takeObject(ret);
    } finally {
        heap[stack_pointer++] = undefined;
    }
}

/**
*/
export function set_panic() {
    wasm.set_panic();
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachegetInt32Memory = null;
function getInt32Memory() {
    if (cachegetInt32Memory === null || cachegetInt32Memory.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory;
}

let cachedTextDecoder = new TextDecoder('utf-8');

let cachegetUint8Memory = null;
function getUint8Memory() {
    if (cachegetUint8Memory === null || cachegetUint8Memory.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory;
}

function getStringFromWasm(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

let cachedTextEncoder = new TextEncoder('utf-8');

let passStringToWasm;
if (typeof cachedTextEncoder.encodeInto === 'function') {
    passStringToWasm = function(arg) {


        let size = arg.length;
        let ptr = wasm.__wbindgen_malloc(size);
        let offset = 0;
        {
            const mem = getUint8Memory();
            for (; offset < arg.length; offset++) {
                const code = arg.charCodeAt(offset);
                if (code > 0x7F) break;
                mem[ptr + offset] = code;
            }
        }

        if (offset !== arg.length) {
            arg = arg.slice(offset);
            ptr = wasm.__wbindgen_realloc(ptr, size, size = offset + arg.length * 3);
            const view = getUint8Memory().subarray(ptr + offset, ptr + size);
            const ret = cachedTextEncoder.encodeInto(arg, view);

            offset += ret.written;
        }
        WASM_VECTOR_LEN = offset;
        return ptr;
    };
} else {
    passStringToWasm = function(arg) {


        let size = arg.length;
        let ptr = wasm.__wbindgen_malloc(size);
        let offset = 0;
        {
            const mem = getUint8Memory();
            for (; offset < arg.length; offset++) {
                const code = arg.charCodeAt(offset);
                if (code > 0x7F) break;
                mem[ptr + offset] = code;
            }
        }

        if (offset !== arg.length) {
            const buf = cachedTextEncoder.encode(arg.slice(offset));
            ptr = wasm.__wbindgen_realloc(ptr, size, size = offset + buf.length);
            getUint8Memory().set(buf, ptr + offset);
            offset += buf.length;
        }
        WASM_VECTOR_LEN = offset;
        return ptr;
    };
}
/**
*/
export class ActorId {

    static __wrap(ptr) {
        const obj = Object.create(ActorId.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_actorid_free(ptr);
    }
    /**
    * @returns {number}
    */
    get actor_id() {
        const ret = wasm.__wbg_get_actorid_actor_id(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set actor_id(arg0) {
        wasm.__wbg_set_actorid_actor_id(this.ptr, arg0);
    }
}
/**
*/
export class ActorMove {

    static __wrap(ptr) {
        const obj = Object.create(ActorMove.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_actormove_free(ptr);
    }
    /**
    * @returns {number}
    */
    get actor_id() {
        const ret = wasm.__wbg_get_actormove_actor_id(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set actor_id(arg0) {
        wasm.__wbg_set_actormove_actor_id(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get direction() {
        const ret = wasm.__wbg_get_actormove_direction(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set direction(arg0) {
        wasm.__wbg_set_actormove_direction(this.ptr, arg0);
    }
}
/**
*/
export class JS_Diff {

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_js_diff_free(ptr);
    }
    /**
    * @returns {number}
    */
    get delete_entity_id() {
        const retptr = 8;
        const ret = wasm.__wbg_get_js_diff_delete_entity_id(retptr, this.ptr);
        const memi32 = getInt32Memory();
        return memi32[retptr / 4 + 0] === 0 ? undefined : memi32[retptr / 4 + 1];
    }
    /**
    * @param {number | undefined} arg0
    */
    set delete_entity_id(arg0) {
        wasm.__wbg_set_js_diff_delete_entity_id(this.ptr, !isLikeNone(arg0), isLikeNone(arg0) ? 0 : arg0);
    }
    /**
    * @returns {number}
    */
    get upsert_entity() {
        const retptr = 8;
        const ret = wasm.__wbg_get_js_diff_upsert_entity(retptr, this.ptr);
        const memi32 = getInt32Memory();
        return memi32[retptr / 4 + 0] === 0 ? undefined : memi32[retptr / 4 + 1];
    }
    /**
    * @param {number | undefined} arg0
    */
    set upsert_entity(arg0) {
        wasm.__wbg_set_js_diff_upsert_entity(this.ptr, !isLikeNone(arg0), isLikeNone(arg0) ? 0 : arg0);
    }
    /**
    * @returns {number}
    */
    get delete_process_id() {
        const retptr = 8;
        const ret = wasm.__wbg_get_js_diff_delete_process_id(retptr, this.ptr);
        const memi32 = getInt32Memory();
        return memi32[retptr / 4 + 0] === 0 ? undefined : memi32[retptr / 4 + 1];
    }
    /**
    * @param {number | undefined} arg0
    */
    set delete_process_id(arg0) {
        wasm.__wbg_set_js_diff_delete_process_id(this.ptr, !isLikeNone(arg0), isLikeNone(arg0) ? 0 : arg0);
    }
    /**
    * @returns {number}
    */
    get upsert_process() {
        const retptr = 8;
        const ret = wasm.__wbg_get_js_diff_upsert_process(retptr, this.ptr);
        const memi32 = getInt32Memory();
        return memi32[retptr / 4 + 0] === 0 ? undefined : memi32[retptr / 4 + 1];
    }
    /**
    * @param {number | undefined} arg0
    */
    set upsert_process(arg0) {
        wasm.__wbg_set_js_diff_upsert_process(this.ptr, !isLikeNone(arg0), isLikeNone(arg0) ? 0 : arg0);
    }
    /**
    * @returns {number}
    */
    get delete_player_id() {
        const retptr = 8;
        const ret = wasm.__wbg_get_js_diff_delete_player_id(retptr, this.ptr);
        const memi32 = getInt32Memory();
        return memi32[retptr / 4 + 0] === 0 ? undefined : memi32[retptr / 4 + 1];
    }
    /**
    * @param {number | undefined} arg0
    */
    set delete_player_id(arg0) {
        wasm.__wbg_set_js_diff_delete_player_id(this.ptr, !isLikeNone(arg0), isLikeNone(arg0) ? 0 : arg0);
    }
    /**
    * @returns {number}
    */
    get upsert_player() {
        const retptr = 8;
        const ret = wasm.__wbg_get_js_diff_upsert_player(retptr, this.ptr);
        const memi32 = getInt32Memory();
        return memi32[retptr / 4 + 0] === 0 ? undefined : memi32[retptr / 4 + 1];
    }
    /**
    * @param {number | undefined} arg0
    */
    set upsert_player(arg0) {
        wasm.__wbg_set_js_diff_upsert_player(this.ptr, !isLikeNone(arg0), isLikeNone(arg0) ? 0 : arg0);
    }
}
/**
*/
export class JS_SimCommand {

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_js_simcommand_free(ptr);
    }
    /**
    * @returns {ActorMove}
    */
    get actor_move() {
        const ret = wasm.__wbg_get_js_simcommand_actor_move(this.ptr);
        return ret === 0 ? undefined : ActorMove.__wrap(ret);
    }
    /**
    * @param {ActorMove | undefined} arg0
    */
    set actor_move(arg0) {
        let ptr0 = 0;
        if (!isLikeNone(arg0)) {
            _assertClass(arg0, ActorMove);
            ptr0 = arg0.ptr;
            arg0.ptr = 0;
        }
        wasm.__wbg_set_js_simcommand_actor_move(this.ptr, ptr0);
    }
    /**
    * @returns {ActorId}
    */
    get actor_move_stop() {
        const ret = wasm.__wbg_get_js_simcommand_actor_move_stop(this.ptr);
        return ret === 0 ? undefined : ActorId.__wrap(ret);
    }
    /**
    * @param {ActorId | undefined} arg0
    */
    set actor_move_stop(arg0) {
        let ptr0 = 0;
        if (!isLikeNone(arg0)) {
            _assertClass(arg0, ActorId);
            ptr0 = arg0.ptr;
            arg0.ptr = 0;
        }
        wasm.__wbg_set_js_simcommand_actor_move_stop(this.ptr, ptr0);
    }
    /**
    * @returns {ActorId}
    */
    get actor_shoot() {
        const ret = wasm.__wbg_get_js_simcommand_actor_shoot(this.ptr);
        return ret === 0 ? undefined : ActorId.__wrap(ret);
    }
    /**
    * @param {ActorId | undefined} arg0
    */
    set actor_shoot(arg0) {
        let ptr0 = 0;
        if (!isLikeNone(arg0)) {
            _assertClass(arg0, ActorId);
            ptr0 = arg0.ptr;
            arg0.ptr = 0;
        }
        wasm.__wbg_set_js_simcommand_actor_shoot(this.ptr, ptr0);
    }
    /**
    * @returns {ActorId}
    */
    get actor_shoot_stop() {
        const ret = wasm.__wbg_get_js_simcommand_actor_shoot_stop(this.ptr);
        return ret === 0 ? undefined : ActorId.__wrap(ret);
    }
    /**
    * @param {ActorId | undefined} arg0
    */
    set actor_shoot_stop(arg0) {
        let ptr0 = 0;
        if (!isLikeNone(arg0)) {
            _assertClass(arg0, ActorId);
            ptr0 = arg0.ptr;
            arg0.ptr = 0;
        }
        wasm.__wbg_set_js_simcommand_actor_shoot_stop(this.ptr, ptr0);
    }
}
/**
*/
export class SimInterop {

    static __wrap(ptr) {
        const obj = Object.create(SimInterop.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_siminterop_free(ptr);
    }
}

export const __wbindgen_json_parse = function(arg0, arg1) {
    const ret = JSON.parse(getStringFromWasm(arg0, arg1));
    return addHeapObject(ret);
};

export const __wbindgen_json_serialize = function(arg0, arg1) {
    const ret = JSON.stringify(getObject(arg1));
    const ret0 = passStringToWasm(ret);
    const ret1 = WASM_VECTOR_LEN;
    getInt32Memory()[arg0 / 4 + 0] = ret0;
    getInt32Memory()[arg0 / 4 + 1] = ret1;
};

export const __wbg_error_569d7454c64f6dbe = function(arg0, arg1) {
    const v0 = getStringFromWasm(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 1);
    console.error(v0);
};

export const __wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm(arg0, arg1));
};

