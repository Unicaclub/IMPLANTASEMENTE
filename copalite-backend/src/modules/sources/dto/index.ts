import { IsEnum, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType, AuthMode, StatusBase } from '../../../common/enums';

export class CreateSourceDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() @Length(3, 180) name: string;
  @ApiProperty({ enum: SourceType }) @IsEnum(SourceType) sourceType: SourceType;
  @ApiProperty() @IsString() @MaxLength(2000) @Matches(/^(?!.*\.\.\/)/, { message: 'Path traversal not allowed' }) location: string;
  @ApiPropertyOptional({ enum: AuthMode }) @IsOptional() @IsEnum(AuthMode) authMode?: AuthMode;
  @ApiPropertyOptional() @IsOptional() @IsString() credentialsRef?: string;
  @ApiPropertyOptional() @IsOptional() connectionConfigJson?: Record<string, any>;
}

export class UpdateSourceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 180) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) @Matches(/^(?!.*\.\.\/)/, { message: 'Path traversal not allowed' }) location?: string;
  @ApiPropertyOptional({ enum: StatusBase }) @IsOptional() @IsEnum(StatusBase) status?: StatusBase;
  @ApiPropertyOptional({ enum: AuthMode }) @IsOptional() @IsEnum(AuthMode) authMode?: AuthMode;
  @ApiPropertyOptional() @IsOptional() @IsString() credentialsRef?: string;
  @ApiPropertyOptional() @IsOptional() connectionConfigJson?: Record<string, any>;
}
