import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Post()
  async create(@Body() dto: CreateNotificationDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['unread', 'read'] })
  async find(
    @CurrentUser('id') userId: string,
    @Query('workspaceId') wid?: string,
    @Query('status') status?: string,
  ) {
    if (wid) return this.svc.findByWorkspace(wid);
    return this.svc.findByUser(userId, status);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser('id') userId: string) {
    return this.svc.getUnreadCount(userId);
  }

  @Patch(':id/read')
  async markRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.markRead(id);
  }

  @Patch('mark-all-read')
  async markAllRead(@CurrentUser('id') userId: string) {
    return this.svc.markAllRead(userId);
  }

  @Delete(':id')
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.archive(id);
  }
}
