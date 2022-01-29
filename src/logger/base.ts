import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import moment from 'moment';
import nodeUtil from 'util';
import * as Utils from '../utils';

export type Keys = 'time' | 'label';

export type Levels = 'default' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'trace' | 'verbose';

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
    [key in T]?: Style & { style?: 'min' | 'big' };
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
export interface LoggerData {
  label?: string;
  debug?: boolean;
  file?: string;
  themes?: { [key: string]: Theme };
}

/** @public */
export class Logger {
  private label = '';
  private file?: fs.WriteStream;
  private console = new console.Console(process.stdout, process.stderr);
  public debug = false;
  public Proto = Logger;
  public Themes = new Themes();

  public constructor(data?: LoggerData) {
    this.label = data?.label || this.label;
    this.debug = data?.debug || this.debug;
    this.Themes.cache = data?.themes || this.Themes.cache;

    if (data?.file) {
      this.file = fs.createWriteStream(path.resolve(process.cwd(), data?.file), { flags: 'r+' });
    }
  }

  private get ActiveTheme() {
    const theme = this.Themes.activeTheme || this.Themes.defaultTheme;

    return Utils.Objects.mergeProp(theme, this.Themes.overwritable) as Theme;
  }

  private SetWriteColors(time: string, label: string, level: string, type: Levels) {
    const colors = this.ActiveTheme.colors;

    function Colorize(color: string | undefined, bgColor: string | undefined, string: string) {
      if (colors.levels) {
        const bgKey = `${type}Bg` as `${Levels}Bg`;
        const levelColor = colors.levels[type] || colors.levels.default;
        const levelBgColor = colors.levels[bgKey] || colors.levels.defaultBg;

        if (color === 'levelColor') color = levelColor;
        if (color === 'levelBgColor') color = levelBgColor;
        if (bgColor === 'levelColor') bgColor = levelColor;
        if (bgColor === 'levelBgColor') bgColor = levelBgColor;
      }

      if (color) string = chalk.hex(color)(string);
      if (bgColor) string = chalk.bgHex(bgColor)(string);

      return string;
    }

    function ColorizeLevel(type: Levels, level: string) {
      if (!colors.levels) return level;

      const bgKey = `${type}Bg` as `${Levels}Bg`;
      const color = colors.levels[type] || colors.levels.default;
      const bgColor = colors.levels[bgKey] || colors.levels.defaultBg;
      const chalkKeys = {
        hex: colors.levels.swapBgColor ? ('bgHex' as const) : ('hex' as const),
        bgHex: colors.levels.swapBgColor ? ('hex' as const) : ('bgHex' as const),
      };

      if (color) level = chalk[chalkKeys.hex](color)(level);
      if (bgColor) level = chalk[chalkKeys.bgHex](bgColor)(level);

      return level;
    }

    return ([time, label, level] = [
      Colorize(colors.time, colors.timeBg, time),
      Colorize(colors.label, colors.labelBg, label),
      ColorizeLevel(type, level),
    ]);
  }

  private SetWriteStyles(time: string, label: string, level: string, type: Levels) {
    const styles = this.ActiveTheme.styles;

    function Stylize(style: Style | undefined, string: string) {
      if (style?.bold) string = chalk.bold(string);
      if (style?.italic) string = chalk.italic(string);
      if (style?.strikethrough) string = chalk.strikethrough(string);

      return string;
    }

    function StylizeLevel(levels: LevelStyles<Levels>['levels'], level: string, type: Levels) {
      if (!levels) return level;

      const levelStyle = levels[type] || levels['default'];

      if (levelStyle?.bold) level = chalk.bold(level);
      if (levelStyle?.italic) level = chalk.italic(level);
      if (levelStyle?.strikethrough) level = chalk.strikethrough(level);

      return level;
    }

    return ([time, label, level] = [
      Stylize(styles.time, time),
      Stylize(styles.label, label),
      StylizeLevel(styles.levels, level, type),
    ]);
  }

  private SetWriteFormat = (time = '', label = '', level = '') => {
    return `${this.ActiveTheme.format || '[time][label][level]'}`
      .replace('[time]', this.ActiveTheme.display?.time === false ? '' : time)
      .replace('[label]', this.ActiveTheme.display?.label === false ? '' : label)
      .replace('[level]', level);
  };

  public Write(label: string, level: string, type: Levels = 'default', args: unknown[]) {
    if (!this.debug && !this.ActiveTheme.debug && type === 'debug') return;

    let time = moment().format(this.ActiveTheme.timeFormat || ' HH:mm:ss ');

    [time, label, level] = this.SetWriteColors(time, label, level, type);
    [time, label, level] = this.SetWriteStyles(time, label, level, type);

    const output = this.SetWriteFormat(time, label, ` │${level}│`);

    this.file?.write(nodeUtil.format(Utils.String.stripAnsi(output), ...args) + '\n');
    this.console.log(output, ...args);
    // process.stdout.write( [output, ...args, '\n'].join('') )
  }

  public Debug = (...args: unknown[]) => this.Write(this.label, ' DEBUG ', 'debug', args);
  public Info = (...args: unknown[]) => this.Write(this.label, ' INFO  ', 'info', args);
  public Warn = (...args: unknown[]) => this.Write(this.label, ' WARN  ', 'warn', args);
  public Error = (...args: unknown[]) => this.Write(this.label, ' ERROR ', 'error', args);
  public Fatal = (...args: unknown[]) => this.Write(this.label, ' FATAL ', 'fatal', args);
  public Trace = (...args: unknown[]) => this.Write(this.label, ' TRACE ', 'trace', args);
  public Verbose = (...args: unknown[]) => this.Write(this.label, 'VERBOSE', 'verbose', args);
  public Custom = (level: string, ...args: unknown[]) => this.Write(this.label, level, 'default', args);
}

class Themes {
  public defaultTheme: Theme = {
    display: { time: true, label: true },
    colors: {
      time: '#26dbff',
      // timeBg: "#262626",
      label: '#949494', //"levelColor",//"#949494",
      // labelBg: "levelColor",//"#262626",

      levels: {
        default: '#949494',
        // defaultBg: "#262626",
        debug: '#a94dff',
        info: '#58ff4d',
        warn: '#edff4d',
        error: '#ff4d4d',
        fatal: '#c70000',
        trace: '#c2c2c2',
      },
    },
    styles: {
      label: { bold: true },
      levels: {
        fatal: { bold: true, style: 'big' },
      },
    },
  };
  public activeTheme: Theme = this.defaultTheme;
  public overwritable: Partial<Theme> = {};
  public cache = {} as { [key: string]: Theme | undefined };

  public Get = (name: string) => this.cache[name];
  public Set = (name: string, theme: Theme) => (this.cache[name] = theme);
  public Use = (name: string) => (this.activeTheme = this.cache[name] || this.defaultTheme);
  public Overwrite = (data: Partial<Theme>) => (this.overwritable = data);
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
