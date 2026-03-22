import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvidenceRegistryEntity } from './entities/evidence-registry.entity';
import { EvidenceRegistryService } from './evidence-registry.service';
import { EvidenceRegistryController } from './evidence-registry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EvidenceRegistryEntity])],
  controllers: [EvidenceRegistryController],
  providers: [EvidenceRegistryService],
  exports: [EvidenceRegistryService, TypeOrmModule],
})
export class EvidenceRegistryModule {}
