import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { databaseConfig } from './config/database.config';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ShopsModule } from './shops/shops.module';

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
    ShopsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}