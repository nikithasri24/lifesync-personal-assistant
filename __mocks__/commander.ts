export class Command {
  private _commands: Command[] = []
  constructor(public name?: string) {}
  addCommand(cmd: Command) { this._commands.push(cmd); return this }
  command(_str?: string) { return this }
  alias(_a?: string) { return this }
  description(_s?: string) { return this }
  argument(_name?: string, _desc?: string) { return this }
  option(_flags?: string, _desc?: string, _default?: any) { return this }
  requiredOption(_flags?: string, _desc?: string, _default?: any) { return this }
  action(_fn?: (...args: any[]) => any) { return this }
  parse(_argv?: string[]) { return this }
  async parseAsync(_argv?: string[]) { return this }
}
