import { IsEnum, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusBase } from '../../../common/enums';
export class CreateReportDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() runId?: string;
  @ApiProperty() @IsString() @MaxLength(100) reportType: string;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() @MaxLength(2000) summary: string;
  @ApiProperty() @IsString() @MaxLength(50000) contentMarkdown: string;
}
export class UpdateReportDto {
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentMarkdown?: string;
  @ApiPropertyOptional({ enum: StatusBase }) @IsOptional() @IsEnum(StatusBase) status?: StatusBase;
}
