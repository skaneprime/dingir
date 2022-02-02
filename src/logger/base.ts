import fs from "fs";
import path from "path";
import chalk from "chalk";
import moment from "moment";
import nodeUtil from "util";
import * as Utils from "../utils";

export type Keys = "time" | "label";

export type Levels = "default" | "debug" | "info" | "warn" | "error" | "fatal" | "trace" | "verbose";

export type LevelColors<T extends string> = {
  levels?: {
    [key in T | `${T}Bg`]?: string;
  } & {
    swapBgColor?: boolean;
  };
};

export type Colors<T extends string> = { [key in `${T}Bg` | T]?: string };

export interface Style {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
}

export type LevelStyles<T extends string> = {
  levels?: {
    [key in T]?: Style & { style?: "min" | "big" };
  };
};

export type Styles<T extends string> = { [key in T]?: Style };

/** @public */
export interface Theme {
  /** @example " HH:mm:ss " */
  timeFormat?: string;
  /** @example "[time][label][level]" */
  format?: string;
  display?: { [key in Keys]?: boolean | number };
  colors: Colors<Keys> & LevelColors<Levels>;
  styles: Styles<Keys> & LevelStyles<Levels>;
  debug?: boolean;
}

/** @public */
export interface LoggerOptions {
  label?: string;
  debug?: boolean;
  file?: string;
  themes?: { [key: string]: Theme };
}

/** @public */
export class Logger {
  private label = "";
  private file?: fs.WriteStream;
  private console = new console.Console(process.stdout, process.stderr);
  public debugEnabled = false;
  public Proto = Logger;
  public Themes = new Themes();

  public constructor(data?: LoggerOptions) {
    this.label = data?.label || this.label;
    this.debugEnabled = data?.debug || this.debugEnabled;
    this.Themes.cache = data?.themes || this.Themes.cache;

    if (data?.file) {
      this.file = fs.createWriteStream(path.resolve(process.cwd(), data?.file), { flags: "r+" });
    }
  }

  private get activeTheme() {
    const theme = this.Themes.activeTheme || this.Themes.defaultTheme;

    return Utils.Objects.mergeProp(theme, this.Themes.overwritable) as Theme;
  }

  private setWriteColors(time: string, label: string, level: string, type: Levels) {
    const colors = this.activeTheme.colors;

    function colorize(color: string | undefined, bgColor: string | undefined, string: string) {
      if (colors.levels) {
        const bgKey = `${type}Bg` as `${Levels}Bg`;
        const levelColor = colors.levels[type] || colors.levels.default;
        const levelBgColor = colors.levels[bgKey] || colors.levels.defaultBg;

        if (color === "levelColor") color = levelColor;
        if (color === "levelBgColor") color = levelBgColor;
        if (bgColor === "levelColor") bgColor = levelColor;
        if (bgColor === "levelBgColor") bgColor = levelBgColor;
      }

      if (color) string = chalk.hex(color)(string);
      if (bgColor) string = chalk.bgHex(bgColor)(string);

      return string;
    }

    function colorizeLevel(type: Levels, level: string) {
      if (!colors.levels) return level;

      const bgKey = `${type}Bg` as `${Levels}Bg`;
      const color = colors.levels[type] || colors.levels.default;
      const bgColor = colors.levels[bgKey] || colors.levels.defaultBg;
      const chalkKeys = {
        hex: colors.levels.swapBgColor ? ("bgHex" as const) : ("hex" as const),
        bgHex: colors.levels.swapBgColor ? ("hex" as const) : ("bgHex" as const),
      };

      if (color) level = chalk[chalkKeys.hex](color)(level);
      if (bgColor) level = chalk[chalkKeys.bgHex](bgColor)(level);

      return level;
    }

    return ([time, label, level] = [
      colorize(colors.time, colors.timeBg, time),
      colorize(colors.label, colors.labelBg, label),
      colorizeLevel(type, level),
    ]);
  }

  private setWriteStyles(time: string, label: string, level: string, type: Levels) {
    const styles = this.activeTheme.styles;

    function stylize(style: Style | undefined, string: string) {
      if (style?.bold) string = chalk.bold(string);
      if (style?.italic) string = chalk.italic(string);
      if (style?.strikethrough) string = chalk.strikethrough(string);

      return string;
    }

    function stylizeLevel(levels: LevelStyles<Levels>["levels"], level: string, type: Levels) {
      if (!levels) return level;

      const levelStyle = levels[type] || levels["default"];

      if (levelStyle?.bold) level = chalk.bold(level);
      if (levelStyle?.italic) level = chalk.italic(level);
      if (levelStyle?.strikethrough) level = chalk.strikethrough(level);

      return level;
    }

    return ([time, label, level] = [
      stylize(styles.time, time),
      stylize(styles.label, label),
      stylizeLevel(styles.levels, level, type),
    ]);
  }

