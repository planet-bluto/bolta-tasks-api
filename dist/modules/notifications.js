"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fireNotification = fireNotification;
const server_1 = require("./server");
function fireNotification(payload) {
    var _a, _b;
    server_1.SocketIO.emit("notification", payload);
    let webhooks = (((_a = process.env) === null || _a === void 0 ? void 0 : _a.WEBHOOKS) ? (_b = process.env) === null || _b === void 0 ? void 0 : _b.WEBHOOKS.split("|") : []);
    webhooks.forEach((webhook) => {
        print("sending notification to webhook: ", webhook);
        fetch(webhook, {
            method: "POST",
            body: JSON.stringify(payload)
        });
    });
}
