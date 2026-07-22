import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { requestContext } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = jwt.verify(token, secret) as any;

        requestContext.run(
          {
            userId: payload.sub,
            tenantId: payload.tenantId,
            branchId: payload.branchId,
          },
          () => next(),
        );
        return;
      } catch {
        // Invalid token — proceed without context
      }
    }

    requestContext.run({}, () => next());
  }
}
