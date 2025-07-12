import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private dataSource: DataSource) {}
  onModuleInit() {
    this.ensureDataDirectoryExists();
    this.logDatabaseInfo();
  }

  private ensureDataDirectoryExists() {
    const dataDir = path.join(process.cwd(), 'data');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      this.logger.log('Created data directory');
    }
  }

  private logDatabaseInfo() {
    try {
      const dbPath = this.dataSource.options.database as string;
      const isNewDatabase = !fs.existsSync(dbPath);

      if (isNewDatabase) {
        this.logger.log('Creating new SQLite database...');
      } else {
        const stats = fs.statSync(dbPath);
        this.logger.log(
          `Connected to existing SQLite database (${(stats.size / 1024).toFixed(2)} KB)`,
        );
      }

      this.logger.log(`Database path: ${dbPath}`);
      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error('Failed to get database info:', error);
    }
  }

  getDatabaseStats() {
    try {
      const dbPath = this.dataSource.options.database as string;

      if (!fs.existsSync(dbPath)) {
        return {
          exists: false,
          size: 0,
          path: dbPath,
        };
      }

      const stats = fs.statSync(dbPath);

      return {
        exists: true,
        size: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
        path: dbPath,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      this.logger.error('Failed to get database stats:', error);
      return null;
    }
  }
}
