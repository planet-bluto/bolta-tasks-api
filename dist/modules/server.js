"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIO = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
exports.app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(exports.app);
exports.SocketIO = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*', // Replace with your client's origin
        methods: ['*'],
    },
});
exports.app.use(express_1.default.json());
require("./socket");
require("./express");
httpServer.listen(process.env.WEB_PORT, () => {
    print(`Web Server Listening... (${process.env.WEB_PORT})`);
});
