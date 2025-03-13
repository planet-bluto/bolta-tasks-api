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
Array.prototype.shuffle = function () {
    let currentIndex = this.length, randomIndex;
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [this[currentIndex], this[randomIndex]] = [
            this[randomIndex], this[currentIndex]
        ];
    }
};
Array.prototype.random = function () {
    let randomIndex = Math.floor(Math.random() * (this.length));
    return this[randomIndex];
};
Array.prototype.awaitForEach = function (func) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield Promise.all(this.map((...args) => func(...args))));
    });
};
Array.prototype.asyncForEach = function (func) {
    return __awaiter(this, void 0, void 0, function* () {
        var i = 0;
        var length = this.length;
        var funcs = [];
        var reses = [];
        return new Promise((res, rej) => __awaiter(this, void 0, void 0, function* () {
            this.forEach((...args) => {
                funcs.push(func.bind(this, ...args));
            });
            function loop() {
                return __awaiter(this, void 0, void 0, function* () {
                    var this_res = yield funcs[i]();
                    reses.push(this_res);
                    i++;
                    if (i == length) {
                        res(reses);
                    }
                    else {
                        loop();
                    }
                });
            }
            loop();
        }));
    });
};
Array.prototype.remove = function (ind) {
    if (ind < this.length - 1) {
        return this.splice(ind, 1)[0];
    }
    else {
        return this.pop();
    }
};
Array.prototype.pat = function (entry) {
    var ind = this.indexOf(entry);
    if (ind == -1) {
        this.push(entry);
    }
    else {
        this[ind] = entry;
    }
};
Array.prototype.remove_duplicates = function () {
    return this.filter((entry, ind) => this.indexOf(entry) == ind);
};
Array.prototype.move = function (from, to) {
    if (to >= this.length) {
        var k = to - this.length + 1;
        while (k--) {
            this.push(undefined);
        }
    }
    this.splice(to, 0, this.splice(from, 1)[0]);
};
