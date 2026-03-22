import { IsEnum, IsIn, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PROJECT_TYPES, StatusBase } from '../../../common/enums';

export class CreateProjectDto {
  @ApiProperty()
  @IsUUID()
  workspaceId: string;

  @ApiProperty({ example: 'My Legacy App' })
  @IsString()
  @Length(3, 180)
  name: string;

  @ApiProperty({ example: 'my-legacy-app' })
  @IsString()
  @Length(3, 200)
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'fintech' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  domainType?: string;

  @ApiProperty({ example: 'web_application', enum: PROJECT_TYPES })
  @IsIn(PROJECT_TYPES)
  projectType: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 180)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: StatusBase })
  @IsOptional()
  @IsEnum(StatusBase)
  status?: StatusBase;
}
