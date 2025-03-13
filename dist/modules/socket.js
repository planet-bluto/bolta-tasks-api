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
interval_1.Interval.on("minute", (thisTimestamp) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let db = yield (0, databases_1.getDatabase)("planner_tasks");
    let docs = yield db.findAsync({});
    let tasks = docs.map(doc => new bolta_tasks_core_1.PlannerTask(doc));
    let thisMoment = (0, moment_1.default)(thisTimestamp);
    let today = {
        day: thisMoment.date(),
        month: thisMoment.month(),
        year: thisMoment.year()
    };
    let wake_time = (0, bolta_tasks_core_1.wakeTime)(tasks, today);
    print(wake_time);
    let diff = thisMoment.millisecond(0).second(0).diff((0, moment_1.default)(wake_time), "minute");
    print(diff);
    if (diff == -1) {
        let webhooks = (((_a = process.env) === null || _a === void 0 ? void 0 : _a.WAKE_WEBHOOKS) ? (_b = process.env) === null || _b === void 0 ? void 0 : _b.WAKE_WEBHOOKS.split("|") : []);
        webhooks.forEach((webhook) => {
            print("sending wake time to webhook: ", webhook);
            fetch(webhook, {
                method: "POST",
                body: JSON.stringify(wake_time)
            });
        });
    }
}));
