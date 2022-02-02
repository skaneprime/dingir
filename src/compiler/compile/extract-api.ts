import fs from "fs";
import path from "path";
import chalk from "chalk";
import { Extractor, ExtractorConfig, ExtractorLogLevel } from "@microsoft/api-extractor";

export function extractApi(declarationPath: string, outPath: string) {
  const oldConsole = console;
  console = new console.Console(new fs.WriteStream(Buffer.from([]))); // Disabiling console cause extractor log's it's own anyway

  const extractorConfig = ExtractorConfig.prepare({
    configObject: {
      projectFolder: `${path.dirname(declarationPath)}`,
      mainEntryPointFilePath: `${declarationPath}`,
      bundledPackages: [],
      compiler: {
        tsconfigFilePath: `${process.cwd()}/tsconfig.json`,
        overrideTsconfig: {
          files: [`${process.cwd()}/dingir.d.ts`],
        },
      },
      apiReport: {
        enabled: false,
        reportFileName: "???.api.md",
        reportFolder: "<projectFolder>/bin/",
        reportTempFolder: "<projectFolder>/bin/",
      },
      docModel: {
        enabled: false,
      },
      dtsRollup: {
        enabled: true,
        untrimmedFilePath: outPath,
      },
      tsdocMetadata: {
        enabled: false,
        tsdocMetadataFilePath: "<projectFolder>/bin/tsdoc-metadata.json",
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
            logLevel: ExtractorLogLevel.Warning,
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
          if (msg.text.includes("Duplicate") && msg.sourceFilePath?.includes("dingir.d.ts")) return;
          return System.warn(`(${chalk.yellowBright(msg.messageId)})`, msg.text);
        case ExtractorLogLevel.Info:
          return System.info(`(${chalk.cyanBright(msg.messageId)})`, msg.text);
        case ExtractorLogLevel.Error:
          return System.error(`(${chalk.redBright(msg.messageId)})`, msg.text);
        case ExtractorLogLevel.Verbose:
          return System.debug(`(${msg.messageId})`, msg.text);
        default:
          return System.debug(level, `(${msg.messageId})`, msg.text);
      }
    },
    showDiagnostics: false,
    showVerboseMessages: false,
  });

  console = oldConsole;
}
