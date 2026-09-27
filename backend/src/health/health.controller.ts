import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('health') @ApiTags('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get() @ApiOperation({ summary: 'Check API and PostgreSQL readiness' }) async check() {
    const database = this.dataSource.isInitialized ? 'up' : 'down';
    if (database === 'up') await this.dataSource.query('SELECT 1');
    return { status: 'ok', database, timestamp: new Date().toISOString() };
  }
}
