import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'manager@spicekitchen.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiProperty({ example: 'securePass123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Raj' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Kumar' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: 'MANAGER', enum: ['OWNER', 'MANAGER', 'STAFF'] })
  @IsString()
  @IsOptional()
  @IsIn(['OWNER', 'MANAGER', 'STAFF'], {
    message: 'Role must be OWNER, MANAGER, or STAFF',
  })
  role?: string;
}
