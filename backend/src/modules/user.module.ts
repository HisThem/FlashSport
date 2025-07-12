import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User } from '../entities/user.entity';
import { UserController } from '../controller/user.controller';
import { UserService } from '../service/user.service';
import { DatabaseService } from '../service/database.service';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'flashsport-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, DatabaseService, JwtStrategy],
  exports: [UserService, DatabaseService],
})
export class UserModule {}
