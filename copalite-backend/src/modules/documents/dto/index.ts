import { IsEnum, IsIn, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DOCUMENT_TYPES, StatusBase } from '../../../common/enums';

export class CreateDocumentDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sourceId?: string;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() @Length(3, 240) @Matches(/^[a-z0-9-]+$/) slug: string;
  @ApiProperty({ enum: DOCUMENT_TYPES }) @IsIn(DOCUMENT_TYPES) documentType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentMarkdown?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 220) title?: string;
  @ApiPropertyOptional({ enum: StatusBase }) @IsOptional() @IsEnum(StatusBase) status?: StatusBase;
  @ApiPropertyOptional() @IsOptional() @IsString() contentMarkdown?: string;
}

export class CreateDocumentVersionDto {
  @ApiProperty() @IsString() contentMarkdown: string;
  @ApiPropertyOptional() @IsOptional() @IsString() changeSummary?: string;
}
