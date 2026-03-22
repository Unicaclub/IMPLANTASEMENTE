import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteRegistryEntity } from './entities/route-registry.entity';
import { RouteRegistryService } from './route-registry.service';
import { RouteRegistryController } from './route-registry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RouteRegistryEntity])],
  controllers: [RouteRegistryController],
  providers: [RouteRegistryService],
  exports: [RouteRegistryService, TypeOrmModule],
})
export class RouteRegistryModule {}
