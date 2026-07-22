import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  userId?: string;
  tenantId?: string;
  branchId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();

    const self = this;

    this.$extends({
      client: {},
      query: {
        $allModels: {
          async $allOperations({ operation, args, query }: any) {
            const ctx = requestContext.getStore();

            if (ctx?.userId) {
              if (operation === 'create' && args.data) {
                args.data.createdBy = args.data.createdBy || ctx.userId;
              }
              if (operation === 'createMany' && args.data && Array.isArray(args.data)) {
                args.data = args.data.map((d: any) => ({
                  ...d,
                  createdBy: d.createdBy || ctx.userId,
                }));
              }
              if (operation === 'update' && args.data) {
                args.data.updatedBy = args.data.updatedBy || ctx.userId;
              }
              if (operation === 'upsert' && args) {
                args.create = {
                  ...args.create,
                  createdBy: (args.create as any).createdBy || ctx.userId,
                };
                args.update = {
                  ...args.update,
                  updatedBy: (args.update as any).updatedBy || ctx.userId,
                };
              }
            }

            return query(args);
          },
        },
      },
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
