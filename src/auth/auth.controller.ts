import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards ,Request} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { request } from 'http';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    // req.user est le résultat de la méthode validate() de JwtStrategy
    return {
      message: 'Token valide',
      user: req.user,           // contient { userId, email, role }
      // Pour voir le payload brut du token (décodé), vous pouvez également renvoyer ce que vous voulez
    };
  }

  @Get('verify-token')
  @UseGuards(JwtAuthGuard)
  verifyToken(@Request() req) {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const decoded = this.authService.decodeToken(token);
    return {
      message: 'Token valide',
      user: req.user,
      decodedToken: decoded, // contient iat, exp, sub, email, role
    };
  }
}