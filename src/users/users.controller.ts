import { Controller, Get, Patch, Body, Param, UseGuards, Request, UnauthorizedException, Delete, Post } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {

    constructor(private usersService: UsersService) {}

    @Post('create')
    @UseGuards(JwtAuthGuard)
    async create(@Request() req, @Body() createUserDto: any) {
        const user = req.user;
        if (!['admin', 'super_admin'].includes(user.role)) {
            throw new UnauthorizedException('You do not have permission to access this resource');
        }
        if (createUserDto.role && ['admin', 'super_admin'].includes(createUserDto.role) && user.role !== 'super_admin') {
            throw new UnauthorizedException('Only super_admins can create admin or super_admin users');
        }
        createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
        return this.usersService.create(createUserDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Request() req) {
        const user = req.user;
        if (!['admin', 'super_admin'].includes(user.role)) {
            throw new UnauthorizedException('You do not have permission to access this resource');
        }
        return this.usersService.findAll();
    }

    // 2. Récupérer ses propres infos
    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Request() req) {
        return this.usersService.findOne(req.user.id);
    }

    // 3. Mettre à jour ses propres infos
    @Patch('me')
    @UseGuards(JwtAuthGuard)
    updateMe(@Request() req, @Body() updateDto: UpdateDto) {
        return this.usersService.update(req.user.id, req.user, updateDto);
    }

    // 4. Mettre à jour un utilisateur (admin/super_admin)
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    updateUser(@Request() req, @Param('id') id: string, @Body() updateDto: any) {
        const user = req.user;
        if (!['admin', 'super_admin'].includes(user.role)) {
            throw new UnauthorizedException('You do not have permission to update this user');
        }
        return this.usersService.update(id, req.user, updateDto);
    }

    // 5. Activer/désactiver un utilisateur (admin/super_admin)
    @Patch(':id/change-status')
    @UseGuards(JwtAuthGuard)
    activateUser(@Request() req, @Param('id') id: string ,@Body() body: { isActive: boolean }) {
        const user = req.user;
        if (!['admin', 'super_admin'].includes(user.role)) {
            throw new UnauthorizedException('You do not have permission to activate this user');
        }
        return this.usersService.changeStatus(id, user,body.isActive);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteUser(@Request() req, @Param('id') id: string) {
        const user = req.user;
        if (!['admin', 'super_admin'].includes(user.role)) {
            throw new UnauthorizedException('You do not have permission to delete this user');
        }
        await this.usersService.remove(id, user);
        return { message: 'User deleted successfully', id };
    }
}
