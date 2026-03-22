import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UiRegistryEntity } from './entities/ui-registry.entity';
import { UiActionEntity } from './entities/ui-action.entity';
import { UiRegistryService } from './ui-registry.service';
import { UiRegistryController } from './ui-registry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UiRegistryEntity, UiActionEntity])],
  controllers: [UiRegistryController],
  providers: [UiRegistryService],
  exports: [UiRegistryService, TypeOrmModule],
})
export class UiRegistryModule {}
