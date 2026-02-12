// src/cart/cart.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    private productsService: ProductsService,
  ) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartItem> {
    const { productId, quantity } = addToCartDto;

    // Vérifier que le produit existe et est en stock
    const product = await this.productsService.findOne(productId);
    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }
    if (product.stockQuantity < quantity) {
      throw new BadRequestException('Not enough stock');
    }

    // Chercher si l'article est déjà dans le panier
    let cartItem = await this.cartRepository.findOne({
      where: { userId, productId },
    });

    if (cartItem) {
      // Mettre à jour la quantité
      cartItem.quantity += quantity;
      if (cartItem.quantity > product.stockQuantity) {
        throw new BadRequestException('Not enough stock');
      }
    } else {
      // Créer un nouvel item
      cartItem = this.cartRepository.create({
        userId,
        productId,
        quantity,
      });
    }

    return await this.cartRepository.save(cartItem);
  }

  async getCart(userId: string): Promise<CartItem[]> {
    return await this.cartRepository.find({
      where: { user: { id: userId } },
      relations: ['product', 'product.shop'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateCartItem(id: string, userId: string, updateCartItemDto: UpdateCartItemDto): Promise<CartItem> {
    const cartItem = await this.cartRepository.findOne({
      where: { id, userId },
      relations: ['product'],
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (updateCartItemDto.quantity > cartItem.product.stockQuantity) {
      throw new BadRequestException('Not enough stock');
    }

    cartItem.quantity = updateCartItemDto.quantity;
    return await this.cartRepository.save(cartItem);
  }

  async removeCartItem(id: string, userId: string): Promise<void> {
    const result = await this.cartRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Cart item not found');
    }
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepository.delete({ userId });
  }

  // Méthode utilisée lors de la validation de commande
  async getCartTotal(userId: string): Promise<number> {
    const cartItems = await this.getCart(userId);
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }
}