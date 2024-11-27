import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { ProfileModule } from 'src/profile/profile.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from './entites/auth.entity';
import { User } from 'src/user/entites/user.entity';
import { UtilsService } from '../utils/utils.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth, User]),
    forwardRef(() => UserModule),
    PassportModule,
    ProfileModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        // signOptions: {
        //   expiresIn: '7d',
        // },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UtilsService],
  exports: [AuthService],
})
export class AuthModule {}
