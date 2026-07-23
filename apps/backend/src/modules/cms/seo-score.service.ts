import { Injectable } from '@nestjs/common';
import { TenantWebsiteConfig } from '@prisma/client';

export interface SeoCheck {
  name: string;
  passed: boolean;
  message: string;
  weight: number;
}

export interface SeoScoreResult {
  score: number;
  checks: SeoCheck[];
  passedCount: number;
  totalCount: number;
}

@Injectable()
export class SeoScoreService {
  calculateSeoScore(config: TenantWebsiteConfig): SeoScoreResult {
    const checks: SeoCheck[] = [
      this.checkMetaTitle(config),
      this.checkMetaDescription(config),
      this.checkOgImage(config),
      this.checkFavicon(config),
      this.checkLogo(config),
      this.checkPhone(config),
      this.checkAddress(config),
      this.checkSocialLinks(config),
      this.checkOpeningHours(config),
      this.checkHomeSections(config),
    ];

    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
    const passedWeight = checks.filter(c => c.passed).reduce((sum, c) => sum + c.weight, 0);
    const score = Math.round((passedWeight / totalWeight) * 100);

    return {
      score,
      checks,
      passedCount: checks.filter(c => c.passed).length,
      totalCount: checks.length,
    };
  }

  private checkMetaTitle(config: TenantWebsiteConfig): SeoCheck {
    const seo = (config.seo as Record<string, any>) || {};
    const title = seo.title || config.restaurantName || '';
    const length = title.length;
    const passed = length >= 30 && length <= 60;
    return {
      name: 'Meta Title',
      passed,
      message: passed
        ? `Meta title is ${length} characters (optimal 30-60)`
        : length === 0
        ? 'Meta title is missing'
        : `Meta title is ${length} characters (should be 30-60)`,
      weight: 15,
    };
  }

  private checkMetaDescription(config: TenantWebsiteConfig): SeoCheck {
    const seo = (config.seo as Record<string, any>) || {};
    const desc = seo.description || '';
    const length = desc.length;
    const passed = length >= 120 && length <= 160;
    return {
      name: 'Meta Description',
      passed,
      message: passed
        ? `Meta description is ${length} characters (optimal 120-160)`
        : length === 0
        ? 'Meta description is missing'
        : `Meta description is ${length} characters (should be 120-160)`,
      weight: 15,
    };
  }

  private checkOgImage(config: TenantWebsiteConfig): SeoCheck {
    const seo = (config.seo as Record<string, any>) || {};
    const ogImage = seo.ogImage || '';
    const passed = !!ogImage;
    return {
      name: 'Open Graph Image',
      passed,
      message: passed
        ? 'OG image is set'
        : 'OG image is missing (social shares will not show an image)',
      weight: 10,
    };
  }

  private checkFavicon(config: TenantWebsiteConfig): SeoCheck {
    const favicon = config.favicon || '';
    const passed = !!favicon;
    return {
      name: 'Favicon',
      passed,
      message: passed
        ? 'Favicon is set'
        : 'Favicon is missing (browser tab will show default)',
      weight: 5,
    };
  }

  private checkLogo(config: TenantWebsiteConfig): SeoCheck {
    const logo = config.logo || '';
    const passed = !!logo;
    return {
      name: 'Logo',
      passed,
      message: passed
        ? 'Logo is set'
        : 'Logo is missing (brand identity incomplete)',
      weight: 5,
    };
  }

  private checkPhone(config: TenantWebsiteConfig): SeoCheck {
    const phone = config.phone || '';
    const passed = !!phone;
    return {
      name: 'Phone Number',
      passed,
      message: passed
        ? 'Phone number is set'
        : 'Phone number is missing (customers cannot call)',
      weight: 10,
    };
  }

  private checkAddress(config: TenantWebsiteConfig): SeoCheck {
    const address = config.address || '';
    const passed = !!address;
    return {
      name: 'Address',
      passed,
      message: passed
        ? 'Address is set'
        : 'Address is missing (local SEO impact)',
      weight: 10,
    };
  }

  private checkSocialLinks(config: TenantWebsiteConfig): SeoCheck {
    const social = (config.socialLinks as Record<string, any>) || {};
    const activePlatforms = Object.values(social).filter(v => v && String(v).trim() !== '').length;
    const passed = activePlatforms >= 2;
    return {
      name: 'Social Links',
      passed,
      message: passed
        ? `${activePlatforms} social platforms configured`
        : `${activePlatforms}/2 social platforms configured (need at least 2)`,
      weight: 10,
    };
  }

  private checkOpeningHours(config: TenantWebsiteConfig): SeoCheck {
    const hours = (config.openingHours as Record<string, any>) || {};
    const hasHours = Object.keys(hours).length > 0;
    const passed = hasHours;
    return {
      name: 'Opening Hours',
      passed,
      message: passed
        ? 'Opening hours are configured'
        : 'Opening hours not set (local business schema incomplete)',
      weight: 10,
    };
  }

  private checkHomeSections(config: TenantWebsiteConfig): SeoCheck {
    const sections = (config.homeSections as any[]) || [];
    const enabledSections = sections.filter(s => s.enabled).length;
    const passed = enabledSections >= 3;
    return {
      name: 'Home Sections',
      passed,
      message: passed
        ? `${enabledSections} homepage sections enabled`
        : `${enabledSections}/3 homepage sections enabled (need at least 3 for good content depth)`,
      weight: 10,
    };
  }
}