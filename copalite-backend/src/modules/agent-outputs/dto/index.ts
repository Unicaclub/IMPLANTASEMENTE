import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OutputType, ValidationStatus } from '../../../common/enums';

export class CreateAgentOutputDto {
  @ApiProperty() @IsUUID() agentRunId: string;
  @ApiProperty({ enum: OutputType }) @IsEnum(OutputType) outputType: OutputType;
  @ApiProperty() @IsString() @Length(3, 220) title: string;
  @ApiProperty() @IsString() contentMarkdown: string;
  @ApiPropertyOptional() @IsOptional() structuredDataJson?: Record<string, any>;
}

export class UpdateAgentOutputValidationDto {
  @ApiProperty({ enum: ValidationStatus }) @IsEnum(ValidationStatus) validationStatus: ValidationStatus;
}
