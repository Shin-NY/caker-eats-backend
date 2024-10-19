import { Test } from '@nestjs/testing';
import { HashService } from './hash.service';
import * as bcrypt from 'bcrypt';
import { HASH_ROUNDS } from './user.service';

const data = 'data';
const hashedData = bcrypt.hashSync(data, HASH_ROUNDS);

describe('HashService', () => {
  let hashService: HashService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [HashService],
    }).compile();
    hashService = module.get(HashService);
  });

  it('should be defined', () => {
    expect(hashService).toBeDefined();
  });

  describe('hash', () => {
    it('should hash data', async () => {
      const res = await hashService.hash(data);
      expect(res).toEqual(expect.any(String));
    });
  });

  describe('compare', () => {
    it('should return true if data is valid', async () => {
      const res = await hashService.compare(data, hashedData);
      expect(res).toEqual(true);
    });

    it('should return false if data is invalid', async () => {
      const res = await hashService.compare('invalid data', hashedData);
      expect(res).toEqual(false);
    });
  });
});
