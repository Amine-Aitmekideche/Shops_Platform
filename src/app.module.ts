import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { databaseConfig } from './config/database.config';
import { ShopsModule } from './shops/shops.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersService } from './orders/orders.service';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    // Permet d’utiliser les variables d’environnement
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Connecte l’application à la base de données au démarrage
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsersModule,
    ShopsModule,
    ProductsModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [],
  providers: [OrdersService],
})
export class AppModule {}