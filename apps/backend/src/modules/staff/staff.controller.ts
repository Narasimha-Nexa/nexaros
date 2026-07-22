import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentBranch } from '../../common/decorators/current-branch.decorator';
import { CurrentStaff } from '../../common/decorators/current-staff.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { ProcessPayrollDto } from './dto/process-payroll.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // ── STAFF ──

  @Get('staff')
  @ApiOperation({ summary: 'List staff by branch' })
  @RequirePermissions('staff:read')
  findAllStaff(@Query('branchId') branchId: string, @CurrentTenant() tenantId: string, @Query() pagination?: PaginationDto) {
    const { skip, take } = paginate(pagination?.page, pagination?.limit);
    return this.staffService.findAllStaff(branchId, tenantId, skip, take);
  }

  @Get('staff/:id')
  @ApiOperation({ summary: 'Get staff details' })
  findOneStaff(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.staffService.findOneStaff(id, tenantId);
  }

  @Post('staff')
  @ApiOperation({ summary: 'Create staff member' })
  @RequirePermissions('staff:write')
  createStaff(@Query('branchId') branchId: string, @Body() dto: CreateStaffDto, @CurrentTenant() tenantId: string) {
    return this.staffService.createStaff(branchId, dto, tenantId);
  }

  @Patch('staff/:id')
  @ApiOperation({ summary: 'Update staff member' })
  @RequirePermissions('staff:write')
  updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto, @CurrentTenant() tenantId: string) {
    return this.staffService.updateStaff(id, dto, tenantId);
  }

  @Delete('staff/:id')
  @ApiOperation({ summary: 'Deactivate staff member' })
  @RequirePermissions('staff:delete')
  removeStaff(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.staffService.removeStaff(id, tenantId);
  }

  // ── SHIFTS ──

  @Get('shifts')
  @ApiOperation({ summary: 'List shifts by branch' })
  findAllShifts(@Query('branchId') branchId: string, @CurrentTenant() tenantId: string) {
    return this.staffService.findAllShifts(branchId, tenantId);
  }

  @Post('shifts')
  @ApiOperation({ summary: 'Create shift' })
  createShift(@Query('branchId') branchId: string, @Body() dto: CreateShiftDto, @CurrentTenant() tenantId: string) {
    return this.staffService.createShift(branchId, dto, tenantId);
  }

  @Patch('shifts/:id')
  @ApiOperation({ summary: 'Update shift' })
  updateShift(@Param('id') id: string, @Body() dto: UpdateShiftDto, @CurrentTenant() tenantId: string) {
    return this.staffService.updateShift(id, dto, tenantId);
  }

  @Delete('shifts/:id')
  @ApiOperation({ summary: 'Delete shift' })
  removeShift(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.staffService.removeShift(id, tenantId);
  }

  // ── SCHEDULE ──

  @Get('schedule')
  @ApiOperation({ summary: 'Get schedule for date' })
  getSchedule(
    @Query('branchId') branchId: string,
    @Query('date') date: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.staffService.getSchedule(branchId, date, tenantId);
  }

  @Post('schedule/assign')
  @ApiOperation({ summary: 'Assign staff to shift' })
  assignShift(
    @Query('staffId') staffId: string,
    @Query('shiftId') shiftId: string,
    @Query('date') date: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.staffService.assignShift(staffId, shiftId, date, tenantId);
  }

  // ── ATTENDANCE ──

  @Post('staff/:id/clock-in')
  @ApiOperation({ summary: 'Clock in staff' })
  clockIn(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.staffService.clockIn(id, tenantId);
  }

  @Post('staff/:id/clock-out')
  @ApiOperation({ summary: 'Clock out staff' })
  clockOut(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.staffService.clockOut(id, tenantId);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get today\'s attendance by branch' })
  getTodayAttendance(@Query('branchId') branchId: string, @CurrentTenant() tenantId: string) {
    return this.staffService.getTodayAttendance(branchId, tenantId);
  }

  @Get('staff/:id/attendance')
  @ApiOperation({ summary: 'Get attendance report for staff' })
  getAttendanceReport(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.staffService.getAttendanceReport(id, from, to, tenantId);
  }

  // ── LEAVE REQUESTS ──

  @Post(':id/leave-requests')
  @ApiOperation({ summary: 'Create leave request' })
  @RequirePermissions('staff:write')
  async createLeaveRequest(
    @Param('id') staffId: string,
    @Body() dto: CreateLeaveRequestDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.staffService.createLeaveRequest(staffId, dto, tenantId);
  }

  @Get('leave-requests')
  @ApiOperation({ summary: 'List leave requests by branch' })
  @RequirePermissions('staff:read')
  async findAllLeaveRequests(
    @CurrentBranch('id') branchId: string,
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.staffService.findAllLeaveRequests(branchId, tenantId, status);
  }

  @Patch('leave-requests/:id')
  @ApiOperation({ summary: 'Approve/reject leave request' })
  @RequirePermissions('staff:write')
  async updateLeaveStatus(
    @Param('id') id: string,
    @CurrentStaff('id') staffId: string,
    @Body() dto: UpdateLeaveStatusDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.staffService.updateLeaveStatus(id, staffId, dto, tenantId);
  }

  // ── PAYROLL ──

  @Post('payroll/generate')
  @ApiOperation({ summary: 'Generate payroll for a month' })
  @RequirePermissions('staff:write')
  async generatePayroll(
    @CurrentBranch('id') branchId: string,
    @Body() dto: GeneratePayrollDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.staffService.generatePayroll(branchId, dto, tenantId);
  }

  @Get('payroll')
  @ApiOperation({ summary: 'List payrolls by branch' })
  @RequirePermissions('staff:read')
  async getPayrollsByBranch(
    @CurrentBranch('id') branchId: string,
    @CurrentTenant() tenantId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.staffService.getPayrollsByBranch(branchId, tenantId, month, year);
  }

  @Get(':id/payroll')
  @ApiOperation({ summary: 'Get payroll for a staff member' })
  @RequirePermissions('staff:read')
  async getPayrollsByStaff(@Param('id') staffId: string, @CurrentTenant() tenantId: string) {
    return this.staffService.getPayrollsByStaff(staffId, tenantId);
  }

  @Patch('payroll/:id/process')
  @ApiOperation({ summary: 'Process/pay a payroll entry' })
  @RequirePermissions('staff:write')
  async processPayroll(
    @Param('id') id: string,
    @Body() dto: ProcessPayrollDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.staffService.processPayroll(id, dto, tenantId);
  }
}
