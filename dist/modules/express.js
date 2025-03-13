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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const cors_1 = __importDefault(require("cors"));
const bolta_tasks_core_1 = require("bolta-tasks-core");
const events_1 = require("./events");
const timers_1 = require("./timers");
const databases_1 = require("./databases");
server_1.app.use((0, cors_1.default)());
// POST bolta.planet-bluto.net/planner_tasks/ => { title: "wow!", reminders: [...], ... }
// Do I do ID assignment here?? I guess so huh....
// Also kill any pre-existing IDs bro... KILL IT
server_1.app.post("/db/:db/", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let db = yield (0, databases_1.getDatabase)(req.params.db);
    let new_doc = yield db.insertAsync(req.body);
    // res.sendStatus(200)
    events_1.Events.emit("update", req.params.db, bolta_tasks_core_1.UpdateType.NEW, new_doc);
    res.json(new_doc);
})));
// GET bolta.planet-bluto.net/reminding_tasks/1739716200000 => [{ title: "wow!", reminders: [...], ... }, ...]
server_1.app.get("/db/reminding_tasks/:timestamp", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let db = yield (0, databases_1.getDatabase)("planner_tasks");
    let docs = yield db.findAsync({});
    let tasks = docs.map(doc => (new bolta_tasks_core_1.PlannerTask(doc)));
    // print("Getting timestamp: ", Number(req.params.timestamp))
    let firedTasks = (0, bolta_tasks_core_1.remindingTasks)(tasks, Number(req.params.timestamp));
    res.json(firedTasks);
})));
// GET bolta.planet-bluto.net/planner_tasks/
// Perhaps use url params for limit and pagination??
// (load all of them at once to bomb the website free hack)
server_1.app.get("/db/:db/", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let db = yield (0, databases_1.getDatabase)(req.params.db);
    const docs = yield db.findAsync({});
    res.json(docs);
})));
// GET bolta.planet-bluto.net/planner_tasks/98123719872390232
server_1.app.get("/db/:db/:id", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let db = yield (0, databases_1.getDatabase)(req.params.db);
    const doc = yield db.findOneAsync({ _id: req.params.id });
    res.json(doc);
})));
// PATCH bolta.planet-bluto.net/planner_tasks/98123719872390232 => { title: "wow!", reminders: [...], ... }
server_1.app.patch("/db/:db/:id", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let db = yield (0, databases_1.getDatabase)(req.params.db);
    let updated = yield db.updateAsync({ _id: req.params.id }, { $set: req.body });
    // res.sendStatus(200)
    if (updated.numAffected > 0) {
        events_1.Events.emit("update", req.params.db, bolta_tasks_core_1.UpdateType.EDIT, req.params.id);
    }
    res.json(updated);
})));
// PATCH bolta.planet-bluto.net/planner_tasks/98123719872390232/insert => { title: "wow!", reminders: [...], ... }
server_1.app.patch("/db/:db/:id/insert", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // print("pepepoingpnoigspnom:", req.body)
    let db = yield (0, databases_1.getDatabase)(req.params.db);
    if (typeof (req.body.key) == 'string' && req.body.value != null) {
        let key = {};
        key[req.body.key] = req.body.value;
        let updated = yield db.updateAsync({ _id: req.params.id }, { $push: key });
        // res.sendStatus(200)
        if (updated.numAffected > 0) {
            events_1.Events.emit("update", req.params.db, bolta_tasks_core_1.UpdateType.EDIT, req.params.id);
        }
        res.json(updated);
    }
})));
// PATCH bolta.planet-bluto.net/planner_tasks/98123719872390232/edit => { title: "wow!", reminders: [...], ... }
server_1.app.patch("/db/:db/:id/edit", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // print("pepepoingpnoigspnom:", req.body)
    let db = yield (0, databases_1.getDatabase)(req.params.db);
    if (typeof (req.body.key) == 'string' && typeof (req.body.index) == 'number' && req.body.value != null) {
        let doc = yield db.findOneAsync({ _id: req.params.id });
        doc[req.body.key][req.body.index] = Object.assign(doc[req.body.key][req.body.index], req.body.value);
        let updated = yield db.updateAsync({ _id: req.params.id }, { $set: doc });
        // res.sendStatus(200)
        if (updated.numAffected > 0) {
            events_1.Events.emit("update", req.params.db, bolta_tasks_core_1.UpdateType.EDIT, req.params.id);
        }
        res.json(updated);
    }
})));
// MOVE bolta.planet-bluto.net/planner_tasks/98123719872390232/remove
server_1.app.patch("/db/:db/:id/move", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let db = yield (0, databases_1.getDatabase)(req.params.db);
    if (typeof (req.body.key) == 'string' && typeof (req.body.from) == 'number' && typeof (req.body.to) == 'number') {
        let doc = yield db.findOneAsync({ _id: req.params.id });
        doc[req.body.key].move(req.body.from, req.body.to);
        let updated = yield db.updateAsync({ _id: req.params.id }, { $set: doc });
        // res.sendStatus(200)
        if (updated.numAffected > 0) {
            events_1.Events.emit("update", req.params.db, bolta_tasks_core_1.UpdateType.EDIT, req.params.id);
        }
        res.json(updated);
    }
})));
// DELETE bolta.planet-bluto.net/planner_tasks/98123719872390232/remove
server_1.app.patch("/db/:db/:id/remove", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let db = yield (0, databases_1.getDatabase)(req.params.db);
    if (typeof (req.body.key) == 'string' && typeof (req.body.index) == 'number') {
        let doc = yield db.findOneAsync({ _id: req.params.id });
        doc[req.body.key].remove(req.body.index);
        let updated = yield db.updateAsync({ _id: req.params.id }, { $set: doc });
        // res.sendStatus(200)
        if (updated.numAffected > 0) {
            events_1.Events.emit("update", req.params.db, bolta_tasks_core_1.UpdateType.EDIT, req.params.id);
        }
        res.json(updated);
    }
})));
// DELETE bolta.planet-bluto.net/planner_tasks/98123719872390232
// bye bye :(
server_1.app.delete("/db/:db/:id", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let db = yield (0, databases_1.getDatabase)(req.params.db);
    let removed = yield db.removeAsync({ _id: req.params.id }, {});
    // res.sendStatus(200)
    if (removed > 0) {
        events_1.Events.emit("update", req.params.db, bolta_tasks_core_1.UpdateType.DELETE, req.params.id);
    }
    res.json(removed);
})));
server_1.app.get("/focus_timers/:id", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let timer = timers_1.TIMERS[req.params.id];
    let props = Object.getOwnPropertyNames(timer);
    let static_timer = {};
    props.forEach(prop => {
        if (prop == "session") {
            static_timer["session_id"] = timer[prop]._id;
        }
        else if (!["_timeout"].includes(prop)) {
            static_timer[prop] = timer[prop];
        }
    });
    if (timer != undefined) {
        res.json(static_timer);
    }
    else {
        res.json({});
    }
})));
server_1.app.patch("/focus_timers/:id/call/:method", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let timer = timers_1.TIMERS[req.params.id];
    let method = req.params.method;
    let args = (Array.isArray(req.body.args) ? req.body.args : []);
    if (timer != undefined) {
        let result = timer[method](...args);
        events_1.Events.emit("update_timer", req.params.id);
        res.send(result);
    }
    else {
        res.send();
    }
})));
