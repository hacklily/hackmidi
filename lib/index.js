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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerFromMIDIBuffer = void 0;
var libtimidity_1 = __importDefault(require("./libtimidity"));
var LibtimidityPromise = (0, libtimidity_1.default)();
LibtimidityPromise.then(function (libtimidity) {
    var version = libtimidity.ccall("mid_get_version", "number", [], []);
    console.log("Libtimidity version ".concat(version));
});
function invariant(condition, msg) {
    if (!condition) {
        throw new Error("Invariant violation: ".concat(msg));
    }
}
var Player = /** @class */ (function () {
    function Player(songPtr, bytesPerSample, channels, bufferSize, node, audioContext, libtimidity) {
        var _this = this;
        this._listeners = [];
        this._destroyed = false;
        this._paused = true;
        this._handleAudioProcess = function (ev) {
            var maxSamples = _this._bufferSize;
            var sampleCount = _this._paused ? 0 : _this._renderToArray();
            if (_this._channels === 1) {
                var output = ev.outputBuffer.getChannelData(0);
                for (var i = 0; i < sampleCount; i++) {
                    output[i] = _this._array[i] / 0x7FFF;
                }
                for (var i = sampleCount; i < maxSamples; i++) {
                    output[i] = 0;
                }
            }
            else if (_this._channels === 2) {
                var output0 = ev.outputBuffer.getChannelData(0);
                var output1 = ev.outputBuffer.getChannelData(1);
                for (var i_1 = 0; i_1 < sampleCount; i_1++) {
                    output0[i_1] = _this._array[i_1 * 2] / 0x7FFF;
                    output1[i_1] = _this._array[i_1 * 2 + 1] / 0x7FFF;
                }
                for (var i = sampleCount; i < maxSamples; i++) {
                    output0[i] = 0;
                    output1[i] = 0;
                }
            }
            else {
                invariant(false, "".concat(_this._channels, " is not a supported number of channels."));
            }
            if (!_this._paused) {
                if (sampleCount == 0) {
                    _this.seek(0);
                    _this.pause();
                }
                else {
                    _this._notify();
                }
            }
        };
        invariant(songPtr !== 0, "Created a Player without a song.");
        invariant(bytesPerSample > 0, "Created a Player with invalid bytesPerSample.");
        invariant(node != null, "A Player requires a ScriptProcessorNode");
        this._songPtr = songPtr;
        this._bytesPerSample = bytesPerSample;
        this._channels = channels;
        this._bufferSize = bufferSize;
        this._bufferPtr = libtimidity._malloc(bufferSize * this._bytesPerSample);
        this._node = node;
        this._array = new Int16Array(this._bufferSize * this._channels);
        this._audioContext = audioContext;
        this._libtimidity = libtimidity;
        node.onaudioprocess = this._handleAudioProcess;
        libtimidity.ccall("mid_song_start", null, ["number"], [this._songPtr]);
    }
    Player.prototype.pause = function () {
        var _this = this;
        invariant(!this._destroyed, "pause() called after destroy()");
        this._paused = true;
        var time = this.getTime();
        this._listeners.forEach(function (fn) { return fn(time, !_this.isPaused()); });
        this._notify();
    };
    Player.prototype.play = function () {
        invariant(!this._destroyed, "play() called after destroy()");
        this._paused = false;
        this._notify();
    };
    Player.prototype.destroy = function () {
        invariant(!this._destroyed, "destroy() called after destroy()");
        this._listeners.splice(0, this._listeners.length);
        this._libtimidity.ccall("mid_song_free", null, ["number"], [this._songPtr]);
        this._songPtr = 0;
        this._destroyed = true;
        this._audioContext.close();
        this._node.disconnect();
        this._node.onaudioprocess = function () { };
    };
    /**
     * Seeks to the desired time in seconds
     */
    Player.prototype.seek = function (sec) {
        invariant(!this._destroyed, "seek() called after destroy()");
        var msec = Math.floor(sec * 1000);
        this._libtimidity.ccall("mid_song_seek", null, ["number", "number"], [this._songPtr, msec]);
        this._notify();
    };
    /**
     * Returns time of song in seconds.
     */
    Player.prototype.getTime = function () {
        invariant(!this._destroyed, "getTime() called after destroy()");
        return this._libtimidity.ccall("mid_song_get_time", "number", ["number"], [this._songPtr]) / 1000;
    };
    /**
     * Returns duration of song in seconds.
     */
    Player.prototype.getDuration = function () {
        invariant(!this._destroyed, "getTotalTime() called after destroy()");
        return this._libtimidity.ccall("mid_song_get_total_time", "number", ["number"], [this._songPtr]) / 1000;
    };
    Player.prototype.isPaused = function () {
        return this._paused;
    };
    Player.prototype.addChangeListener = function (fn) {
        invariant(!this._destroyed, "addChangeListener() called after destroy()");
        this._listeners.push(fn);
    };
    Player.prototype.removeChangeListener = function (fn) {
        invariant(!this._destroyed, "removeChangeListener() called after destroy()");
        this._listeners.splice(this._listeners.indexOf(fn), 1);
    };
    Player.prototype._renderToArray = function () {
        var byteCount = this._libtimidity.ccall("mid_song_read_wave", "number", ["number", "number", "number"], [this._songPtr, this._bufferPtr, this._bufferSize * this._bytesPerSample]);
        var sampleCount = byteCount / this._bytesPerSample;
        if (sampleCount !== 0) {
            // Only bother rendering if we have content.
            // TODO(jocelyn): We assume s16! Extend this.
            this._array.set(this._libtimidity.HEAP16.subarray(this._bufferPtr / 2, (this._bufferPtr + byteCount) / 2));
        }
        return sampleCount;
    };
    Player.prototype._notify = function () {
        var _this = this;
        var time = this.getTime();
        this._listeners.forEach(function (fn) { return fn(time, !_this.isPaused()); });
    };
    return Player;
}());
function _getDefaultPreferences() {
    return {
        formatCode: 0x8010,
        rate: 44100,
        channels: 2,
        bufferSize: 8192,
    };
}
function _loadSong(midiData, prefs, libtimidity) {
    var optionsPtr = libtimidity.ccall("mid_alloc_options", "number", ["number", "number", "number", "number"], [prefs.rate, prefs.formatCode, prefs.channels, prefs.bufferSize]);
    // Create a stream
    var midiBufferPtr = libtimidity._malloc(midiData.byteLength);
    libtimidity.HEAPU8.set(new Uint8Array(midiData), midiBufferPtr);
    var iStreamPtr = libtimidity.ccall("mid_istream_open_mem", "number", ["number", "number"], [midiBufferPtr, midiData.byteLength]);
    // Now, we can try to load the song itself
    var songPtr = libtimidity.ccall("mid_song_load", "number", ["number", "number"], [iStreamPtr, optionsPtr]);
    if (songPtr === 0) {
        // Something failed.
        // TODO: Get some kinda error info from the library?
        libtimidity.ccall("mid_istream_close", "number", ["number"], [iStreamPtr]);
        libtimidity._free(optionsPtr);
        libtimidity._free(midiBufferPtr);
        throw new Error("Could not load that MIDI file.");
    }
    // We've got a song!
    // Clean up stuff we don't need any more
    libtimidity.ccall("mid_istream_close", "number", ["number"], [iStreamPtr]);
    libtimidity._free(optionsPtr);
    libtimidity._free(midiBufferPtr);
    return songPtr;
}
function _loadPatchByName(name, patchUrlPrefix, libtimidity) {
    return __awaiter(this, void 0, void 0, function () {
        var url, response, data, pathBits, basename, pathSoFar, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(name);
                    url = "".concat(patchUrlPrefix).concat(name);
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    response = _a.sent();
                    if (response.status !== 200) {
                        throw new Error("Could not load ".concat(url));
                    }
                    return [4 /*yield*/, response.arrayBuffer()];
                case 2:
                    data = _a.sent();
                    pathBits = name.split('/');
                    basename = pathBits.pop();
                    pathSoFar = '/';
                    for (i = 0; i < pathBits.length; i++) {
                        try {
                            libtimidity.FS.mkdir(pathSoFar + pathBits[i]);
                        }
                        catch (e) {
                            // do nothing
                        }
                        pathSoFar += "".concat(pathBits[i], "/");
                    }
                    libtimidity.FS.writeFile(pathSoFar + basename, new Uint8Array(data), {
                        encoding: 'binary',
                    });
                    return [2 /*return*/];
            }
        });
    });
}
var TAudioContext = window.AudioContext ||
    window.webkitAudioContext;
