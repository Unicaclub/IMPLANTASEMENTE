import { IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AUDIT_TYPES } from '../../../common/enums';

export class CreateAuditDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() runId?: string;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty({ enum: AUDIT_TYPES }) @IsIn(AUDIT_TYPES) auditType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() scopeText?: string;
  @ApiProperty() @IsString() @MaxLength(2000) summary: string;
  @ApiProperty() @IsString() @MaxLength(100) resultStatus: string;
}
export class UpdateAuditDto {
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resultStatus?: string;
}
