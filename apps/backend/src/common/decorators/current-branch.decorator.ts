import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentBranch = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.query?.branchId ||
      request.body?.branchId ||
      request.params?.branchId ||
      request.user?.branchId
    );
  },
);
