import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SchemaRegistryService } from './schema-registry.service';
import { CreateSchemaRegistryDto, UpdateSchemaRegistryDto, CreateSchemaFieldDto } from './dto';

@ApiTags('Schema Registry') @ApiBearerAuth() @Controller('schema-registry')
export class SchemaRegistryController {
  constructor(private readonly svc: SchemaRegistryService) {}
  @Post() async create(@Body() dto: CreateSchemaRegistryDto) { return this.svc.create(dto); }
  @Get() @ApiQuery({ name: 'projectId', required: true }) async findAll(@Query('projectId', ParseUUIDPipe) pid: string) { return this.svc.findAllByProject(pid); }
  @Get(':id') async findById(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Patch(':id') async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSchemaRegistryDto) { return this.svc.update(id, dto); }
  @Post(':id/fields') async createField(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateSchemaFieldDto) { return this.svc.createField(id, dto); }
  @Get(':id/fields') async listFields(@Param('id', ParseUUIDPipe) id: string) { return this.svc.listFields(id); }
}
