import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { build } from 'tsc-prog';
import { randomBytes } from 'crypto';
import { Extractor, ExtractorConfig, ExtractorLogLevel } from '@microsoft/api-extractor';

export function ExtractApi(entry: string, outpath?: string) {
  const old_console = console;
  const tempDir = randomBytes(10).toString('hex');
  /** Disable console for uncontrolable shitty logs */
  // if (true /** add some debug value for verbose logs */)
  // Risky Cause Other Code's console log may not appear. But if they use their own or system logger then it's not the case
  console = new console.Console(new fs.WriteStream(Buffer.from([]))); 

  build({
    basePath: process.cwd(),
    configFilePath: `${process.cwd()}/tsconfig.json`,
    compilerOptions: {
      declaration: true,
      declarationDir: `${path.dirname(entry)}/.tsc-types-${tempDir}`,
      emitDeclarationOnly: true,
    },
    files: [`${process.cwd()}/dingir.d.ts`],
    include: [`${path.dirname(entry)}/**/*`],
  });

  const extractorConfig = ExtractorConfig.prepare({
    configObject: {
      projectFolder: `${path.dirname(entry)}`,
      mainEntryPointFilePath: `${path.dirname(entry)}/.tsc-types-${tempDir}/${path
        .basename(entry)
        .replace('.ts', '.d.ts')}`,
      bundledPackages: [],
      compiler: {
        tsconfigFilePath: `${process.cwd()}/tsconfig.json`,
      },
      apiReport: {
        enabled: false,
        reportFileName: '???.api.md',
        reportFolder: '<projectFolder>/bin/',
        reportTempFolder: '<projectFolder>/bin/',
      },
      docModel: {
        enabled: false,
      },
      dtsRollup: {
        enabled: true,
        untrimmedFilePath: `${outpath || entry.replace('.ts', '.d.ts')}`,
      },
      tsdocMetadata: {
        enabled: false,
        tsdocMetadataFilePath: '<projectFolder>/bin/tsdoc-metadata.json',
      },
      messages: {
        compilerMessageReporting: {
          default: {
            logLevel: ExtractorLogLevel.Warning,
          },
        },
        extractorMessageReporting: {
          default: {
            logLevel: ExtractorLogLevel.Warning,
          },
        },
        tsdocMessageReporting: {
          default: {
            logLevel: ExtractorLogLevel.Warning
          },
        },
      },
    },
    configObjectFullPath: undefined,
    packageJsonFullPath: `${process.cwd()}/package.json`,
  });

  Extractor.invoke(extractorConfig, {
    messageCallback(msg) {
      const level = `${msg.logLevel[0].toUpperCase()}${msg.logLevel.slice(1)}:`;
      switch (msg.logLevel) {
        case ExtractorLogLevel.Warning:
          return System.Warn(`(${chalk.yellowBright(msg.messageId)})`, msg.text);
        case ExtractorLogLevel.Info:
          return System.Info(`(${chalk.cyanBright(msg.messageId)})`, msg.text);
        case ExtractorLogLevel.Error:
          return System.Error(`(${chalk.redBright(msg.messageId)})`, msg.text);
        case ExtractorLogLevel.Verbose:
          return System.Debug(`(${msg.messageId})`, msg.text);
        default:
          return System.Debug(level, `(${msg.messageId})`, msg.text);
      }
    },
    showDiagnostics: false,
    showVerboseMessages: false
  });

  System.Debug('Api Extracted');

  console = old_console;
  fs.rmSync(`${path.dirname(entry)}/.tsc-types-${tempDir}`, {
    recursive: true,
  });
}
