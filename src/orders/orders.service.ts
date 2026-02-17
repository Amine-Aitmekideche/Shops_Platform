// src/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    private cartService: CartService,
    private productsService: ProductsService,
    private dataSource: DataSource,
  ) {}

  // Créer une commande à partir du panier
  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const { shippingAddress, notes, paymentMethod = 'card' } = createOrderDto;

    // Récupérer le panier de l'utilisateur
    const cartItems = await this.cartService.getCart(userId);
    if (!cartItems.length) {
      throw new BadRequestException('Cart is empty');
    }

    // Vérifier les stocks
    for (const item of cartItems) {
      const product = item.product;
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Not enough stock for product: ${product.name}`);
      }
    }

    // Calculer le total
    const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Utiliser une transaction pour créer la commande et les items, et mettre à jour les stocks
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Créer la commande
      const order = this.ordersRepository.create({
        userId,
        total,
        shippingAddress,
        notes,
        paymentMethod,
        status: OrderStatus.PENDING,
      });
      await queryRunner.manager.save(order);

      // Créer les items de commande et mettre à jour les stocks
      for (const item of cartItems) {
        const orderItem = this.orderItemsRepository.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          shopId: item.product.shopId,
        });
        await queryRunner.manager.save(orderItem);

        // Mettre à jour le stock
        await this.productsService.updateStock(
          item.productId,
          item.product.stockQuantity - item.quantity,
          userId,
          'customer', // On passe customer mais la vérification sera contournée par l'admin ? On va gérer ça plus tard
        );
      }

      // Vider le panier
      await this.cartService.clearCart(userId);

      await queryRunner.commitTransaction();

      // Retourner la commande avec ses items
      return this.findOne(order.id, userId, 'customer');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // Trouver toutes les commandes (admin) ou les commandes de l'utilisateur (client/vendeur)
  async findAll(userId: string, userRole: string): Promise<Order[]> {
    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      // Admin voit tout
      return this.ordersRepository.find({
        relations: ['user', 'items', 'items.product'],
        order: { createdAt: 'DESC' },
      });
    } else if (userRole === UserRole.SELLER) {
      // Vendeur voit les commandes contenant ses produits
      const orders = await this.ordersRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .leftJoinAndSelect('order.user', 'user')
        .where('items.shopId IN (SELECT id FROM shops WHERE owner_id = :userId)', { userId })
        .orderBy('order.createdAt', 'DESC')
        .getMany();
      return orders;
    } else {
      // Client voit ses propres commandes
      return this.ordersRepository.find({
        where: { userId },
        relations: ['items', 'items.product'],
        order: { createdAt: 'DESC' },
      });
    }
  }

  // Trouver une commande par ID avec vérification des permissions
  async findOne(id: string, userId: string, userRole: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product', 'items.product.shop'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    // Vérifier les permissions
    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      return order;
    }
    if (userRole === UserRole.SELLER) {
      // Vérifier que la commande contient au moins un produit du vendeur
      const hasSellerProduct = order.items.some(item => item.shopId && item.product.shop.ownerId === userId);
      if (hasSellerProduct) {
        return order;
      }
      throw new ForbiddenException('You are not allowed to view this order');
    }
    // Client
    if (order.userId === userId) {
      return order;
    }
    throw new ForbiddenException('You are not allowed to view this order');
  }

  // Mettre à jour le statut d'une commande
  async updateStatus(id: string, userId: string, userRole: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id, userId, userRole);

    // Les clients ne peuvent pas changer le statut
    if (userRole === UserRole.CUSTOMER) {
      throw new ForbiddenException('Customers cannot update order status');
    }

    // Les vendeurs ne peuvent changer que certaines transitions (ex: processing, shipped)
    if (userRole === UserRole.SELLER) {
      // Vérifier que la commande contient au moins un produit du vendeur
      const hasSellerProduct = order.items.some(item => item.product.shop.ownerId === userId);
      if (!hasSellerProduct) {
        throw new ForbiddenException('You cannot update this order');
      }
      // Limiter les statuts autorisés pour le vendeur
      const allowedStatuses = [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
      if (!allowedStatuses.includes(updateOrderStatusDto.status)) {
        throw new ForbiddenException('You cannot set this status');
      }
    }

    // Admin et super admin peuvent tout faire
    order.status = updateOrderStatusDto.status;
    if (updateOrderStatusDto.status === OrderStatus.PAID && !order.paidAt) {
      order.paidAt = new Date();
    }
    if (updateOrderStatusDto.status === OrderStatus.CANCELLED) {
      // TODO: remettre le stock ?
      if (updateOrderStatusDto.status === OrderStatus.CANCELLED) {
        for (const item of order.items) {
            await this.productsService.updateStock(
            item.productId,
            item.product.stockQuantity + item.quantity,
            userId,
            'admin' // on force ici car ce n'est plus le client qui fait la mise à jour
            );
        }
    }

    }

    return this.ordersRepository.save(order);
  }

  // Annuler une commande (client ou admin)
  async cancel(id: string, userId: string, userRole: string): Promise<Order> {
    const order = await this.findOne(id, userId, userRole);
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order already cancelled');
    }
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered order');
    }
    // Le client ne peut annuler que les commandes en attente
    if (userRole === UserRole.CUSTOMER && order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('You cannot cancel this order at this stage');
    }
    order.status = OrderStatus.CANCELLED;
    // TODO: Restaurer le stock
    for (const item of order.items) {
            await this.productsService.updateStock(
            item.productId,
            item.product.stockQuantity + item.quantity,
            userId,
            'admin' // on force ici car ce n'est plus le client qui fait la mise à jour
            );
        }
    return this.ordersRepository.save(order);
  }

    async markAsPaid(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) {
        throw new NotFoundException(`Order #${orderId} not found`);
    }
    order.status = OrderStatus.PAID;
    order.paidAt = new Date();
    return this.ordersRepository.save(order);
    }
}