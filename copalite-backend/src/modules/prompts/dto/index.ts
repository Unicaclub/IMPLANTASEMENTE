import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromptType, StatusBase } from '../../../common/enums';

export class CreatePromptDto {
  @ApiProperty() @IsUUID() agentId: string;
  @ApiProperty() @IsString() @Length(3, 180) name: string;
  @ApiProperty({ enum: PromptType }) @IsEnum(PromptType) promptType: PromptType;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) version?: number;
  @ApiProperty() @IsString() @MaxLength(50000) contentMarkdown: string;
}

export class UpdatePromptDto {
  @ApiPropertyOptional() @IsOptional() @IsString() contentMarkdown?: string;
  @ApiPropertyOptional({ enum: StatusBase }) @IsOptional() @IsEnum(StatusBase) status?: StatusBase;
}
