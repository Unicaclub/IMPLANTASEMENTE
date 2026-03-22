import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiRegistryEntity } from './entities/api-registry.entity';
import { ApiRegistryService } from './api-registry.service';
import { ApiRegistryController } from './api-registry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApiRegistryEntity])],
  controllers: [ApiRegistryController],
  providers: [ApiRegistryService],
  exports: [ApiRegistryService, TypeOrmModule],
})
export class ApiRegistryModule {}
