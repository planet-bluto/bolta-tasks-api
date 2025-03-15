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
exports.getDatabase = getDatabase;
exports._cache_update = _cache_update;
exports.getDatabaseStatic = getDatabaseStatic;
const nedb_1 = __importDefault(require("@seald-io/nedb"));
const events_1 = require("./events");
let db_cache = {};
function getDatabase(db_key_1) {
    return __awaiter(this, arguments, void 0, function* (db_key, preload = false) {
        if (db_cache == undefined || db_cache[db_key] == null || preload) {
            db_cache[db_key] = new nedb_1.default({ filename: `./db/${db_key}.db` });
            yield db_cache[db_key].loadDatabaseAsync();
            _cache_update(db_key);
            return db_cache[db_key];
        }
        else {
            return db_cache[db_key];
        }
    });
}
function _cache_update(db_key) {
    return __awaiter(this, void 0, void 0, function* () {
        let db = yield getDatabase(db_key);
        const docs = yield db.findAsync({});
        db_doc_cache[db_key] = docs;
        return docs;
    });
}
events_1.Events.on("update", (db_key) => {
    _cache_update(db_key);
});
let db_doc_cache = {};
function getDatabaseStatic(db_key) { return db_doc_cache[db_key]; }
