// src/products/products.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ShopsService } from '../shops/shops.service';
import { Product } from './entities/product.entity';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private shopsService: ShopsService,
  ) {}

  async create(createProductDto: CreateProductDto, shopId: string, userId: string, userRole: string): Promise<Product> {
    // Vérifier que le shop existe et appartient à l'utilisateur ou admin
    const shop = await this.shopsService.findOne(shopId);
    
    if (shop.ownerId !== userId && !['super_admin', 'admin'].includes(userRole)) {
      throw new ForbiddenException('You can only add products to your own shops');
    }

    const product = this.productsRepository.create({
      ...createProductDto,
      shop,
      shopId,
    });

    return await this.productsRepository.save(product);
  }


  async findAll(query: any = {}): Promise<Product[]> {
    const { shopId, category, minPrice, maxPrice } = query;
    const where: any = { isActive: true };

    if (shopId) where.shopId = shopId;
    if (category) where.category = category;

    if (minPrice && maxPrice) {
      where.price = Between(Number(minPrice), Number(maxPrice));
    } else if (minPrice) {
      where.price = MoreThanOrEqual(Number(minPrice));
    } else if (maxPrice) {
      where.price = LessThanOrEqual(Number(maxPrice));
    }

    return this.productsRepository.find({
      where,
      relations: ['shop'],
    });
  }


  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['shop', 'shop.owner'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string, userRole: string): Promise<Product> {
    const product = await this.findOne(id);
    
    // Vérifier permissions
    if (product.shop.ownerId !== userId && !['super_admin', 'admin'].includes(userRole)) {
      throw new ForbiddenException('You can only update products from your own shops');
    }

    Object.assign(product, updateProductDto);
    return await this.productsRepository.save(product);
  }

  async remove(id: string, userId: string, userRole: string): Promise<{message : string}> {
    const product = await this.findOne(id);
    
    if (product.shop.ownerId !== userId && !['super_admin', 'admin'].includes(userRole)) {
      throw new ForbiddenException('You can only delete products from your own shops');
    }

    const result = await this.productsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Product not found or already deleted');
    }

    return { message: 'Product deleted successfully' };
  }

  async updateStock(id: string, quantity: number, userId: string, userRole: string): Promise<Product> {
    const product = await this.findOne(id);
    
    if (product.shop.ownerId !== userId && !['super_admin', 'admin'].includes(userRole)) {
      throw new ForbiddenException('You can only update stock of your own products');
    }

    product.stockQuantity = quantity;
    return await this.productsRepository.save(product);
  }
}