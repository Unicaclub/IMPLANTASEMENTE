import { IsEmail, IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusBase } from '../../../common/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @Length(2, 160)
  fullName: string;

  @ApiProperty({ example: 'joao@copalite.io' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 160)
  fullName?: string;

  @ApiPropertyOptional({ enum: StatusBase })
  @IsOptional()
  @IsEnum(StatusBase)
  status?: StatusBase;
}