var _loaded = false;
function iosHack(audioContext) {
    var resume = function () {
        audioContext.resume();
        setTimeout(function () {
            if (audioContext.state === 'running') {
                document.body.removeEventListener('touchend', resume, false);
            }
        }, 0);
    };
    document.body.addEventListener('touchend', resume, false);
}
function playerFromMIDIBuffer(midiData, patchUrlPrefix) {
    // We need to do this in this context in case we're in Safari. Safari requires AudioContexts
    // to be created in response to a user event.
    invariant(TAudioContext != null, "Environment must support AudioContext.");
    var audioContext = new TAudioContext();
    iosHack(audioContext);
    return _playerFromMIDIBuffer(midiData, patchUrlPrefix, audioContext);
}
exports.playerFromMIDIBuffer = playerFromMIDIBuffer;
function _playerFromMIDIBuffer(midiData, patchUrlPrefix, audioContext) {
    return __awaiter(this, void 0, void 0, function () {
        var prefs, libtimidity, node, config, configText, songPtr, missingPatchCount, newReqCount, player;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prefs = _getDefaultPreferences();
                    return [4 /*yield*/, LibtimidityPromise];
                case 1:
                    libtimidity = _a.sent();
                    node = audioContext.createScriptProcessor(prefs.bufferSize, 0, prefs.channels);
                    node.connect(audioContext.destination);
                    if (!!_loaded) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetch("".concat(patchUrlPrefix, "timidity.cfg"))];
                case 2:
                    config = _a.sent();
                    if (config.status >= 400) {
                        throw new Error("Could not get timidity.cfg");
                    }
                    return [4 /*yield*/, config.text()];
                case 3:
                    configText = _a.sent();
                    libtimidity.FS.writeFile("/timidity.cfg", configText);
                    libtimidity.ccall("mid_init", "number", ["string"], ["/timidity.cfg"]);
                    _loaded = true;
                    _a.label = 4;
                case 4:
                    songPtr = _loadSong(midiData, prefs, libtimidity);
                    missingPatchCount = libtimidity.ccall("mid_get_load_request_count", "number", ["number"], [songPtr]);
                    if (!(missingPatchCount > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, Promise.all(// Continue once we load all the patches asynchronously.
                        Array(missingPatchCount).fill(null) // Create an array with reqCount nulls.
                            .map(function (_, i) { return libtimidity.ccall(// Get the names of the required patches
                        "mid_get_load_request", "string", ["number", "number"], [songPtr, i]); })
                            .map(function (patchName) { return _loadPatchByName(patchName, patchUrlPrefix, libtimidity); }))];
                case 5:
                    _a.sent(); // Load 'em
                    // We need to try loading the song again, now that we've loaded the patches.
                    libtimidity.ccall("mid_song_free", null, ["number"], [songPtr]);
                    songPtr = _loadSong(midiData, prefs, libtimidity);
                    newReqCount = libtimidity.ccall("mid_get_load_request_count", "number", ["number"], [songPtr]);
                    if (newReqCount !== 0) {
                        libtimidity.ccall("mid_song_free", null, ["number"], [songPtr]);
                        throw new Error("Could not load all patches.");
                    }
                    _a.label = 6;
                case 6:
                    player = new Player(songPtr, prefs.channels * (((prefs.formatCode & 0xFF) == 16) ? 2 : 1), prefs.channels, prefs.bufferSize, node, audioContext, libtimidity);
                    return [2 /*return*/, player];
            }
        });
    });
}
