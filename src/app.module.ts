import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { databaseConfig } from './config/database.config';
import { ShopsModule } from './shops/shops.module';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { ProductsModule } from './products/products.module';

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
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class AppModule {}