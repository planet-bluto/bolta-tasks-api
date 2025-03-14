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
exports.reminderCheck = reminderCheck;
const server_1 = require("./server");
const bolta_tasks_core_1 = require("bolta-tasks-core");
const interval_1 = require("./interval");
const databases_1 = require("./databases");
const moment_1 = __importDefault(require("moment"));
const notifications_1 = require("./notifications");
// bro wrote nothing here
server_1.SocketIO.on('connection', (socket) => {
    print("+ Socket Connected");
});
interval_1.Interval.on("minute", (thisTimestamp) => __awaiter(void 0, void 0, void 0, function* () {
    let db = yield (0, databases_1.getDatabase)("planner_tasks");
    let docs = yield db.findAsync({});
    let tasks = docs.map(doc => new bolta_tasks_core_1.PlannerTask(doc));
    let firedTasks = (0, bolta_tasks_core_1.remindingTasks)(tasks, thisTimestamp);
    if (firedTasks.length > 0) {
        server_1.SocketIO.emit("reminder", firedTasks);
    }
}));
interval_1.Interval.on("minute", reminderCheck);
function reminderCheck(thisTimestamp) {
    return __awaiter(this, void 0, void 0, function* () {
        print("Checking reminders...");
        let db = yield (0, databases_1.getDatabase)("planner_tasks");
        let docs = yield db.findAsync({});
        let tasks = docs.map(doc => new bolta_tasks_core_1.PlannerTask(doc));
        let firedTasks = (0, bolta_tasks_core_1.remindingTasks)(tasks, thisTimestamp);
        if (firedTasks.length > 0) {
            let payload = {
                title: `Reminder for ${firedTasks.length} task${(firedTasks.length > 1 ? "s" : "")}`,
                body: `Reminder${(firedTasks.length > 1 ? "s" : "")} for ${firedTasks.map(task => task.title).join(", ")}`
            };
            server_1.SocketIO.emit("reminder_tasks", firedTasks);
            (0, notifications_1.fireNotification)(payload);
        }
        return firedTasks;
    });
}
// Wake & Sleep Alarms
interval_1.Interval.on("minute", (thisTimestamp) => __awaiter(void 0, void 0, void 0, function* () {
    let db = yield (0, databases_1.getDatabase)("planner_tasks");
    let docs = yield db.findAsync({});
    let tasks = docs.map(doc => new bolta_tasks_core_1.PlannerTask(doc));
    let thisMoment = (0, moment_1.default)(thisTimestamp);
    let today = {
        day: thisMoment.date(),
        month: thisMoment.month(),
        year: thisMoment.year()
    };
    print("Today: ", today);
    let alarms = {
        wake: (0, bolta_tasks_core_1.wakeTime)(tasks, today),
        sleep: (0, bolta_tasks_core_1.sleepTime)(tasks, today)
    };
    Object.keys(alarms).forEach((key) => {
        let this_time = alarms[key];
        print(`${key}: `, this_time, (0, moment_1.default)(this_time).format("M/D/YYYY h:mm A"));
        if (this_time != null) {
            let this_webhook = `${key.toUpperCase()}_WEBHOOKS`;
            let diff = thisMoment.millisecond(0).second(0).diff((0, moment_1.default)(this_time), "minute");
            print(diff);
            let this_time_json = (0, bolta_tasks_core_1.ClockTime_fromDate)(new Date(this_time));
            if (diff == -1) {
                server_1.SocketIO.emit(`${key}_alarm`, this_time);
                let webhooks = (process.env[this_webhook] ? process.env[this_webhook].split("|") : []);
                webhooks.forEach((webhook) => {
                    print(`sending ${key} time to webhook: `, webhook);
                    fetch(webhook, {
                        method: "POST",
                        body: JSON.stringify(this_time_json)
                    });
                });
            }
        }
    });
}));
