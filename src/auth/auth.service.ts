import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: any }> {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: registerDto.email } 
    });
    
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Créer l'utilisateur
    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    // Générer le token JWT
    const payload = { 
      sub: savedUser.id, 
      email: savedUser.email, 
      role: savedUser.role 
    };
    
    const access_token = this.jwtService.sign(payload);
    console.log('User registered with email:', access_token);
    // Ne pas renvoyer le mot de passe
    const { password, ...userWithoutPassword } = savedUser;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    // Trouver l'utilisateur
    const user = await this.usersRepository.findOne({ 
      where: { email: loginDto.email } 
    });
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Générer le token JWT
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    const access_token = this.jwtService.sign(payload);

    // Ne pas renvoyer le mot de passe
    const { password, ...userWithoutPassword } = user;
    console.log('User logged in with email:', access_token);
    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async validateUser(payload: any): Promise<User | null> {
    return await this.usersRepository.findOne({ 
      where: { id: payload.sub } 
    });
  }

  decodeToken(token: string) {
  try {
    return this.jwtService.decode(token); // décode sans vérifier la signature
  } catch (e) {
    return null;
  }
}
}