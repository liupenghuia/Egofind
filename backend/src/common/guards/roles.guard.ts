import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayloadUser } from '../decorators/current-user.decorator';
import { ErrorCode } from '../constants/error-codes';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayloadUser }>();
    const user = request.user;
    if (!user?.roles?.length) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Forbidden',
      });
    }

    const ok = requiredRoles.some((role) => user.roles.includes(role));
    if (!ok) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Insufficient role',
      });
    }
    return true;
  }
}
