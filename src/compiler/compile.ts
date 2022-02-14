import fs from "fs";
import path from "path";
import chalk from "chalk";
import crypto from "crypto";
import module from "module";
import * as tscProg from "tsc-prog";
import bytenode from "bytenode";
import { Extractor, ExtractorConfig, ExtractorLogLevel } from "@microsoft/api-extractor";
import ncc from "../helper/ncc";
import coder from "./coder";
import packer from "./packer";
import { env, Utils } from "../dingir";
import { systemLogger } from "../services/logger/system";
import tty from "tty";

interface CompilerOptions {
	out?: string;
	ver?: string;
	minify?: boolean;
	declaration?: boolean;
	externals?: string[];
}
/** @public */
export async function dgCompile(entry: string, options?: CompilerOptions) {
	// STEP 1: COMPILE TYPESCRIPT
	const buildDir = compileTypescript(entry);

	// STEP 2: BUNDLE JS WITH NCC
	const jsEntryPath = path.resolve(buildDir, path.basename(entry).replace(".ts", ".js"));
	const bundle = await bundleJavascript(jsEntryPath, options);

	// STEP 3.1: COMPILE NCCBUNDLE TO BYTECODE
	const bytecode = compileToBytecode(bundle.code);

	if (!bytecode) {
		fs.rmSync(buildDir, { recursive: true });
		return systemLogger.fatal("Failed to compile bytecode");
	}

	// STEP 3.2: PACKUP AND WRITE FILE
	const packed = packer.pack(
		{
			dgv: env.version,
			ver: options?.ver || "",
			externals: options?.externals || [],
		},
		bytecode,
	);

	const outPath = path.resolve(
		`${(options?.out || entry).slice(0, (options?.out || entry).length - 3)}${
			options?.ver ? `@${options.ver}` : ""
		}.dg`,
	);

	Utils.fs.ensureDirectoryExistence(outPath);
	fs.createWriteStream(outPath).write(packed);

	// STEP 4 (OPTIONAL): BUILD DECLARATION
	if (options?.declaration) {
		const declarationPath = path.resolve(buildDir, path.basename(entry).replace(".ts", ".d.ts"));
		buildDeclaration(declarationPath, outPath.replace(".dg", ".d.ts"));
	}
	systemLogger.info(`${chalk.green("Build successful!")}`);
	// STEP 5: DELETE TEMP BUILD DIR
	fs.rmSync(buildDir, { recursive: true });
}

function compileTypescript(entry: string) {
	const buildDir = `${process.cwd()}/.build-${crypto.randomBytes(10).toString("hex")}`;
	const oldConsole = console;
	if (!process.env["SAITAMAS_SUPER_SECRET_DEBUG"]) {
		console = new console.Console(new tty.WriteStream(0));
	}

	tscProg.build({
		basePath: process.cwd(),
		configFilePath: path.resolve(process.cwd(), "tsconfig.json"),
		compilerOptions: {
			declaration: true,
			outDir: buildDir,
			declarationDir: buildDir,
		},
		include: [
			path.resolve(process.cwd(), "dingir.d.ts"),
			path.resolve(path.dirname(entry), "**/*"),
		],
	});

	console = oldConsole;
	return buildDir;
}

async function bundleJavascript(jsEntryPath: string, options?: CompilerOptions) {
	systemLogger.debug(`[ncc] called`);

	const oldConsole = console;
	if (!process.env["SAITAMAS_SUPER_SECRET_DEBUG"]) {
		console = new console.Console(new tty.WriteStream(0));
	}

	systemLogger.debug(jsEntryPath);
	const output = await ncc(jsEntryPath, {
		...(options || {}),
		cache: false,
		v8cache: false,
		quiet: !process.env["SAITAMAS_SUPER_SECRET_DEBUG"],
		debugLog: !!process.env["SAITAMAS_SUPER_SECRET_DEBUG"],
		externals: ["@vercel/ncc", ...(options?.externals || [])],
	});

	systemLogger.debug(
		`[ncc] compiled in ${(output.stats?.endTime || 0) - (output.stats?.startTime || 0)}ms`,
	);

	console = oldConsole;
	return output;
}

function compileToBytecode(code: string) {
	const bytecode = bytenode.compileCode(module.Module.wrap(code));
	const encoded = coder.buffer.encode(bytecode);
	const decodable = Buffer.compare(bytecode, coder.buffer.decode(encoded)) === 0;

	if (!decodable) {
		return systemLogger.error(`DGE001: Can't compile file to dg. Undecodable code`);
	}

	return encoded;
}

function buildDeclaration(declarationEntry: string, outPath: string) {
	const oldConsole = console;
	if (!process.env["SAITAMAS_SUPER_SECRET_DEBUG"]) {
		console = new console.Console(new tty.WriteStream(0));
	}
	const extractorConfig = ExtractorConfig.prepare({
		configObject: {
			projectFolder: path.dirname(declarationEntry),
			mainEntryPointFilePath: declarationEntry,
			bundledPackages: [],
			compiler: {
				tsconfigFilePath: path.resolve(process.cwd(), "tscofnig.json"),
				overrideTsconfig: {
					files: [path.resolve(process.cwd(), "dingir.d.ts")],
				},
			},
			apiReport: {
				enabled: false,
				reportFileName: "???.api.md",
				reportFolder: "<projectFolder>/bin/",
				reportTempFolder: "<projectFolder>/bin/",
			},
			docModel: { enabled: false },
			tsdocMetadata: {
				enabled: false,
				tsdocMetadataFilePath: "<projectFolder>/bin/tsdoc-metadata.json",
			},
			dtsRollup: {
				enabled: true,
				untrimmedFilePath: outPath,
			},
			messages: {
				compilerMessageReporting: {
					default: {
						logLevel: ExtractorLogLevel.None,
					},
				},
				extractorMessageReporting: {
					default: {
						logLevel: ExtractorLogLevel.None,
					},
				},
				tsdocMessageReporting: {
					default: {
						logLevel: ExtractorLogLevel.None,
					},
				},
			},
		},
		configObjectFullPath: undefined,
		packageJsonFullPath: path.resolve(process.cwd(), "package.json"),
	});

	const result = Extractor.invoke(extractorConfig, {
		messageCallback(msg) {
			const level = `${msg.logLevel[0].toUpperCase()}${msg.logLevel.slice(1)}:`;
			switch (msg.logLevel) {
				case ExtractorLogLevel.Warning:
					if (msg.text.includes("Duplicate") && msg.sourceFilePath?.includes("dingir.d.ts")) return;
					return systemLogger.warn(`(${chalk.yellowBright(msg.messageId)})`, msg.text);
				case ExtractorLogLevel.Info:
					return systemLogger.info(`(${chalk.cyanBright(msg.messageId)})`, msg.text);
				case ExtractorLogLevel.Error:
					return systemLogger.error(`(${chalk.redBright(msg.messageId)})`, msg.text);
				case ExtractorLogLevel.Verbose:
					return systemLogger.debug(`(${msg.messageId})`, msg.text);
				default:
					return systemLogger.debug(level, `(${msg.messageId})`, msg.text);
			}
		},
		showDiagnostics: false,
		showVerboseMessages: false,
	});

	console = oldConsole;
	return result;
}
