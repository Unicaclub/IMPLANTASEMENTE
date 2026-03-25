import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '../../../common/enums';

export class CreateSessionDto {
  @ApiProperty() @IsUUID() targetId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() profileName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authMode?: string;
  @ApiPropertyOptional() @IsOptional() sessionDataJson?: Record<string, unknown>;
}

export class ValidateSessionDto {
  @ApiProperty() @IsUUID() targetId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() profileName?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(SessionStatus) status?: SessionStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() errorMessage?: string;
  @ApiPropertyOptional() @IsOptional() sessionDataJson?: Record<string, unknown>;
}
