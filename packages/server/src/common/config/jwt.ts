import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET || process.env.APP_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required (APP_JWT_SECRET is accepted as a compatibility alias).');
  }
  return { secret };
});
