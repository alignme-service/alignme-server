import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entites/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entites/auth.entity';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../user/types/userRole';
import { UserService } from '../user/user.service';
import ErrorCodes from '../constants/ErrorCodes';

export type ReturnValidateUser = {
  isAlready: boolean;
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly userService: UserService,

    private dataSource: DataSource,
  ) {}

  async autoLogin(refreshToken: string) {
    const { isExpired } = await this.verifyToken(refreshToken);

    if (isExpired) {
      throw new UnauthorizedException(ErrorCodes.ERR_02);
    }

    await this.userService.checkPendingUser(refreshToken);

    return {
      isExpired,
    };
  }

  async validateUser(payload: {
    kakaoMemberId: number;
    email: string;
    name: string;
  }): Promise<ReturnValidateUser | null> {
    const { kakaoMemberId, email, name } = payload;
    // isAlready: true => 이미 회원가입단계 끝낸 유저, false => ~ 안끝낸유저
    let isAlready = true;

    const findUser: User = await this.findUserByKakaoMemberId(kakaoMemberId);

    // 유저없을때 신규가입 처리 + 토큰 발급
    if (findUser === null) {
      isAlready = false;

      const createUser = this.userRepository.create({
        kakaoMemberId,
        email,
        name,
        createdAt: new Date(),
      });

      await this.userRepository.save(createUser);

      const accessToken = await this.generateAccessToken(
        kakaoMemberId,
        email,
        name,
      );
      const refreshToken = await this.generateRefreshToken(kakaoMemberId);

      const auth = this.authRepository.create({
        user: createUser,
        refreshToken: refreshToken,
      });

      // auth 객체를 DB에 저장
      await this.authRepository.save(auth);

      return {
        isAlready,
        accessToken,
        refreshToken,
      };
    }

    // 유저가 카톡 가입만 하고 회원가입 안했을때
    if (!findUser?.studio?.id) {
      isAlready = false;
    }

    // 유저 있을때 리프레시토큰 유효성 검사
    const { isExpired } = await this.verifyToken(findUser.auth.refreshToken);

    // 유저있고 리프레시토큰 만료시 토큰 재발급
    if (!isExpired) {
      const newAccessToken = await this.generateAccessToken(
        kakaoMemberId,
        email,
        name,
      );
      const newRefreshToken = await this.generateRefreshToken(kakaoMemberId);

      findUser.auth.refreshToken = newRefreshToken;
      await this.authRepository.save(findUser.auth);

      return {
        isAlready,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        // ...findUser,
      };
    }

    // 유저있고 리프레시토큰 유효시 access token만 재발급
    const accessToken = await this.generateAccessToken(
      kakaoMemberId,
      email,
      name,
    );
    return {
      isAlready,
      accessToken,
      refreshToken: findUser.auth.refreshToken,
      // ...findUser,
    };
  }

  async generateAccessToken(
    userId: number,
    email: string,
    name: string,
  ): Promise<string> {
    const payload = { userId, email, name };

    return this.jwtService.sign(payload, { expiresIn: '2 days' });
  }

  async generateRefreshToken(userId: number): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.sign(payload, { expiresIn: '7 days' });
  }

  async refreshToken(refreshToken: string) {
    // const { userId, email, name } = this.decodeAccessToken(accessToken);

    const {
      kakaoMemberId: userId,
      email,
      name,
    } = await this.findUserByRefreshToken(refreshToken);
    const { isExpired } = await this.verifyToken(refreshToken);

    if (isExpired) {
      const newAccessToken = await this.generateAccessToken(
        userId,
        email,
        name,
      );
      const newRefreshToken = await this.generateRefreshToken(userId);

      await this.updateRefreshToken(userId, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    }
    const newAccessToken = await this.generateAccessToken(userId, email, name);
    return {
      accessToken: newAccessToken,
      refreshToken,
    };
  }

  async setRefreshToken(user: User, refreshToken: string): Promise<void> {
    // const user = await this.findUserByRefreshToken(refreshToken);

    if (!user) {
      let auth: Auth;

      // eslint-disable-next-line prefer-const
      auth = this.authRepository.create({ user });
      auth.refreshToken = refreshToken;
      await this.authRepository.save(auth);
    }

    user.auth.refreshToken = refreshToken;
    await this.authRepository.save(user.auth);
  }

  async leaveUser(userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepository.findOne({
        where: { kakaoMemberId: userId },
        relations: ['profile', 'instructor', 'member'],
      });

      if (!user) {
        throw new NotFoundException(ErrorCodes.ERR_11);
      }

      await queryRunner.manager.remove(user);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findUserByKakaoMemberId(kakaoMemberId: number): Promise<User> {
    try {
      return await this.userRepository.findOne({
        where: { kakaoMemberId },
        relations: ['auth', 'studio'],
      });
    } catch {
      // throw new NotFoundException(ErrorCodes.ERR_11);
    }
  }

  decodeAccessToken(token: string): {
    userId: string;
    email: string;
    name: string;
  } {
    try {
      const decoded = this.jwtService.decode(token);

      const { userId, email, name } = decoded;

      return { userId, email, name };
    } catch {
      throw new UnauthorizedException(ErrorCodes.ERR_01);
    }
  }

  async findUserByRefreshToken(refreshToken: string): Promise<User> {
    try {
      const payload = this.jwtService.decode(refreshToken);

      const user = await this.userRepository.findOne({
        where: { kakaoMemberId: +payload.sub },
        relations: ['instructor', 'member', 'studio', 'profile', 'auth'],
      });

      return user;
    } catch {
      // throw new UnauthorizedException(ErrorCodes.ERR_01);
    }
  }

  private async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { kakaoMemberId: userId },
        relations: ['auth'],
      });

      await this.authRepository.update(user.auth.id, { refreshToken });
    } catch {
      throw new UnauthorizedException(ErrorCodes.ERR_03);
    }
  }

  private async isMainInstructor(user: User): Promise<boolean> {
    // 강사 일때만 사용 가능
    if (user.role !== UserRole.INSTRUCTOR) {
      throw new UnauthorizedException(ErrorCodes.ERR_12);
    }

    if (user.instructor.isMainInstructor) {
      return true;
    }
    return false;
  }

  private async verifyToken(token: string): Promise<{
    isExpired: boolean;
  }> {
    try {
      const payload = this.jwtService.decode(token);

      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      const isExpired = expirationDate.getTime() <= now.getTime();

      return { isExpired };
    } catch {
      return { isExpired: false };
      // throw new UnauthorizedException(ErrorCodes.ERR_01);
    }
  }
}
