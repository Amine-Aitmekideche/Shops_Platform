// src/users/users.service.ts (corrigé)
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UpdateDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Méthode create manquante
  async create(createUserDto: User): Promise<Omit<User, 'password'>> {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(user);
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find();
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, userDemnde: any, updateData: UpdateDto): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    if (user.id !== userDemnde.id && !['admin', 'super_admin'].includes(userDemnde.role)) {
      throw new NotFoundException(`You can only update your own information`);
    }

    if (!['admin', 'super_admin'].includes(user.role) && updateData.role) {
      updateData.role = user.role; // Ignore any role change attempt by non-admins
    }

    if(user.role === 'admin' && updateData.role && ['admin', 'super_admin'].includes(updateData.role)) {
      throw new NotFoundException(`Admins can't give themselves admin role`); 
    }
    Object.assign(user, updateData);
    const savedUser = await this.usersRepository.save(user);
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async changeStatus(id: string, userDemnde: any, isActive: boolean): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new NotFoundException(`You cannot change the status of a super_admin user`);
    }
    if(user.role === UserRole.ADMIN && userDemnde.role === UserRole.ADMIN) {
      throw new NotFoundException(`You cannot deactivate an admin user`);
    }
    user.isActive = isActive;
    const savedUser = await this.usersRepository.save(user);
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async remove(id: string, userDemnde: any): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new NotFoundException(`You cannot delete a super_admin user`);
    }
    if (user.id === userDemnde.id) {
      throw new NotFoundException(`You cannot delete your own account`);
    }

    if (!['admin', 'super_admin'].includes(userDemnde.role)) {
      throw new NotFoundException(`You do not have permission to delete this user`);
    }

    if (userDemnde.role === UserRole.ADMIN && user.role === UserRole.ADMIN) {
      throw new NotFoundException(`Admins cannot delete other admin users`);
    }
    
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}