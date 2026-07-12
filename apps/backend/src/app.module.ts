import { Module } from '@nestjs/common';
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
  ],
  controllers: [HealthController],
})
export class AppModule {}
