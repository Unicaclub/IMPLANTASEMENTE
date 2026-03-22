import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCodebaseArtifactDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() runId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sourceId?: string;
  @ApiProperty() @IsString() @Length(1, 80) artifactType: string;
  @ApiProperty() @IsString() artifactPath: string;
  @ApiProperty() @IsString() @Length(1, 220) artifactName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentPath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
export class UpdateCodebaseArtifactDto {
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
