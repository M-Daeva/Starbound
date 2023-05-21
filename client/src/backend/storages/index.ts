import path from "path";
import { readFileSync, writeFileSync, accessSync } from "fs";
import { StorageNames, StorageTypes } from "../../common/interfaces";

class Storage<T extends StorageTypes> {
  private encoding: BufferEncoding = "utf8";
  private st: T | undefined;

  constructor(private name: StorageNames) {
    try {
      accessSync(this.getPath(this.name));
      this.st = this.read();
    } catch (error) {}
  }

  get() {
    return this.st;
  }

  set(data: T) {
    this.st = data;
  }

  read() {
    return JSON.parse(
      readFileSync(this.getPath(this.name), { encoding: this.encoding })
    );
  }

  write(data: T) {
    writeFileSync(this.getPath(this.name), JSON.stringify(data), {
      encoding: this.encoding,
    });
  }

  private getPath(name: string) {
    return path.resolve(__dirname, `./${name}.json`);
  }
}

export { Storage };
