import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SystemHealthEntity } from './entities/system-health.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { RunEntity } from '../runs/entities/run.entity';
import { CreateHealthCheckDto } from './dto';

@Injectable()
export class SystemHealthService {
  constructor(
    @InjectRepository(SystemHealthEntity) private readonly repo: Repository<SystemHealthEntity>,
    @InjectRepository(AgentEntity) private readonly agentRepo: Repository<AgentEntity>,
    @InjectRepository(RunEntity) private readonly runRepo: Repository<RunEntity>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async check(dto: CreateHealthCheckDto) { return this.repo.save(this.repo.create(dto)); }
  async getLatest() { return this.repo.find({ order: { checkedAt: 'DESC' }, take: 20 }); }

  async liveCheck() {
    const startTime = Date.now();
    let dbConnected = true;
    let dbLatencyMs = 0;

    try {
      const dbStart = Date.now();
      await this.dataSource.query('SELECT 1');
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbConnected = false;
    }

    const mem = process.memoryUsage();

    // Agents stats
    let agentsTotal = 0;
    let agentsActive = 0;
    try {
      agentsTotal = await this.agentRepo.count();
      agentsActive = await this.agentRepo.count({ where: { status: 'active' as any } });
    } catch { /* ignore */ }

    // Last run
    let lastRun: any = null;
    try {
      const run = await this.runRepo.findOne({
        order: { createdAt: 'DESC' },
        select: ['id', 'title', 'status', 'runType', 'createdAt', 'finishedAt'],
      });
      if (run) {
        lastRun = {
          id: run.id,
          title: run.title,
          status: run.status,
          runType: run.runType,
          createdAt: run.createdAt,
          finishedAt: run.finishedAt,
        };
      }
    } catch { /* ignore */ }

    // Redis check
    let redisConnected = false;
    let redisLatencyMs = 0;
    const redisHost = this.configService.get<string>('REDIS_HOST');
    if (redisHost) {
      try {
        const Redis = require('ioredis');
        const redis = new Redis({
          host: redisHost,
          port: this.configService.get<number>('REDIS_PORT', 6379),
          password: this.configService.get<string>('REDIS_PASSWORD', ''),
          connectTimeout: 3000,
          lazyConnect: true,
        });
        const redisStart = Date.now();
        await redis.connect();
        await redis.ping();
        redisLatencyMs = Date.now() - redisStart;
        redisConnected = true;
        await redis.disconnect();
      } catch {
        redisConnected = false;
      }
    }

    const overallStatus = !dbConnected ? 'unhealthy'
      : (redisHost && !redisConnected) ? 'degraded'
      : dbLatencyMs > 500 ? 'degraded'
      : 'healthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: {
        connected: dbConnected,
        latencyMs: dbLatencyMs,
      },
      redis: redisHost ? {
        configured: true,
        connected: redisConnected,
        latencyMs: redisLatencyMs,
      } : { configured: false },
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      agents: {
        total: agentsTotal,
        active: agentsActive,
      },
      lastRun,
      responseMs: Date.now() - startTime,
    };
  }
}
