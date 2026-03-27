import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateHealthCheckDto {
  @ApiProperty() @IsString() @Length(1, 180) componentName: string;
  @ApiProperty() @IsString() @Length(1, 80) componentType: string;
  @ApiProperty() @IsString() @MaxLength(100) status: string;
  @ApiPropertyOptional() @IsOptional() detailsJson?: Record<string, any>;
}
