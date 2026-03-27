import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { SystemHealthService } from './system-health.service';
import { CreateHealthCheckDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('System Health') @UseGuards(AdminGuard) @Controller('system-health')
export class SystemHealthController {
  constructor(private readonly svc: SystemHealthService) {}

  @Public()
  @Get('live')
  async liveCheck() { return this.svc.liveCheck(); }

  @ApiBearerAuth()
  @Get() async getLatest() { return this.svc.getLatest(); }

  @ApiBearerAuth()
  @Post('check') async check(@Body() dto: CreateHealthCheckDto) { return this.svc.check(dto); }
}
