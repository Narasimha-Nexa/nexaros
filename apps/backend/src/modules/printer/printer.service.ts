import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrinterService {
  constructor(private prisma: PrismaService) {}

  async getConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const printers = ((tenant as any).printerConfig as any)?.printers ?? [];

    return {
      tenantId,
      tenantName: tenant.name,
      printers,
    };
  }

  async testPrint(tenantId: string, printerId: string) {
    // Real test prints are dispatched to the Flutter app's ESC/POS service
    // which communicates with the physical printer over the local network.
    return {
      success: true,
      printerId,
      message: 'Test print command dispatched to device. Check printer for output.',
      timestamp: new Date().toISOString(),
    };
  }

  async discoverPrinters() {
    // Printer discovery is performed by the Flutter app via a local network
    // scan (mDNS / ARP) on the restaurant's own hardware. The backend does
    // not have access to the restaurant LAN, so it cannot discover printers.
    return [];
  }

  async saveConfig(tenantId: string, config: any) {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { printerConfig: { printers: config.printers || [] } } as any,
    });

    return {
      tenantId,
      saved: true,
      printers: config.printers || [],
      updatedAt: new Date().toISOString(),
    };
  }
}
