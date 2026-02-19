import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ShopsModule } from './shops/shops.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    // Charge les variables d'environnement et enregistre la configuration "database"
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig ,jwtConfig], // ← on enregistre la configuration
    }),
    // Configuration asynchrone de TypeORM avec injection de ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // On récupère l'objet "database" enregistré plus haut
        const dbConfig = configService.get('database');
        return {
          type: dbConfig.type,         // 'postgres'
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          logging: dbConfig.logging,
          synchronize: dbConfig.synchronize,
        };
      },
    }),
    // Vos modules
    AuthModule,
    UsersModule,
    ShopsModule,
    ProductsModule,
    CartModule,
    OrdersModule,
  ],
})
export class AppModule {}