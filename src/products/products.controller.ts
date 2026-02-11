import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req,
    @Query('shopId') shopId: string,
  ) {
    if (!shopId) {
      throw new ForbiddenException('shopId is required');
    }
    
    // Seuls les vendeurs et admins peuvent ajouter des produits
    if (![UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(req.user.role)) {
      throw new ForbiddenException('Only sellers can create products');
    }

    return this.productsService.create(
      createProductDto,
      shopId,
      req.user.userId,
      req.user.role,
    );
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req,
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.userId, req.user.role);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard)
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Request() req,
  ) {
    return this.productsService.updateStock(id, quantity, req.user.userId, req.user.role);
  }
}