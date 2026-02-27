import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

/**
 * AppLogger — structured JSON in production (Railway), pretty colored output in dev.
 *
 * Railway coleta stdout/stderr por linha. Emitindo JSON por linha o serviço de logs
 * consegue indexar timestamp, level, context e message automaticamente.
 */
@Injectable()
export class AppLogger extends ConsoleLogger {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  override log(message: any, context?: string) {
    this.emit('log', message, context);
  }

  override warn(message: any, context?: string) {
    this.emit('warn', message, context);
  }

  override error(message: any, stackOrContext?: string, context?: string) {
    // NestJS chama error(message, stack, context) — stack pode ser o context se não houver trace
    const hasStack = stackOrContext && stackOrContext.startsWith('Error');
    this.emit('error', message, context ?? (hasStack ? undefined : stackOrContext), hasStack ? stackOrContext : undefined);
  }

  override debug(message: any, context?: string) {
    this.emit('debug', message, context);
  }

  override verbose(message: any, context?: string) {
    this.emit('verbose', message, context);
  }

  override fatal(message: any, context?: string) {
    this.emit('fatal', message, context);
  }

  private emit(level: string, message: any, context?: string, trace?: string) {
    const msg = typeof message === 'object' ? JSON.stringify(message) : String(message);

    if (this.isProduction) {
      // ── Structured JSON for Railway / log aggregators ──────────────────────
      const entry: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level,
        context: context ?? this.context ?? 'App',
        message: msg,
      };
      if (trace) entry.trace = trace;
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      // ── Pretty colored output for local dev ────────────────────────────────
      const COLOR: Record<string, string> = {
        log:     '\x1b[32m', // green
        warn:    '\x1b[33m', // yellow
        error:   '\x1b[31m', // red
        debug:   '\x1b[36m', // cyan
        verbose: '\x1b[35m', // magenta
        fatal:   '\x1b[35m', // magenta
      };
      const RESET = '\x1b[0m';
      const BOLD  = '\x1b[1m';
      const DIM   = '\x1b[2m';
      const color = COLOR[level] ?? '';
      const ctx   = context ?? this.context ?? 'App';
      const ts    = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm

      process.stdout.write(
        `${DIM}${ts}${RESET} ${color}${BOLD}[${level.toUpperCase()}]${RESET} ${BOLD}[${ctx}]${RESET} ${msg}${trace ? `\n${DIM}${trace}${RESET}` : ''}\n`,
      );
    }
  }
}
