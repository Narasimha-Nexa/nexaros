import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { CompleteOnboardingDto, StartOnboardingDto, UpdateRestaurantDto, UpdateOwnerDto, UpdateSettingsDto, SelectPlanDto } from './dto';

@ApiTags('Onboarding')
@Controller('public/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new onboarding session' })
  async start(@Body() dto: StartOnboardingDto) {
    return this.onboardingService.start(dto);
  }

  @Get(':token')
  @ApiOperation({ summary: 'Get onboarding session status' })
  async getStatus(@Param('token') token: string) {
    return this.onboardingService.getStatus(token);
  }

  @Post(':token/restaurant')
  @ApiOperation({ summary: 'Update restaurant details in onboarding session' })
  async updateRestaurant(@Param('token') token: string, @Body() dto: UpdateRestaurantDto) {
    return this.onboardingService.updateRestaurant(token, dto);
  }

  @Post(':token/owner')
  @ApiOperation({ summary: 'Update owner details in onboarding session' })
  async updateOwner(@Param('token') token: string, @Body() dto: UpdateOwnerDto) {
    return this.onboardingService.updateOwner(token, dto);
  }

  @Post(':token/settings')
  @ApiOperation({ summary: 'Update initial settings in onboarding session' })
  async updateSettings(@Param('token') token: string, @Body() dto: UpdateSettingsDto) {
    return this.onboardingService.updateSettings(token, dto);
  }

  @Post(':token/plan')
  @ApiOperation({ summary: 'Select a plan in onboarding session' })
  async selectPlan(@Param('token') token: string, @Body() dto: SelectPlanDto) {
    return this.onboardingService.selectPlan(token, dto);
  }

  @Post(':token/payment/order')
  @ApiOperation({ summary: 'Create a payment order for the selected plan' })
  async createPaymentOrder(@Param('token') token: string, @Query('coupon') couponCode?: string) {
    return this.onboardingService.createPaymentOrder(token, couponCode);
  }

  @Post(':token/payment/verify')
  @ApiOperation({ summary: 'Verify payment and update onboarding session' })
  async verifyPayment(
    @Param('token') token: string,
    @Body() body: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) {
    return this.onboardingService.verifyPayment(token, body);
  }

  @Post(':token/complete')
  @ApiOperation({ summary: 'Complete onboarding and provision the restaurant atomically' })
  async complete(@Param('token') token: string, @Body() dto: CompleteOnboardingDto) {
    return this.onboardingService.complete(token, dto);
  }

  @Post(':token/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel onboarding session' })
  async cancel(@Param('token') token: string) {
    return this.onboardingService.cancel(token);
  }
}
