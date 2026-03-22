import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDecisionDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() decisionStatus: string;
  @ApiProperty() @IsString() context: string;
  @ApiProperty() @IsString() decisionText: string;
  @ApiPropertyOptional() @IsOptional() @IsString() consequences?: string;
}

export class UpdateDecisionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 220) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() decisionStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() decisionText?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() consequences?: string;
}
