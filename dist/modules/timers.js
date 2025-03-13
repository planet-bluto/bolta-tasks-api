"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIMERS = exports.FocusTimer = void 0;
const bolta_tasks_core_1 = require("bolta-tasks-core");
const databases_1 = require("./databases");
const events_1 = require("./events");
const notifications_1 = require("./notifications");
function wrapNumber(num, min, max) {
    const range = max - min + 1;
    return (num - min) % range + min;
}
class FocusTimer {
    constructor(session) {
        this.running = false;
        this._elapsed = 0;
        this._start_time = 0;
        this._timeout = null;
        // super()
        this.session = session;
        this.intervals = 0;
        // this.on("expired", this._expired)
    }
    get perc() {
        return (1.0 - (this.time_remaining / this.current_interval.duration));
    }
    get current_interval_index() {
        // return (this.intervals % this.session.interval.length)
        return wrapNumber(this.intervals, 0, this.session.interval.length - 1);
    }
    get current_interval() {
        return this.session.interval[this.current_interval_index];
    }
    get time_remaining() {
        let _raw = this.current_interval.duration - (this.running ? Date.now() - this._start_time : 0) - (this._elapsed);
        return Math.max(_raw, 0);
    }
    _hard_stop() {
        this._elapsed = 0;
        this.reset();
    }
    _expired() {
        this._hard_stop();
        this.intervals += 1;
        events_1.Events.emit("update_timer", this.session._id);
        (0, notifications_1.fireNotification)({
            title: `Focus Timer for '${this.session.title}' Expired!`,
            body: `Now on '${this.current_interval.label}'!`
        });
    }
    back() {
        this._hard_stop();
        if (this.intervals == 0) {
            this.intervals = this.session.interval.length - 1;
        }
        else {
            this.intervals -= 1;
        }
    }
    next() {
        this._hard_stop();
        this.intervals += 1;
    }
    jump(interval) {
        this._hard_stop();
        this.intervals = interval;
    }
    start() {
        if (this.running) {
            return;
        }
        this.running = true;
        this._start_time = Date.now();
        this._timeout = setTimeout(() => {
            this._expired();
        }, this.current_interval.duration - (this._elapsed));
    }
    pause() {
        if (!this.running) {
            return;
        }
        this.running = false;
        this._elapsed += Date.now() - this._start_time;
        clearTimeout(this._timeout);
    }
    reset() {
        this.running = false;
        this._elapsed = 0;
        clearTimeout(this._timeout);
    }
    seek(ms) {
        if (this.running) {
            this.running = false;
            clearTimeout(this._timeout);
        }
        this._elapsed = ms;
    }
}
exports.FocusTimer = FocusTimer;
//// TIMER MANAGEMENT
exports.TIMERS = {};
(0, databases_1.getDatabase)("focus_sessions").then((db) => __awaiter(void 0, void 0, void 0, function* () {
    const docs = yield db.findAsync({});
    docs.forEach(doc => {
        exports.TIMERS[doc._id] = new FocusTimer(doc);
    });
}));
events_1.Events.on("update", (db_key_1, type_1, ...args_1) => __awaiter(void 0, [db_key_1, type_1, ...args_1], void 0, function* (db_key, type, data = null) {
    if (db_key == "focus_sessions") {
        switch (type) {
            case bolta_tasks_core_1.UpdateType.NEW:
                exports.TIMERS[data._id] = new FocusTimer(new bolta_tasks_core_1.FocusSession(data));
                break;
            case bolta_tasks_core_1.UpdateType.EDIT:
                let db = yield (0, databases_1.getDatabase)("focus_sessions");
                const doc = yield db.findOneAsync({ _id: data });
                exports.TIMERS[data] = new FocusTimer(new bolta_tasks_core_1.FocusSession(doc));
                break;
            case bolta_tasks_core_1.UpdateType.DELETE:
                delete exports.TIMERS[data];
                break;
        }
    }
}));
