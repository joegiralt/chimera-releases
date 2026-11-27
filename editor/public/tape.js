// SPDX-License-Identifier: GPL-3.0-or-later
// TAPE import's hands for Elm's `Tape` (the state machine, which decides
// every step): the WAV chosen or dropped, tape.wasm (the firmware's own
// `chimera-import tape`, from the editor kit) reading it and making the
// source, the source heard as TAPE holds it (12-bit, at its own rate), and
// the console while the panel holds the link: the lines Elm sends, the
// unit's lines back, and a chunk's base64 lines with its `end <crc32>`
// (ADR 0106). Each request Elm sends (`tapeOut`, an `op`) is answered on
// `tapeIn`; the unit's lines come as `line`, the link going as `lost`.
var ChimeraTape = (function () {
  var CHUNK_BYTES = 256 * 1024; // PUT_CHUNK_BYTES
  var LINE_BYTES = 48; // a data line: 64 base64 characters
  var BATCH_LINES = 256; // lines a write carries
  var MAX_WAV_BYTES = 256 * 1024 * 1024; // the converter's MAX_EDITOR_WAV

  var crc32 = (typeof ChimeraUpdate !== 'undefined' ? ChimeraUpdate : require('./update.js')).crc32;

  var app = null, ports = null;
  var exportsPromise = null; // tape.wasm's exports, instantiated once (again after a trap)
  var held = null; // the last source made: { file: Uint8Array, preview: Float32Array, rate }
  var audio = null, playing = null; // the AudioContext, and the preview's node while it plays
  var dropping = false;

  function say(message) { app.ports.tapeIn.send(message); }

  // ---- tape.wasm ----

  /** `bytes` into the module's buffer that `room(len)` makes. The pointer
   * is taken first: making room may grow the memory, which detaches any
   * view made before it. */
  function copyIn(wasm, room, bytes) {
    var ptr = room(bytes.length);
    new Uint8Array(wasm.memory.buffer, ptr, bytes.length).set(bytes);
  }

  function reportOf(wasm) {
    return new TextDecoder().decode(new Uint8Array(wasm.memory.buffer, wasm.report_ptr(), wasm.report_len()));
  }

  /** `load`: the WAV read and held; { status, report }. */
  function loadWav(wasm, file, bytes) {
    var name = new TextEncoder().encode(file);
    copyIn(wasm, wasm.in_ptr, bytes);
    copyIn(wasm, wasm.text_ptr, name);
    var status = wasm.load(bytes.length, name.length);
    return { status: status, report: reportOf(wasm) };
  }

  /** `convert`: the held WAV's frames `from..to` made a source under
   * `args` (`just tape`'s flags); { status, report }, and on 0 the file
   * and the preview, copied out of the module. */
  function convertWith(wasm, args, from, to) {
    var text = new TextEncoder().encode(args.join('\n'));
    copyIn(wasm, wasm.text_ptr, text);
    var status = wasm.convert(text.length, from, to);
    var answer = { status: status, report: reportOf(wasm) };
    if (status === 0) {
      answer.file = new Uint8Array(wasm.memory.buffer, wasm.out_ptr(), wasm.out_len()).slice();
      answer.preview = new Float32Array(wasm.memory.buffer, wasm.preview_ptr(), wasm.preview_len()).slice();
      answer.rate = wasm.preview_rate();
    }
    return answer;
  }

  function instantiate(bytes) {
    return WebAssembly.instantiate(bytes, {}).then(function (made) { return made.instance.exports; });
  }

  function wasmExports() {
    if (!exportsPromise) {
      exportsPromise = fetch('tape.wasm')
        .then(function (response) {
          if (!response.ok) throw new Error('tape.wasm: ' + response.status);
          return response.arrayBuffer();
        })
        .then(instantiate);
      exportsPromise.catch(function () { exportsPromise = null; });
    }
    return exportsPromise;
  }

  /** `work(exports)`, said as `op`; a trap (the module stopped) is said as
   * `trapped`, and the module is made again for the next request. */
  async function run(op, extra, work) {
    try {
      var answer = work(await wasmExports());
      say(Object.assign({ op: op, status: answer.status, report: answer.report }, extra));
      return answer;
    } catch (error) {
      exportsPromise = null;
      say(Object.assign({ op: op, trapped: String((error && error.message) || error) }, extra));
      return null;
    }
  }

  // ---- the WAV ----

  var pending = null; // the file chosen or dropped, read once Elm asks

  /** A file chosen or dropped: held, and named to Elm, which asks for it
   * to be read (`read`) unless a copy is running. */
  function pick(file) {
    pending = file;
    say({ op: 'picked', file: file.name });
  }

  async function read() {
    var file = pending;
    pending = null;
    if (!file) return say({ op: 'loaded', file: '', trapped: 'no file' });
    if (file.size > MAX_WAV_BYTES) return say({ op: 'loaded', file: file.name, status: -4, report: 'a ' + file.size + ' B WAV' });
    var bytes;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch (error) {
      return say({ op: 'loaded', file: file.name, trapped: 'the browser could not read the file' });
    }
    await run('loaded', { file: file.name }, function (wasm) { return loadWav(wasm, file.name, bytes); });
  }

  function choose() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.wav,.wave,audio/wav,audio/x-wav';
    input.style.display = 'none';
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      input.remove();
      if (file) pick(file);
      else say({ op: 'cancelled' });
    });
    input.addEventListener('cancel', function () {
      input.remove();
      say({ op: 'cancelled' });
    });
    document.body.appendChild(input);
    input.click();
  }

  function onDragOver(event) { event.preventDefault(); }

  function onDrop(event) {
    event.preventDefault();
    var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) pick(file);
  }

  function dropOn(on) {
    if (typeof window === 'undefined' || on === dropping) return;
    dropping = on;
    var change = on ? window.addEventListener : window.removeEventListener;
    change.call(window, 'dragover', onDragOver);
    change.call(window, 'drop', onDrop);
  }

  // ---- the preview ----

  function startPlay() {
    stopPlay();
    if (!held) return say({ op: 'played' });
    var Context = window.AudioContext || window.webkitAudioContext;
    if (!audio) audio = new Context();
    var buffer = audio.createBuffer(1, held.preview.length, held.rate);
    buffer.copyToChannel(held.preview, 0);
    var node = audio.createBufferSource();
    node.buffer = buffer;
    node.connect(audio.destination);
    node.onended = function () {
      if (playing !== node) return;
      playing = null;
      say({ op: 'played' });
    };
    playing = node;
    audio.resume();
    node.start();
  }

  function stopPlay() {
    var node = playing;
    playing = null;
    if (node) node.stop();
  }

  // ---- the console ----

  function b64(bytes) {
    return btoa(String.fromCharCode.apply(null, bytes));
  }

  /** Chunk `index` of `file` as `put` takes it: its base64 lines, 48 bytes
   * a line (padding only on its last), then `end <its crc32>`. */
  function chunkLines(file, index) {
    var chunk = file.subarray(index * CHUNK_BYTES, Math.min(file.length, (index + 1) * CHUNK_BYTES));
    var lines = [];
    for (var at = 0; at < chunk.length; at += LINE_BYTES) lines.push(b64(chunk.subarray(at, at + LINE_BYTES)));
    lines.push('end ' + crc32(chunk).toString(16).padStart(8, '0'));
    return lines;
  }

  async function writeLines(lines) {
    for (var at = 0; at < lines.length; at += BATCH_LINES) {
      if (!(await ports.write(lines.slice(at, at + BATCH_LINES).join('\n')))) {
        say({ op: 'lost' });
        return false;
      }
    }
    return true;
  }

  async function sendChunk(index) {
    if (!held || index * CHUNK_BYTES >= held.file.length) return say({ op: 'chunkless', index: index });
    await writeLines(chunkLines(held.file, index));
  }

  function onLine(line) { say({ op: 'line', line: line }); }

  function onState(state) { if (state !== 'open') say({ op: 'lost' }); }

  // ---- Elm's requests ----

  async function serve(request) {
    switch (request.op) {
      case 'begin':
        ports.take({ line: onLine, state: onState });
        dropOn(true);
        return say({ op: 'begun', open: ports.isOpen() });
      case 'choose': return choose();
      case 'read': return read();
      case 'convert': {
        stopPlay();
        held = null;
        var made = await run('converted', { id: request.id }, function (wasm) { return convertWith(wasm, request.args, request.from, request.to); });
        if (made && made.status === 0) held = { file: made.file, preview: made.preview, rate: made.rate };
        return;
      }
      case 'play': return startPlay();
      case 'stop': return stopPlay();
      case 'line': return writeLines([request.line]);
      case 'chunk': return sendChunk(request.index);
      case 'end':
        stopPlay();
        dropOn(false);
        return say({ op: 'ended', link: ports.giveBack() });
    }
  }

  return {
    loadWav: loadWav,
    convertWith: convertWith,
    chunkLines: chunkLines,
    instantiate: instantiate,
    CHUNK_BYTES: CHUNK_BYTES,
    attach: function (elmApp, portsGlue) {
      app = elmApp;
      ports = portsGlue;
      if (app.ports.tapeOut) app.ports.tapeOut.subscribe(function (request) { serve(request); });
    },
  };
})();

if (typeof module !== 'undefined') module.exports = ChimeraTape;
