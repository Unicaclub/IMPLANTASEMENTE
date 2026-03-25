import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
} from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.create(dto, userId);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.workspacesService.findAllForUser(userId);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, dto);
  }

  @Get(':id/members')
  async listMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.listMembers(id);
  }

  @Post(':id/members')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Adicionar membro (requer OWNER/ADMIN)' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    return this.workspacesService.addMember(id, dto);
  }

  @Patch(':id/members/:memberId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Alterar papel de membro (requer OWNER/ADMIN)' })
  async updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateWorkspaceMemberDto,
  ) {
    return this.workspacesService.updateMemberRole(id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Remover membro (requer OWNER/ADMIN)' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.workspacesService.removeMember(id, memberId);
  }
}
