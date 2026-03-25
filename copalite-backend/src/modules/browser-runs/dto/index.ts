import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BrowserRunStatus } from '../../../common/enums';

export class CreateBrowserRunDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsUUID() targetId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sessionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 180) module?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 220) journeyName?: string;
}

export class UpdateBrowserRunDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(BrowserRunStatus) status?: BrowserRunStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() errorMessage?: string;
}
