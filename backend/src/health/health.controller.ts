import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('health') @ApiTags('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get() @ApiOperation({ summary: 'Check API and PostgreSQL readiness' }) async check() {
    try { if (!this.dataSource.isInitialized) throw new Error('database is not initialized'); await this.dataSource.query('SELECT 1'); return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() }; } catch { throw new ServiceUnavailableException({ status: 'unavailable', database: 'disconnected', timestamp: new Date().toISOString() }); }
  }
}
