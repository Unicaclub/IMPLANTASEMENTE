import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SystemHealthEntity } from './entities/system-health.entity';
import { CreateHealthCheckDto } from './dto';

@Injectable()
export class SystemHealthService {
  constructor(
    @InjectRepository(SystemHealthEntity) private readonly repo: Repository<SystemHealthEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async check(dto: CreateHealthCheckDto) { return this.repo.save(this.repo.create(dto)); }
  async getLatest() { return this.repo.find({ order: { checkedAt: 'DESC' }, take: 20 }); }

  async liveCheck() {
    const startTime = Date.now();
    let dbStatus = 'ok';
    let dbLatencyMs = 0;

    try {
      const dbStart = Date.now();
      await this.dataSource.query('SELECT 1');
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbStatus = 'error';
    }

    const mem = process.memoryUsage();

    return {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      responseMs: Date.now() - startTime,
    };
  }
}
