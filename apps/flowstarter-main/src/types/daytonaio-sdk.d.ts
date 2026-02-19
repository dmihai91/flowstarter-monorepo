// Type declaration for optional @daytonaio/sdk dependency
// This allows the build to succeed even when the package is not installed
declare module '@daytonaio/sdk' {
  export class Daytona {
    constructor(config: { apiKey: string });
    create(options: { language: string }): Promise<{
      id: string;
      fs: {
        uploadFile(buffer: Buffer, path: string): Promise<void>;
      };
      process: {
        codeRun(command: string): Promise<{ exitCode: number; result: string }>;
      };
      getPreviewLink(port: number): Promise<{ url?: string } | null>;
    }>;
    delete(sandbox: { id: string }): Promise<void>;
  }
}
