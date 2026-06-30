import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";
import { getAllowedOrigins, isAllowedOrigin } from "./config/origins";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const requestLogger = new Logger("HTTP");
  const corsLogger = new Logger("CORS");

  const app = await NestFactory.create(AppModule);
  const allowedOrigins = getAllowedOrigins();

  app.setGlobalPrefix("api");

  // Log every request that actually reaches the process, plus its response
  // status and duration. If the browser reports a timeout but nothing shows
  // up here, the request never arrived (network/firewall), not the app.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startedAt = process.hrtime.bigint();
    const origin = req.headers.origin ?? "-";
    const ip = req.ip ?? req.socket.remoteAddress ?? "-";

    requestLogger.log(
      `--> ${req.method} ${req.originalUrl} origin=${origin} ip=${ip}`
    );

    res.on("finish", () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      requestLogger.log(
        `<-- ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`
      );
    });

    next();
  });

  app.enableCors({
    credentials: true,
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void
    ) => {
      if (!origin || isAllowedOrigin(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      corsLogger.warn(
        `Rejected origin "${origin}" — not in allowed list [${allowedOrigins.join(", ")}]`
      );
      callback(new Error(`CORS origin is not allowed: ${origin}`), false);
    }
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  // Bind explicitly to all interfaces so the service is reachable off-host,
  // and log the effective config so deployment mistakes are obvious in logs.
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  const host = "0.0.0.0";
  await app.listen(port, host);

  logger.log(`API listening on http://${host}:${port} (prefix /api)`);
  logger.log(`NODE_ENV=${process.env.NODE_ENV ?? "(unset)"}`);
  logger.log(`BETTER_AUTH_URL=${process.env.BETTER_AUTH_URL ?? "(unset)"}`);
  logger.log(`Allowed CORS origins: [${allowedOrigins.join(", ")}]`);
}

bootstrap().catch((error) => {
  new Logger("Bootstrap").error("Failed to start API", error as Error);
  process.exitCode = 1;
});
