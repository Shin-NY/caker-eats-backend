import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

const JWT_KEY = 'JWT_KEY';

const getMockedConfigService = () => ({
  get: jest.fn(() => JWT_KEY),
});

describe('JwtService', () => {
  const payload = { userId: 1 };
  const token = jwt.sign(payload, JWT_KEY);
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: ConfigService, useValue: getMockedConfigService() },
      ],
    }).compile();
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(jwtService).toBeDefined();
  });

  describe('sign', () => {
    it('should return a token', () => {
      const spySign = jest.spyOn(jwt, 'sign');
      const result = jwtService.sign(payload);
      expect(spySign).toBeCalledTimes(1);
      expect(spySign).toBeCalledWith(payload, JWT_KEY);
      expect(result).toEqual(token);
    });
  });

  describe('verify', () => {
    it('should return true if token is valid', () => {
      const spySign = jest.spyOn(jwt, 'verify');
      const result = jwtService.verify({ token });
      expect(spySign).toBeCalledTimes(1);
      expect(spySign).toBeCalledWith(token, JWT_KEY);
      expect(result.ok).toEqual(true);
      expect(result.result).toMatchObject(payload);
    });

    it('should return false if token is invalid', () => {
      const result = jwtService.verify({ token: 'invalid-token' });
      expect(result.ok).toEqual(false);
      expect(result.error).toEqual(expect.any(String));
    });
  });
});
