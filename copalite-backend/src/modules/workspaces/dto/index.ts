import { IsEnum, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusBase, WorkspaceMemberRole } from '../../../common/enums';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Company' })
  @IsString()
  @Length(3, 160)
  name: string;

  @ApiProperty({ example: 'my-company' })
  @IsString()
  @Length(3, 180)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens' })
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 160)
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

export class AddWorkspaceMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: WorkspaceMemberRole })
  @IsEnum(WorkspaceMemberRole)
  memberRole: WorkspaceMemberRole;
}

export class UpdateWorkspaceMemberDto {
  @ApiProperty({ enum: WorkspaceMemberRole })
  @IsEnum(WorkspaceMemberRole)
  memberRole: WorkspaceMemberRole;
}
