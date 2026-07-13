import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // ── STAFF ──

  @Get('staff')
  @ApiOperation({ summary: 'List staff by branch' })
  findAllStaff(@Query('branchId') branchId: string, @Query() pagination?: PaginationDto) {
    const { skip, take } = paginate(pagination?.page, pagination?.limit);
    return this.staffService.findAllStaff(branchId, skip, take);
  }

  @Get('staff/:id')
  @ApiOperation({ summary: 'Get staff details' })
  findOneStaff(@Param('id') id: string) {
    return this.staffService.findOneStaff(id);
  }

  @Post('staff')
  @ApiOperation({ summary: 'Create staff member' })
  createStaff(@Query('branchId') branchId: string, @Body() dto: CreateStaffDto) {
    return this.staffService.createStaff(branchId, dto);
  }

  @Patch('staff/:id')
  @ApiOperation({ summary: 'Update staff member' })
  updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staffService.updateStaff(id, dto);
  }

  @Delete('staff/:id')
  @ApiOperation({ summary: 'Deactivate staff member' })
  removeStaff(@Param('id') id: string) {
    return this.staffService.removeStaff(id);
  }

  // ── SHIFTS ──

  @Get('shifts')
  @ApiOperation({ summary: 'List shifts by branch' })
  findAllShifts(@Query('branchId') branchId: string) {
    return this.staffService.findAllShifts(branchId);
  }

  @Post('shifts')
  @ApiOperation({ summary: 'Create shift' })
  createShift(@Query('branchId') branchId: string, @Body() dto: CreateShiftDto) {
    return this.staffService.createShift(branchId, dto);
  }

  @Patch('shifts/:id')
  @ApiOperation({ summary: 'Update shift' })
  updateShift(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.staffService.updateShift(id, dto);
  }

  @Delete('shifts/:id')
  @ApiOperation({ summary: 'Delete shift' })
  removeShift(@Param('id') id: string) {
    return this.staffService.removeShift(id);
  }

  // ── SCHEDULE ──

  @Get('schedule')
  @ApiOperation({ summary: 'Get schedule for date' })
  getSchedule(
    @Query('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    return this.staffService.getSchedule(branchId, date);
  }

  @Post('schedule/assign')
  @ApiOperation({ summary: 'Assign staff to shift' })
  assignShift(
    @Query('staffId') staffId: string,
    @Query('shiftId') shiftId: string,
    @Query('date') date: string,
  ) {
    return this.staffService.assignShift(staffId, shiftId, date);
  }

  // ── ATTENDANCE ──

  @Post('staff/:id/clock-in')
  @ApiOperation({ summary: 'Clock in staff' })
  clockIn(@Param('id') id: string) {
    return this.staffService.clockIn(id);
  }

  @Post('staff/:id/clock-out')
  @ApiOperation({ summary: 'Clock out staff' })
  clockOut(@Param('id') id: string) {
    return this.staffService.clockOut(id);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get today\'s attendance by branch' })
  getTodayAttendance(@Query('branchId') branchId: string) {
    return this.staffService.getTodayAttendance(branchId);
  }

  @Get('staff/:id/attendance')
  @ApiOperation({ summary: 'Get attendance report for staff' })
  getAttendanceReport(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.staffService.getAttendanceReport(id, from, to);
  }
}
