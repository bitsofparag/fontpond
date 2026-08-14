import { validateEnvironment } from '../src/config/environment';

interface RuntimeProcess {
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode?: number;
  stderr: { write(message: string): void };
}

declare const process: RuntimeProcess;

const stage = process.argv[2] ?? 'development';
const result = validateEnvironment(stage, process.env);

if (!result.ok) {
  process.stderr.write(`Environment validation failed: ${result.error}\n`);
  process.exitCode = 1;
}
