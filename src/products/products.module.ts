// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ShopsModule } from 'src/shops/shops.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]), // ✅ permet à @InjectRepository(Product) de fonctionner
    ShopsModule,                         // ✅ injecter ShopsService
    ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}