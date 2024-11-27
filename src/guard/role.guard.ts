import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { MAIN_INSTRUCTOR_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isMainInstructorRequired = this.reflector.getAllAndOverride<boolean>(
      MAIN_INSTRUCTOR_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isMainInstructorRequired) {
      return true; // 메인 강사 체크가 필요 없는 경우 통과
    }

    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers['authorization']?.split(' ')[1];

    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing');
    }

    const { userId } = this.authService.decodeAccessToken(accessToken);
    const isMainInstructor = await this.userService.findMainInstructor(+userId);

    if (!isMainInstructor) {
      throw new ForbiddenException({
        errorCode: 'ERR001',
        message: 'Only main instructors are allowed to access this resource',
      });
    }

    return true;
  }
}
