import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from './entities/shop.entity';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
  ) {}

  async create(createShopDto: CreateShopDto, owner: any): Promise<Shop> {
    const shop = this.shopsRepository.create({
      ...createShopDto,
      ownerId: owner.userId,
    });
    
    return await this.shopsRepository.save(shop);
  }

  async findAll(): Promise<Shop[]> {
    return await this.shopsRepository.find({
      relations: ['owner'],
      where: { isActive: true },
    });
  }

  async findOne(id: string): Promise<Shop> {
    const shop = await this.shopsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    
    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }
    
    return shop;
  }

  async findMyShops(ownerId: string): Promise<Shop[]> {
    return await this.shopsRepository.find({
      where: { ownerId },
      relations: ['owner'],
    });
  }

  async update(id: string, updateShopDto: UpdateShopDto, userId: string, userRole: string): Promise<Shop> {
    const shop = await this.findOne(id);
    
    // Vérifier les permissions
    if (shop.ownerId !== userId && !['super_admin', 'admin'].includes(userRole)) {
      throw new ForbiddenException('You can only update your own shops');
    }
    
    Object.assign(shop, updateShopDto);
    console.log('Updated shop data:', updateShopDto); // Debug: Affiche les données mises à jour du shop
    return await this.shopsRepository.save(shop);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const shop = await this.findOne(id);
    
    // Vérifier les permissions
    if (shop.ownerId !== userId && !['super_admin', 'admin'].includes(userRole)) {
      throw new ForbiddenException('You can only delete your own shops');
    }
    
    await this.shopsRepository.delete(id);
  }

  async verifyShop(id: string, adminId: string): Promise<Shop> {
    const shop = await this.findOne(id);
    shop.isVerified = true;
    return await this.shopsRepository.save(shop);
  }
}