  private setWriteFormat = (time = "", label = "", level = "") => {
    return `${this.activeTheme.format || "[time][label][level]"}`
      .replace("[time]", this.activeTheme.display?.time === false ? "" : time)
      .replace("[label]", this.activeTheme.display?.label === false ? "" : label)
      .replace("[level]", level);
  };

  public write(label: string, level: string, type: Levels = "default", args: unknown[]) {
    if (!this.debugEnabled && !this.activeTheme.debug && type === "debug") return;

    let time = moment().format(this.activeTheme.timeFormat || " HH:mm:ss ");

    [time, label, level] = this.setWriteColors(time, label, level, type);
    [time, label, level] = this.setWriteStyles(time, label, level, type);

    const output = this.setWriteFormat(time, label, ` │${level}│`);

    this.file?.write(nodeUtil.format(Utils.String.stripAnsi(output), ...args) + "\n");
    this.console.log(output, ...args);
    // process.stdout.write( [output, ...args, '\n'].join('') )
  }

  public debug = (...args: unknown[]) => this.write(this.label, " DEBUG ", "debug", args);
  public info = (...args: unknown[]) => this.write(this.label, " INFO  ", "info", args);
  public warn = (...args: unknown[]) => this.write(this.label, " WARN  ", "warn", args);
  public error = (...args: unknown[]) => this.write(this.label, " ERROR ", "error", args);
  public fatal = (...args: unknown[]) => this.write(this.label, " FATAL ", "fatal", args);
  public trace = (...args: unknown[]) => this.write(this.label, " TRACE ", "trace", args);
  public verbose = (...args: unknown[]) => this.write(this.label, "VERBOSE", "verbose", args);
  public custom = (level: string, ...args: unknown[]) => this.write(this.label, level, "default", args);
}

class Themes {
  public defaultTheme: Theme = {
    display: { time: true, label: true },
    colors: {
      time: "#26dbff",
      // timeBg: "#262626",
      label: "#949494", //"levelColor",//"#949494",
      // labelBg: "levelColor",//"#262626",

      levels: {
        default: "#949494",
        // defaultBg: "#262626",
        debug: "#a94dff",
        info: "#58ff4d",
        warn: "#edff4d",
        error: "#ff4d4d",
        fatal: "#c70000",
        trace: "#c2c2c2",
      },
    },
    styles: {
      label: { bold: true },
      levels: {
        fatal: { bold: true, style: "big" },
      },
    },
  };
  public activeTheme: Theme = this.defaultTheme;
  public overwritable: Partial<Theme> = {};
  public cache = {} as { [key: string]: Theme | undefined };

  public get = (name: string) => this.cache[name];
  public set = (name: string, theme: Theme) => (this.cache[name] = theme);
  public use = (name: string) => (this.activeTheme = this.cache[name] || this.defaultTheme);
  public overwrite = (data: Partial<Theme>) => (this.overwritable = data);
}

// Dead code and notes
// const logger = new Logger()
// logger.Themes.Use('random')
// const getMem = () => process.memoryUsage().heapUsed / 1024 / 1024;
// logger.Themes.Overwritable = {
//     // Upgrade formats
//     format: `{time}{level}{label}`,
//     styles: {
//         levels: {
//             default: { bold: true },
//             fatal: { style: 'big' }
//         }
//     },
//     colors: {
//         // levels: { swapBgColor: true }
//     }
// }
// setInterval(() => {
//     logger.Debug('hi!', getMem())
//     logger.Info('hi!', getMem())
//     logger.Warn('hi!', getMem())
//     logger.Error('hi!', getMem())
//     logger.Fatal('hi!', getMem())
//     logger.Trace('hi!', getMem())
//     logger.Debug('hi!', getMem())
// }, 3000)
// class Forms { MakeBox() {} }
/**
 * Ideas
 * - Swap: Done
 * - StyleForms system (min, big etc...) FormsSystem
 */
/**
 * = {
        Get: (name: string) => this._themes[name],
        Set: (name: string, theme: Theme) => this._themes[name] = theme,
        Use: (name: string) => {
            const theme = this._themes[name]
            if(!this._themes[name]) {
                const warnMessage = `Failed to find ${chalk.greenBright(`"${name}"`)}. Using default`
                this.Write('', ' WARN  ', 'warn', [warnMessage])    
            }
            this._activeTheme = theme || this.Themes.Default
        },
        Default: {
            display: { time: true, label: true },
            colors: {
                time: '#26dbff',
                // timeBg: "#262626",
                label: "#949494",//"levelColor",//"#949494",
                // labelBg: "levelColor",//"#262626",
                
                levels: {
                    default: "#949494",
                    // defaultBg: "#262626",
                    debug: "#a94dff",
                    info: "#58ff4d",
                    warn: "#edff4d",
                    error: "#ff4d4d",
                    fatal: "#c70000",
                    trace: "#c2c2c2"
                }
            },
            styles: {
                label: { bold: true },
                levels: {
                    fatal: { bold: true, style: 'big' }
                }
            }
        } as Theme,
        Overwritable: {} as Partial<Theme>
    }
 */
