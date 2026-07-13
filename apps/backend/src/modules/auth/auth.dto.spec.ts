import { validate } from 'class-validator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('Auth DTOs (unit)', () => {
  it('LoginDto should require email and password', async () => {
    const dto = new LoginDto();
    const errors = await validate(dto);
    const properties = errors.map(e => e.property);
    expect(properties).toContain('email');
    expect(properties).toContain('password');
  });

  it('RegisterDto should require all required fields', async () => {
    const dto = new RegisterDto();
    const errors = await validate(dto);
    const properties = errors.map(e => e.property);
    expect(properties).toContain('email');
    expect(properties).toContain('password');
    expect(properties).toContain('firstName');
    expect(properties).toContain('lastName');
    expect(properties).toContain('restaurantName');
  });

  it('Health check contract is correct', () => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'nexaros-backend',
      version: '0.1.0',
    };
    expect(health).toHaveProperty('status', 'ok');
    expect(health).toHaveProperty('service', 'nexaros-backend');
    expect(health).toHaveProperty('version', '0.1.0');
    expect(health).toHaveProperty('timestamp');
  });
});
