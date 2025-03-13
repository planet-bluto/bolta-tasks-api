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
exports.Events = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const server_1 = require("./server");
const databases_1 = require("./databases");
class EventsClass extends eventemitter3_1.default {
}
exports.Events = new EventsClass();
exports.Events.on("update", (db_key_1, type_1, ...args_1) => __awaiter(void 0, [db_key_1, type_1, ...args_1], void 0, function* (db_key, type, data = null) {
    server_1.SocketIO.emit("update", db_key, type, data);
    let db = yield (0, databases_1.getDatabase)(db_key);
    const docs = yield db.findAsync({});
    server_1.SocketIO.emit("update_with_data", db_key, docs);
}));
exports.Events.on("update_timer", (timer_id) => {
    server_1.SocketIO.emit("update_timer", timer_id);
});
