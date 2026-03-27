import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, CreateDocumentVersionDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(ProjectAccessGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async create(@Body() dto: CreateDocumentDto, @CurrentUser('id') userId: string) {
    return this.documentsService.create(dto, userId);
  }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  async findAll(@Query('projectId', ParseUUIDPipe) projectId: string) {
    return this.documentsService.findAllByProject(projectId);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Get(':id/versions')
  async listVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.listVersions(id);
  }

  @Post(':id/versions')
  async createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentVersionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.createVersion(id, dto, userId);
  }
}
