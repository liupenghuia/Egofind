import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtPayloadUser = {
  id: string;
  roles: string[];
  permissions?: string[];
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayloadUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayloadUser }>();
    return request.user;
  },
);
