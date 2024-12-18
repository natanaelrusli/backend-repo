import { NextFunction, Request, Response } from "express";
import winston from "winston";

const { combine, timestamp, printf, colorize, align, json } = winston.format;

export const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD hh:mm:ss A',
    }),
    json(),
    align(),
    printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`),
    colorize({ all: true })
  ),
  transports: [new winston.transports.Console()],
});

export const logger = (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    let logLevel = 'info';
    let message = `Handled ${req.method} request for ${req.url} with status ${res.statusCode}`;

    if (res.statusCode >= 500) {
      logLevel = 'error';
      message = `Server error: ${message}`;
    } else if (res.statusCode >= 400) {
      logLevel = 'warn';
      message = `Client error: ${message}`;
    }

    winstonLogger.log({
      level: logLevel,
      message: message
    });
  });

  next();
}