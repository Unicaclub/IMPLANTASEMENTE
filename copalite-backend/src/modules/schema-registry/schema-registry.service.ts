import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchemaRegistryEntity } from './entities/schema-registry.entity';
import { SchemaFieldEntity } from './entities/schema-field.entity';
import { CreateSchemaRegistryDto, UpdateSchemaRegistryDto, CreateSchemaFieldDto } from './dto';

@Injectable()
export class SchemaRegistryService {
  constructor(
    @InjectRepository(SchemaRegistryEntity) private readonly registryRepo: Repository<SchemaRegistryEntity>,
    @InjectRepository(SchemaFieldEntity) private readonly fieldRepo: Repository<SchemaFieldEntity>,
  ) {}
  async create(dto: CreateSchemaRegistryDto) { return this.registryRepo.save(this.registryRepo.create(dto)); }
  async findAllByProject(projectId: string) { return this.registryRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } }); }
  async findById(id: string) { const e = await this.registryRepo.findOne({ where: { id } }); if (!e) throw new NotFoundException('Schema registry entry not found'); return e; }
  async update(id: string, dto: UpdateSchemaRegistryDto) { const e = await this.findById(id); Object.assign(e, dto); return this.registryRepo.save(e); }
  async createField(schemaRegistryId: string, dto: CreateSchemaFieldDto) { await this.findById(schemaRegistryId); return this.fieldRepo.save(this.fieldRepo.create({ ...dto, schemaRegistryId })); }
  async listFields(schemaRegistryId: string) { return this.fieldRepo.find({ where: { schemaRegistryId }, order: { fieldName: 'ASC' } }); }
}
