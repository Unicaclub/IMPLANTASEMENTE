import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ActivityHistorySubscriber } from '../common/subscribers/activity-history.subscriber';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'copalite'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE', 'copalite_db'),
        synchronize: false,
        logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
        ssl: configService.get<string>('DB_SSL', 'false') === 'true'
          ? { rejectUnauthorized: false }
          : false,
        autoLoadEntities: true,
        subscribers: [ActivityHistorySubscriber],
      }),
    }),
  ],
})
export class DatabaseModule {}
