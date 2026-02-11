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
  ForbiddenException 
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createShopDto: CreateShopDto, @Request() req) {
    // Seuls les vendeurs et admins peuvent créer des shops
    console.log('User role:', req.user.userId); // Debug: Affiche le rôle de l'utilisateur
    if (!['seller', 'admin', 'super_admin'].includes(req.user.role)) {
      throw new ForbiddenException('Only sellers can create shops');
    }
    
    return this.shopsService.create(createShopDto, req.user);
  }

  @Get()
  findAll() {
    return this.shopsService.findAll();
  }

  @Get('my-shops')
  @UseGuards(JwtAuthGuard)
  findMyShops(@Request() req) {
    return this.shopsService.findMyShops(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string, 
    @Body() updateShopDto: UpdateShopDto,
    @Request() req,
  ) {
    console.log('User role:', req.user.role); // Debug: Affiche le rôle de l'utilisateur]]
    console.log('User ID:', req); // Debug: Affiche l'ID de l'utilisateur
    return this.shopsService.update(
      id, 
      updateShopDto, 
      req.user.userId, 
      req.user.role
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.shopsService.remove(id, req.user.userId, req.user.role);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard)
  verifyShop(@Param('id') id: string, @Request() req) {
    // Seuls les admins et super admins peuvent vérifier les shops
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      throw new ForbiddenException('Only admins can verify shops');
    }
    
    return this.shopsService.verifyShop(id, req.user.userId);
  }
}