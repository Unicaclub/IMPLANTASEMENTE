import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleRegistryEntity } from './entities/module-registry.entity';
import { ModulesRegistryService } from './modules-registry.service';
import { ModulesRegistryController } from './modules-registry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleRegistryEntity])],
  controllers: [ModulesRegistryController],
  providers: [ModulesRegistryService],
  exports: [ModulesRegistryService, TypeOrmModule],
})
export class ModulesRegistryModule {}
