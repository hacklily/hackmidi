import _loadLibtimidity, { Libtimidity } from "./libtimidity";
const LibtimidityPromise = _loadLibtimidity();

LibtimidityPromise.then((libtimidity) => {
  const version = libtimidity.ccall("mid_get_version", "number", [], []);
  console.log(`Libtimidity version ${version}`);
});

type ChangeListener = (timeSec: number, playing: boolean) => void;

function invariant(condition: boolean, msg: string): void {
  if (!condition) {
    throw new Error(`Invariant violation: ${msg}`);
  }
}

class Player {
  private _songPtr: number;
  private _bytesPerSample: number;
  private _channels: number;
  private _bufferPtr: number;
  private _listeners: ChangeListener[] = [];
  private _destroyed = false;
  private _paused = true;
  private _node: ScriptProcessorNode;
  private _array: Int16Array;
  private _audioContext: AudioContext;
  private _bufferSize: number;
  private _libtimidity: Libtimidity;

  constructor(
    songPtr: number,
    bytesPerSample: number,
    channels: number,
    bufferSize: number,
    node: ScriptProcessorNode,
    audioContext: AudioContext,
    libtimidity: Libtimidity
  ) {
    invariant(songPtr !== 0, "Created a Player without a song.");
    invariant(
      bytesPerSample > 0,
      "Created a Player with invalid bytesPerSample."
    );
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

  pause(): void {
    invariant(!this._destroyed, "pause() called after destroy()");
    this._paused = true;
    const time = this.getTime();
    this._listeners.forEach((fn) => fn(time, !this.isPaused()));

    this._notify();
  }

  play(): void {
    invariant(!this._destroyed, "play() called after destroy()");
    this._paused = false;

    this._notify();
  }

  destroy(): void {
    invariant(!this._destroyed, "destroy() called after destroy()");
    this._listeners.splice(0, this._listeners.length);
    this._libtimidity.ccall("mid_song_free", null, ["number"], [this._songPtr]);
    this._songPtr = 0;
    this._destroyed = true;
    this._audioContext.close();
    this._node.disconnect();
    this._node.onaudioprocess = function () {};
  }

  /**
   * Seeks to the desired time in seconds
   */
  seek(sec: number): void {
    invariant(!this._destroyed, "seek() called after destroy()");
    const msec = Math.floor(sec * 1000);

    this._libtimidity.ccall(
      "mid_song_seek",
      null,
      ["number", "number"],
      [this._songPtr, msec]
    );

    this._notify();
  }

  /**
   * Returns time of song in seconds.
   */
  getTime(): number {
    invariant(!this._destroyed, "getTime() called after destroy()");
    return (
      this._libtimidity.ccall(
        "mid_song_get_time",
        "number",
        ["number"],
        [this._songPtr]
      ) / 1000
    );
  }

  /**
   * Returns duration of song in seconds.
   */
  getDuration(): number {
    invariant(!this._destroyed, "getTotalTime() called after destroy()");
    return (
      this._libtimidity.ccall(
        "mid_song_get_total_time",
        "number",
        ["number"],
        [this._songPtr]
      ) / 1000
    );
  }

  isPaused(): boolean {
    return this._paused;
  }

  addChangeListener(fn: ChangeListener): void {
    invariant(!this._destroyed, "addChangeListener() called after destroy()");
    this._listeners.push(fn);
  }

  removeChangeListener(fn: ChangeListener): void {
    invariant(
      !this._destroyed,
      "removeChangeListener() called after destroy()"
    );
    this._listeners.splice(this._listeners.indexOf(fn), 1);
  }

  private _handleAudioProcess = (ev: AudioProcessingEvent) => {
    const maxSamples = this._bufferSize;
    const sampleCount = this._paused ? 0 : this._renderToArray();

    if (this._channels === 1) {
      const output = ev.outputBuffer.getChannelData(0);
      for (var i = 0; i < sampleCount; i++) {
        output[i] = this._array[i] / 0x7fff;
      }
      for (var i = sampleCount; i < maxSamples; i++) {
        output[i] = 0;
      }
    } else if (this._channels === 2) {
      let output0 = ev.outputBuffer.getChannelData(0);
      let output1 = ev.outputBuffer.getChannelData(1);

      for (let i = 0; i < sampleCount; i++) {
        output0[i] = this._array[i * 2] / 0x7fff;
        output1[i] = this._array[i * 2 + 1] / 0x7fff;
      }
      for (var i = sampleCount; i < maxSamples; i++) {
        output0[i] = 0;
        output1[i] = 0;
      }
    } else {
      invariant(
        false,
        `${this._channels} is not a supported number of channels.`
      );
    }

    if (!this._paused) {
      if (sampleCount == 0) {
        this.seek(0);
        this.pause();
      } else {
        this._notify();
      }
    }
  };

  private _renderToArray(): number {
    const byteCount = this._libtimidity.ccall(
      "mid_song_read_wave",
      "number",
      ["number", "number", "number"],
      [this._songPtr, this._bufferPtr, this._bufferSize * this._bytesPerSample]
    );
    const sampleCount = byteCount / this._bytesPerSample;

    if (sampleCount !== 0) {
      // Only bother rendering if we have content.

      // TODO(jocelyn): We assume s16! Extend this.
      this._array.set(
        this._libtimidity.HEAP16.subarray(
          this._bufferPtr / 2,
          (this._bufferPtr + byteCount) / 2
        )
      );
    }

    return sampleCount;
  }

  private _notify() {
    const time = this.getTime();
    this._listeners.forEach((fn) => fn(time, !this.isPaused()));
  }
}

type Preferences = {
  formatCode: number;
  rate: number;
  channels: number;
  bufferSize: number;
};

function _loadSong(
  midiData: ArrayBuffer,
  prefs: Preferences,
  libtimidity: Libtimidity
): number {
  const optionsPtr = libtimidity.ccall(
    "mid_alloc_options",
    "number",
    ["number", "number", "number", "number"],
    [prefs.rate, prefs.formatCode, prefs.channels, prefs.bufferSize]
  );

  // Create a stream
  const midiBufferPtr = libtimidity._malloc(midiData.byteLength);
  libtimidity.HEAPU8.set(new Uint8Array(midiData), midiBufferPtr);

  const iStreamPtr = libtimidity.ccall(
    "mid_istream_open_mem",
    "number",
    ["number", "number"],
    [midiBufferPtr, midiData.byteLength]
  );

  // Now, we can try to load the song itself
  const songPtr = libtimidity.ccall(
    "mid_song_load",
    "number",
    ["number", "number"],
    [iStreamPtr, optionsPtr]
  );

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

async function _loadPatchByName(
  name: string,
  patchUrlPrefix: string,
  libtimidity: Libtimidity
): Promise<void> {
  console.log(name);
  const url = `${patchUrlPrefix}${name}`;
  const response = await fetch(url);
  if (response.status !== 200) {
    throw new Error(`Could not load ${url}`);
  }

  const data = await response.arrayBuffer();

  const pathBits = name.split("/");
  const basename = pathBits.pop();

  // Create the intermediate directories, if necessary
  let pathSoFar = "/";
  for (let i = 0; i < pathBits.length; i++) {
    try {
      libtimidity.FS.mkdir(pathSoFar + pathBits[i]);
    } catch (e) {
      // do nothing
    }
    pathSoFar += `${pathBits[i]}/`;
  }

  libtimidity.FS.writeFile(pathSoFar + basename, new Uint8Array(data), {
    encoding: "binary",
  });
}

const TAudioContext: typeof AudioContext =
  (window as any).AudioContext || (window as any).webkitAudioContext;

let _loaded = false;

function iosHack(audioContext: AudioContext) {
  const resume = function () {
    audioContext.resume();

    setTimeout(function () {
      if (audioContext.state === "running") {
        document.body.removeEventListener("touchend", resume, false);
      }
    }, 0);
  };

  document.body.addEventListener("touchend", resume, false);
}

export function playerFromMIDIBuffer(
  midiData: ArrayBuffer,
  patchUrlPrefix: string
): Promise<Player> {
  // We need to do this in this context in case we're in Safari. Safari requires AudioContexts
  // to be created in response to a user event.
  invariant(TAudioContext != null, "Environment must support AudioContext.");

  const audioContext = new TAudioContext();
  iosHack(audioContext);
  return _playerFromMIDIBuffer(midiData, patchUrlPrefix, audioContext);
}

async function _playerFromMIDIBuffer(
  midiData: ArrayBuffer,
  patchUrlPrefix: string,
  audioContext: AudioContext
): Promise<Player> {
  const prefs: Preferences = {
    formatCode: 0x8010, // s16
    rate: audioContext.sampleRate,
    channels: 2,
    bufferSize: 8192,
  };

  const libtimidity = await LibtimidityPromise;

  var node = audioContext.createScriptProcessor(
    prefs.bufferSize,
    0,
    prefs.channels
  );
  node.connect(audioContext.destination);

  if (!_loaded) {
    let config = await fetch(`${patchUrlPrefix}timidity.cfg`);
    if (config.status >= 400) {
      throw new Error("Could not get timidity.cfg");
    }
    let configText = await config.text();
    libtimidity.FS.writeFile("/timidity.cfg", configText);
    libtimidity.ccall("mid_init", "number", ["string"], ["/timidity.cfg"]);
    _loaded = true;
  }

  let songPtr = _loadSong(midiData, prefs, libtimidity);

  // Is it missing any patch files?
  const missingPatchCount = libtimidity.ccall(
    "mid_get_load_request_count",
    "number",
    ["number"],
    [songPtr]
  );

  if (missingPatchCount > 0) {
    await Promise.all(
      // Continue once we load all the patches asynchronously.
      Array(missingPatchCount)
        .fill(null) // Create an array with reqCount nulls.
        .map((_, i) =>
          libtimidity.ccall(
            // Get the names of the required patches
            "mid_get_load_request",
            "string",
            ["number", "number"],
            [songPtr, i]
          )
        )
        .map((patchName) =>
          _loadPatchByName(patchName, patchUrlPrefix, libtimidity)
        )
    ); // Load 'em

    // We need to try loading the song again, now that we've loaded the patches.
    libtimidity.ccall("mid_song_free", null, ["number"], [songPtr]);
    songPtr = _loadSong(midiData, prefs, libtimidity);
    const newReqCount = libtimidity.ccall(
      "mid_get_load_request_count",
      "number",
      ["number"],
      [songPtr]
    );
    if (newReqCount !== 0) {
      libtimidity.ccall("mid_song_free", null, ["number"], [songPtr]);
      throw new Error("Could not load all patches.");
    }
  }

  // If we got here, all the patch files are OK!
  const player = new Player(
    songPtr,
    prefs.channels * ((prefs.formatCode & 0xff) == 16 ? 2 : 1),
    prefs.channels,
    prefs.bufferSize,
    node,
    audioContext,
    libtimidity
  );

  return player;
}
