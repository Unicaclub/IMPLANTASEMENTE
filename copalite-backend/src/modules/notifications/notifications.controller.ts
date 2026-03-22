import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto';
@ApiTags('Notifications') @ApiBearerAuth() @Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}
  @Post() async create(@Body() dto: CreateNotificationDto) { return this.svc.create(dto); }
  @Get() @ApiQuery({ name: 'workspaceId', required: true }) async find(@Query('workspaceId', ParseUUIDPipe) wid: string) { return this.svc.findByWorkspace(wid); }
  @Patch(':id/read') async markRead(@Param('id', ParseUUIDPipe) id: string) { return this.svc.markRead(id); }
}
