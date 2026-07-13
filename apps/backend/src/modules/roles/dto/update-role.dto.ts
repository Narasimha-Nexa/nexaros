import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Kitchen Manager' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Can manage kitchen operations and inventory' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: ['permission_id_1', 'permission_id_2'],
    description: 'Array of permission IDs to assign to this role. Replaces all existing permissions.',
  })
  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}
