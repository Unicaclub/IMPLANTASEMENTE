import { IsEnum, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RouteType, StatusBase, ConfidenceStatus } from '../../../common/enums';

export class CreateRouteRegistryDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() runId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() moduleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sourceId?: string;
  @ApiProperty({ enum: RouteType }) @IsEnum(RouteType) routeType: RouteType;
  @ApiProperty() @IsString() @MaxLength(2000) path: string;
  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 180) screenName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdateRouteRegistryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: StatusBase }) @IsOptional() @IsEnum(StatusBase) status?: StatusBase;
  @ApiPropertyOptional({ enum: ConfidenceStatus }) @IsOptional() @IsEnum(ConfidenceStatus) confidenceStatus?: ConfidenceStatus;
}
