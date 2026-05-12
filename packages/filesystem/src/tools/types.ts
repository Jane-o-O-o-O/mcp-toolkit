/**
 * File system interface — abstracted for testability.
 * Mirrors a subset of Node.js fs/promises + path utilities.
 */
export interface FileHandle {
  read(): Promise<Buffer>;
  write(data: Buffer | string): Promise<void>;
  close(): Promise<void>;
}

export interface FileSystem {
  readFile(path: string, encoding: "utf-8"): Promise<string>;
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, data: string | Buffer): Promise<void>;
  appendFile(path: string, data: string): Promise<void>;
  unlink(path: string): Promise<void>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  rmdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<{
    size: number;
    isFile(): boolean;
    isDirectory(): boolean;
    mtime: Date;
    birthtime: Date;
    mode: number;
  }>;
  access(path: string): Promise<void>;
  realpath(path: string): Promise<string>;
}

export interface PathUtils {
  join(...paths: string[]): string;
  resolve(...paths: string[]): string;
  dirname(path: string): string;
  basename(path: string): string;
  extname(path: string): string;
  normalize(path: string): string;
}
