import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('menu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ─── Categories ───

  @Get('categories')
  @ApiOperation({ summary: 'List all categories' })
  findAllCategories(@CurrentTenant() tenantId: string) {
    return this.menuService.findAllCategories(tenantId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  createCategory(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.menuService.createCategory(tenantId, data);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: any,
  ) {
    return this.menuService.updateCategory(id, tenantId, data);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  removeCategory(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.menuService.removeCategory(id, tenantId);
  }

  // ─── Menu Items ───

  @Get('items')
  @ApiOperation({ summary: 'List all menu items' })
  @ApiQuery({ name: 'categoryId', required: false })
  findAllItems(
    @CurrentTenant() tenantId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.menuService.findAllItems(tenantId, categoryId);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get menu item by ID' })
  findOneItem(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.menuService.findOneItem(id, tenantId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create a menu item' })
  createItem(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.menuService.createItem(tenantId, data);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a menu item' })
  updateItem(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: any,
  ) {
    return this.menuService.updateItem(id, tenantId, data);
  }

  @Patch('items/:id/availability')
  @ApiOperation({ summary: 'Toggle item availability' })
  toggleAvailability(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.menuService.toggleAvailability(id, tenantId);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a menu item' })
  removeItem(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.menuService.removeItem(id, tenantId);
  }
}
