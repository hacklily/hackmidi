export class LibtimidityCalls {
  ccall(
    fn: "mid_get_version",
    retType: "number",
    argTypes: void[],
    args: void[]
  ): void;
  ccall(
    fn: "mid_init",
    retType: "number",
    argTypes: ["string"],
    args: [string]
  ): void;
  ccall(
    fn: "mid_init_no_config",
    retType: "number",
    argTypes: void[],
    args: void[]
  ): void;
  ccall(fn: "mid_exit", retType: null, argTypes: void[], args: void[]): void;
  ccall(
    fn: "mid_istream_open_mem",
    retType: "number",
    argTypes: ["number", "number"],
    args: [number, number]
  ): number;
  ccall(
    fn: "mid_istream_close",
    retType: "number",
    argTypes: ["number"],
    args: [number]
  ): number;
  ccall(
    fn: "mid_song_load",
    retType: "number",
    argTypes: ["number", "number"],
    args: [number, number]
  ): number;
  ccall(
    fn: "mid_song_set_volume",
    retType: null,
    argTypes: ["number", "number"],
    args: [number, number]
  ): void;
  ccall(
    fn: "mid_song_start",
    retType: null,
    argTypes: ["number"],
    args: [number]
  ): void;
  ccall(
    fn: "mid_song_read_wave",
    retType: "number",
    argTypes: ["number", "number", "number"],
    args: [number, number, number]
  ): number;
  ccall(
    fn: "mid_song_seek",
    retType: null,
    argTypes: ["number", "number"],
    args: [number, number]
  ): void;
  ccall(
    fn: "mid_song_get_total_time",
    retType: "number",
    argTypes: ["number"],
    args: [number]
  ): number;
  ccall(
    fn: "mid_song_get_time",
    retType: "number",
    argTypes: ["number"],
    args: [number]
  ): number;
  ccall(
    fn: "mid_song_free",
    retType: null,
    argTypes: ["number"],
    args: [number]
  ): void;
  ccall(
    fn: "mid_alloc_options",
    retType: "number",
    argTypes: ["number", "number", "number", "number"],
    args: [number, number, number, number]
  ): number;
  ccall(
    fn: "mid_get_load_request",
    retType: "string",
    argTypes: ["number", "number"],
    args: [number, number]
  ): string;
  ccall(
    fn: "mid_get_load_request_count",
    retType: "number",
    argTypes: ["number"],
    args: [number]
  ): number;
}

// Everything that follows is blatently copied from
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/emscripten/index.d.ts

interface Lookup {
  path: string;
  node: FSNode;
}

interface FSStream {}
interface FSNode {}
interface ErrnoError {}

interface FileSystemType {}

declare class FS {
  ignorePermissions: boolean;
  trackingDelegate: any;
  tracking: any;
  genericErrors: any;

  //
  // paths
  //
  lookupPath(path: string, opts: any): Lookup;
  getPath(node: FSNode): string;

  //
  // nodes
  //
  isFile(mode: number): boolean;
  isDir(mode: number): boolean;
  isLink(mode: number): boolean;
  isChrdev(mode: number): boolean;
  isBlkdev(mode: number): boolean;
  isFIFO(mode: number): boolean;
  isSocket(mode: number): boolean;

  //
  // devices
  //
  major(dev: number): number;
  minor(dev: number): number;
  makedev(ma: number, mi: number): number;
  registerDevice(dev: number, ops: any): void;

  //
  // core
  //
  syncfs(populate: boolean, callback: (e: any) => any): void;
  syncfs(callback: (e: any) => any, populate?: boolean): void;
  mount(type: FileSystemType, opts: any, mountpoint: string): any;
  unmount(mountpoint: string): void;

