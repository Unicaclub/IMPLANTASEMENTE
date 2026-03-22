import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateNotificationDto {
  @ApiProperty() @IsUUID() workspaceId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
  @ApiProperty() @IsString() type: string;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() message: string;
}
