import { IsString, IsOptional, IsBoolean, IsArray, IsObject, IsInt, Min, Max, ValidateNested, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class WorkflowStepDto {
  @ApiProperty({ description: 'Human-readable step name', example: 'Manager Approval' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Role required to approve this step', example: 'MANAGER', enum: ['ANY', 'OWNER', 'MANAGER', 'SHIFT_MANAGER', 'CHEF', 'CASHIER', 'SUPER_ADMIN'] })
  @IsIn(['ANY', 'OWNER', 'MANAGER', 'SHIFT_MANAGER', 'CHEF', 'CASHIER', 'SUPER_ADMIN'])
  approverRole!: string;

  @ApiPropertyOptional({ description: 'Optional action executed when this step is approved', enum: ['none', 'notify', 'webhook', 'status_change'] })
  @IsOptional()
  @IsIn(['none', 'notify', 'webhook', 'status_change'])
  action?: 'none' | 'notify' | 'webhook' | 'status_change';

  @ApiPropertyOptional({ description: 'Action configuration (channel/payload/url/etc.)' })
  @IsOptional()
  @IsObject()
  actionConfig?: Record<string, any>;
}

export class CreateWorkflowTemplateDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Entity the workflow applies to', example: 'ORDER' })
  @IsString()
  entityType!: string;

  @ApiProperty({ description: 'Domain event that triggers the workflow', example: 'order:created' })
  @IsString()
  triggerEvent!: string;

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps!: WorkflowStepDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWorkflowTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  triggerEvent?: string;

  @ApiPropertyOptional({ type: [WorkflowStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps?: WorkflowStepDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateWorkflowRequestDto {
  @ApiProperty()
  @IsString()
  templateId!: string;

  @ApiProperty()
  @IsString()
  entityType!: string;

  @ApiProperty()
  @IsString()
  entityId!: string;

  @ApiProperty()
  @IsString()
  action!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  requestData?: Record<string, any>;

  @ApiProperty()
  @IsString()
  requestedBy!: string;
}

export class DecisionDto {
  @ApiPropertyOptional({ description: 'Approver note / rejection reason' })
  @IsOptional()
  @IsString()
  notes?: string;
}