  mkdir(path: string, mode?: number): any;
  mkdev(path: string, mode?: number, dev?: number): any;
  symlink(oldpath: string, newpath: string): any;
  rename(old_path: string, new_path: string): void;
  rmdir(path: string): void;
  readdir(path: string): any;
  unlink(path: string): void;
  readlink(path: string): string;
  stat(path: string, dontFollow?: boolean): any;
  lstat(path: string): any;
  chmod(path: string, mode: number, dontFollow?: boolean): void;
  lchmod(path: string, mode: number): void;
  fchmod(fd: number, mode: number): void;
  chown(path: string, uid: number, gid: number, dontFollow?: boolean): void;
  lchown(path: string, uid: number, gid: number): void;
  fchown(fd: number, uid: number, gid: number): void;
  truncate(path: string, len: number): void;
  ftruncate(fd: number, len: number): void;
  utime(path: string, atime: number, mtime: number): void;
  open(
    path: string,
    flags: string,
    mode?: number,
    fd_start?: number,
    fd_end?: number
  ): FSStream;
  close(stream: FSStream): void;
  llseek(stream: FSStream, offset: number, whence: number): any;
  read(
    stream: FSStream,
    buffer: ArrayBufferView,
    offset: number,
    length: number,
    position?: number
  ): number;
  write(
    stream: FSStream,
    buffer: ArrayBufferView,
    offset: number,
    length: number,
    position?: number,
    canOwn?: boolean
  ): number;
  allocate(stream: FSStream, offset: number, length: number): void;
  mmap(
    stream: FSStream,
    buffer: ArrayBufferView,
    offset: number,
    length: number,
    position: number,
    prot: number,
    flags: number
  ): any;
  ioctl(stream: FSStream, cmd: any, arg: any): any;
  readFile(path: string, opts?: { encoding: string; flags: string }): any;
  writeFile(
    path: string,
    data: ArrayBufferView,
    opts?: { encoding: string; flags?: string }
  ): void;
  writeFile(
    path: string,
    data: string,
    opts?: { encoding: string; flags?: string }
  ): void;

  //
  // module-level FS code
  //
  cwd(): string;
  chdir(path: string): void;
  init(
    input: () => number,
    output: (c: number) => any,
    error: (c: number) => any
  ): void;

  createLazyFile(
    parent: string,
    name: string,
    url: string,
    canRead: boolean,
    canWrite: boolean
  ): FSNode;
  createLazyFile(
    parent: FSNode,
    name: string,
    url: string,
    canRead: boolean,
    canWrite: boolean
  ): FSNode;

  createPreloadedFile(
    parent: string,
    name: string,
    url: string,
    canRead: boolean,
    canWrite: boolean,
    onload?: () => void,
    onerror?: () => void,
    dontCreateFile?: boolean,
    canOwn?: boolean
  ): void;
  createPreloadedFile(
    parent: FSNode,
    name: string,
    url: string,
    canRead: boolean,
    canWrite: boolean,
    onload?: () => void,
    onerror?: () => void,
    dontCreateFile?: boolean,
    canOwn?: boolean
  ): void;
}

export class Libtimidity extends LibtimidityCalls {
  print(str: string): void;
  printErr(str: string): void;

  destroy(object: object): void;
  getPreloadedPackage(
    remotePackageName: string,
    remotePackageSize: number
  ): ArrayBuffer;
  locateFile(url: string): string;
  onCustomMessage(event: MessageEvent): void;

  setValue(ptr: number, value: any, type: string, noSafe?: boolean): void;
  getValue(ptr: number, type: string, noSafe?: boolean): number;

  ALLOC_NORMAL: number;
  ALLOC_STACK: number;
  ALLOC_STATIC: number;
  ALLOC_DYNAMIC: number;
  ALLOC_NONE: number;

  allocate(slab: any, types: string, allocator: number, ptr: number): number;
  allocate(slab: any, types: string[], allocator: number, ptr: number): number;

  Pointer_stringify(ptr: number, length?: number): string;
  UTF16ToString(ptr: number): string;
  stringToUTF16(str: string, outPtr: number): void;
  UTF32ToString(ptr: number): string;
  stringToUTF32(str: string, outPtr: number): void;

  // USE_TYPED_ARRAYS == 1
  HEAP: Int32Array;
  IHEAP: Int32Array;
  FHEAP: Float64Array;

  // USE_TYPED_ARRAYS == 2
  HEAP8: Int8Array;
  HEAP16: Int16Array;
  HEAP32: Int32Array;
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;

  TOTAL_STACK: number;
  TOTAL_MEMORY: number;
  FAST_MEMORY: number;

  addOnPreRun(cb: () => any): void;
  addOnInit(cb: () => any): void;
  addOnPreMain(cb: () => any): void;
  addOnExit(cb: () => any): void;
  addOnPostRun(cb: () => any): void;

  // Tools
  intArrayFromString(
    stringy: string,
    dontAddNull?: boolean,
    length?: number
  ): number[];
  intArrayToString(array: number[]): string;
  writeStringToMemory(str: string, buffer: number, dontAddNull: boolean): void;
  writeArrayToMemory(array: number[], buffer: number): void;
  writeAsciiToMemory(str: string, buffer: number, dontAddNull: boolean): void;

  addRunDependency(id: any): void;
  removeRunDependency(id: any): void;

  preloadedImages: any;
  preloadedAudios: any;

  _malloc(size: number): number;
  _free(ptr: number): void;

  FS: FS;
}

declare function _loadLibtimidity(): Promise<Libtimidity>;
export default _loadLibtimidity;
