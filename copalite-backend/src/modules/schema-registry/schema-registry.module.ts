import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchemaRegistryEntity } from './entities/schema-registry.entity';
import { SchemaFieldEntity } from './entities/schema-field.entity';
import { SchemaRegistryService } from './schema-registry.service';
import { SchemaRegistryController } from './schema-registry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SchemaRegistryEntity, SchemaFieldEntity])],
  controllers: [SchemaRegistryController],
  providers: [SchemaRegistryService],
  exports: [SchemaRegistryService, TypeOrmModule],
})
export class SchemaRegistryModule {}
