"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bolta_tasks_core_1 = require("bolta-tasks-core");
const databases_1 = require("./databases");
bolta_tasks_core_1.Interfacer["resolveSchedule"] = (schedule_id) => {
    let docs = (0, databases_1.getDatabaseStatic)("schedules");
    let raw_schedule = docs.find((doc) => doc._id == schedule_id);
    return (new bolta_tasks_core_1.Schedule(raw_schedule));
};
