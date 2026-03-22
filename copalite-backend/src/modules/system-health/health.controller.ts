import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SystemHealthService } from './system-health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly svc: SystemHealthService) {}

  @Public()
  @Get()
  async check() {
    return this.svc.liveCheck();
  }
}
