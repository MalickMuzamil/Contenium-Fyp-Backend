import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import fs from 'fs'

const __dirname = path.resolve();
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.json()
    ),
    transports: [
        new DailyRotateFile({
            filename: path.join(logsDir, 'Error-%DATE%.txt'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            append: true
        })
    ]
});

export const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500
    if (res.statusCode == "400") {
        const errorMessage = `${res.statusCode} - ${err}`;
        logger.error(errorMessage);
    }
    
    res.status(statusCode)
    res.json({
        status: statusCode,
        data: { message: err.message },
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    })
}