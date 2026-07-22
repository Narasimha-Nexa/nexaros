import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { requestContext } from '../../../prisma/prisma.service';

export const CurrentBranch = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const store = requestContext.getStore();
    return store?.branchId;
  },
);
