import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { CreateNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@InjectRepository(NotificationEntity) private readonly repo: Repository<NotificationEntity>) {}

  async create(dto: CreateNotificationDto) { return this.repo.save(this.repo.create(dto)); }

  async findByWorkspace(workspaceId: string) {
    return this.repo.find({ where: { workspaceId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async markRead(id: string) {
    const n = await this.repo.findOne({ where: { id } });
    if (!n) throw new NotFoundException('Notification not found');
    n.readAt = new Date();
    return this.repo.save(n);
  }

  async notify(workspaceId: string, type: string, title: string, message: string, userId?: string) {
    try {
      await this.repo.save(this.repo.create({
        workspaceId,
        type,
        title,
        message,
        userId: userId || null,
      }));
    } catch (err) {
      this.logger.warn(`Failed to create notification: ${err}`);
    }
  }
}
