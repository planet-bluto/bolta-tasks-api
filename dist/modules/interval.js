"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interval = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
let thisSecond = () => Math.floor((Date.now()) / 1000) * 1000;
let nextSecond = () => Math.floor((Date.now() + 1000) / 1000) * 1000;
class IntervalClass extends eventemitter3_1.default {
    constructor() {
        super();
        let interval = () => {
            let timestamp = thisSecond();
            this.emit("second", timestamp);
            if (timestamp % 60000 == 0) {
                this.emit("minute", timestamp);
            }
        };
        // print(`Running In: ${nextMinute() - Date.now()}`)
        setTimeout(() => {
            interval();
            setInterval(() => {
                interval();
            }, 1000);
        }, nextSecond() - Date.now());
    }
}
exports.Interval = new IntervalClass();
