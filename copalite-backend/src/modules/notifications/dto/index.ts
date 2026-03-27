import { IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateNotificationDto {
  @ApiProperty() @IsUUID() workspaceId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
  @ApiProperty() @IsString() @MaxLength(100) type: string;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() @MaxLength(2000) message: string;
}
