import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BranchesModule } from './modules/branches/branches.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TablesModule } from './modules/tables/tables.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { SyncModule } from './modules/sync/sync.module';
import { WebsocketsModule } from './modules/websockets/websockets.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { StaffModule } from './modules/staff/staff.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { PlansModule } from './modules/plans/plans.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrinterModule } from './modules/printer/printer.module';
import { AiModule } from './modules/ai/ai.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { PublicModule } from './modules/public/public.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { LoginRateLimitMiddleware } from './common/middleware/login-rate-limit.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { PublicRateLimitMiddleware } from './common/middleware/public-rate-limit.middleware';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    BranchesModule,
    UsersModule,
    RolesModule,
    MenuModule,
    OrdersModule,
    TablesModule,
    InventoryModule,
    PaymentsModule,
    InvoicesModule,
    SyncModule,
    WebsocketsModule,
    KitchenModule,
    StaffModule,
    SuppliersModule,
    PurchasesModule,
    PlansModule,
    SubscriptionsModule,
    ReportsModule,
    NotificationsModule,
    PrinterModule,
    AiModule,
    ReservationsModule,
    PublicModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('*');

    consumer
      .apply(PublicRateLimitMiddleware)
      .forRoutes('api/public');

    consumer
      .apply(LoginRateLimitMiddleware)
      .forRoutes('/api/auth/login');

    consumer
      .apply(CsrfMiddleware)
      .forRoutes('*');
  }
}
