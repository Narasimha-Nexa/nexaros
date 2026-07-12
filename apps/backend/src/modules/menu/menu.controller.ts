import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, UseInterceptors,
  UploadedFile, UploadedFiles, ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { menuImageMulterOptions } from '../../common/multer/multer.config';

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
  createCategory(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.menuService.createCategory(tenantId, dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.menuService.updateCategory(id, tenantId, dto);
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
  @ApiQuery({ name: 'search', required: false })
  findAllItems(
    @CurrentTenant() tenantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.menuService.findAllItems(tenantId, categoryId, search);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get menu item by ID' })
  findOneItem(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.menuService.findOneItem(id, tenantId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create a menu item' })
  createItem(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.menuService.createItem(tenantId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a menu item' })
  updateItem(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateItem(id, tenantId, dto);
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

  // ─── Images ───

  @Post('items/:id/images')
  @ApiOperation({ summary: 'Upload images for a menu item (max 10)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10, menuImageMulterOptions))
  uploadImages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.menuService.uploadImages(id, tenantId, files);
  }

  @Delete('items/:id/images/:imageId')
  @ApiOperation({ summary: 'Delete a menu item image' })
  deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.menuService.deleteImage(id, imageId, tenantId);
  }

  @Patch('items/:id/images/:imageId/primary')
  @ApiOperation({ summary: 'Set image as primary' })
  setPrimaryImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.menuService.setPrimaryImage(id, imageId, tenantId);
  }
}
