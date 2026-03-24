import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusBase } from '../../common/enums';
import { NotificationEntity } from './entities/notification.entity';
import { CreateNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@InjectRepository(NotificationEntity) private readonly repo: Repository<NotificationEntity>) {}

  async create(dto: CreateNotificationDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async findByUser(userId: string, status?: string) {
    const where: Record<string, unknown> = { userId };
    if (status === 'unread') where.readAt = null;
    if (status === 'read') {
      // readAt IS NOT NULL — handled with query builder below
    }

    const qb = this.repo.createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.status != :archived', { archived: StatusBase.ARCHIVED });

    if (status === 'unread') qb.andWhere('n.read_at IS NULL');
    if (status === 'read') qb.andWhere('n.read_at IS NOT NULL');

    return qb.orderBy('n.created_at', 'DESC').take(50).getMany();
  }

  async findByWorkspace(workspaceId: string) {
    return this.repo.find({ where: { workspaceId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.repo.createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.read_at IS NULL')
      .andWhere('n.status != :archived', { archived: StatusBase.ARCHIVED })
      .getCount();
    return { count };
  }

  async markRead(id: string) {
    const n = await this.repo.findOne({ where: { id } });
    if (!n) throw new NotFoundException('Notificação não encontrada');
    n.readAt = new Date();
    return this.repo.save(n);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.repo.createQueryBuilder()
      .update(NotificationEntity)
      .set({ readAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('read_at IS NULL')
      .andWhere('status != :archived', { archived: StatusBase.ARCHIVED })
      .execute();
    return { updated: result.affected || 0 };
  }

  async archive(id: string): Promise<{ message: string }> {
    const n = await this.repo.findOne({ where: { id } });
    if (!n) throw new NotFoundException('Notificação não encontrada');
    n.status = StatusBase.ARCHIVED;
    await this.repo.save(n);
    return { message: 'Notificação arquivada' };
  }

  /** Fire-and-forget — never throws */
  async notify(workspaceId: string, type: string, title: string, message: string, userId?: string): Promise<void> {
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
