import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptEntity } from './entities/prompt.entity';
import { PromptsService } from './prompts.service';
import { PromptsController } from './prompts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PromptEntity])],
  controllers: [PromptsController],
  providers: [PromptsService],
  exports: [PromptsService, TypeOrmModule],
})
export class PromptsModule {}
