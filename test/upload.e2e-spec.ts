import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { HEADER_TOKEN } from 'src/jwt/jwt.constants';
import * as request from 'supertest';
import { customerE2E } from './shared/data-e2e';
import * as AWS from 'aws-sdk';
import {
  clearDB,
  createUserAndGetToken,
  getMockedMailService,
} from './shared/utils-e2e';
import { MailService } from 'src/mail/mail.service';

const IMAGE_URL = 'IMAGE_URL';

jest.mock('aws-sdk');
(AWS.S3.prototype.upload as jest.Mock).mockReturnValue({
  promise: jest.fn(() => ({
    Location: IMAGE_URL,
  })),
});

describe('Upload Module (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(getMockedMailService())
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await clearDB(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('uploadImage', () => {
    it('should return an image url', async () => {
      const token = await createUserAndGetToken(app, customerE2E);

      return request(app.getHttpServer())
        .post('/upload')
        .set('Content-Type', 'multipart/form-data')
        .set(HEADER_TOKEN, token)
        .attach('image', `${__dirname}/shared/image-e2e.jpg`)
        .expect(201)
        .expect(res => {
          expect(res.body.ok).toEqual(true);
          expect(res.body.result).toEqual(IMAGE_URL);
          expect(res.body.error).toEqual(undefined);
        });
    });
  });
});
