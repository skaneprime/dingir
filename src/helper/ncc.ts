/** @public */
interface NCCOption<WatchState extends boolean> {
  /** provide a custom cache path or disable caching */
  cache: string | false;

  /** externals to leave as requires of the build */
  externals: string[];

  /**
   * directory outside of which never to emit assets
   * @default process.cwd()
   */
  filterAssetBase: string;

  /** @default false */
  minify: boolean;

  /** @default false */
  sourceMap: boolean;

  /** @default false */
  assetBuilds: boolean;

  /**
   * treats sources as output-relative
   * when outputting a sourcemap, automatically include
   * source-map-support in the output file (increases output by 32kB).
   * @default "../"
   */
  sourceMapBasePrefix: '../';

  /** @default true */
  sourceMapRegister: boolean;

  /** @default false */
  watch: WatchState;

  /** @default does not generate a license file */
  license: '';

  /** @default false */
  v8cache: boolean;

  /** @default false */
  quiet: boolean;

  /** @default false */
  debugLog: boolean;
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-var-requires
export default require('@vercel/ncc') as <T extends boolean = false>(
  entry: string,
  options?: Partial<NCCOption<T>>,
) => T extends true
  ? {
      handler(callback: (data: { err: unknown; code: string; map: unknown; assets: unknown }) => void): void;

      rebuild(callback: () => Record<string, never>): void;

      close(): void;
    }
  : Promise<{
      code: string;
      map: unknown;
      assets: unknown;
      stats?: {
        startTime?: number;
        endTime?: number;
      };
    }>;
