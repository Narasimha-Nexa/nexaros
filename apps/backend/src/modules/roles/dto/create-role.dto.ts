import { IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Kitchen Manager' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Can manage kitchen operations and inventory' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: ['permission_id_1', 'permission_id_2'],
    description: 'Array of permission IDs to assign to this role',
  })
  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}
