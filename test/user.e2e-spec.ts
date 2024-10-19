import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Repository } from 'typeorm';
import { Verification } from 'src/user/entities/verification.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GRAPHQL_ENDPOINT } from './shared/constants-e2e';
import {
  adminE2E,
  categoryE2E,
  customerE2E,
  ownerE2E,
  promotionE2E,
  restaurantE2E,
} from './shared/data-e2e';
import {
  clearDB,
  createCategory,
  createPromotion,
  createRestaurant,
  createUserAndGetToken,
  getMockedMailService,
  gqlTest,
} from './shared/utils-e2e';
import { User } from 'src/user/entities/user.entity';
import { MailService } from 'src/mail/mail.service';
import { HEADER_TOKEN } from 'src/auth/auth.constants';

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let verificationsRepo: Repository<Verification>;
  let usersRepo: Repository<User>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(getMockedMailService())
      .compile();

    app = module.createNestApplication();
    verificationsRepo = module.get(getRepositoryToken(Verification));
    usersRepo = module.get(getRepositoryToken(User));
    await app.init();
  });

  beforeEach(async () => {
    await clearDB(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('user', () => {
    describe('createUser', () => {
      it('should create an admin', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              createUser(input:{
                email: "${adminE2E.email}",
                password: "${adminE2E.password}",
                role: ${adminE2E.role},
              }) {
                ok
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.createUser.ok).toEqual(true);
            expect(res.body.data.createUser.error).toEqual(null);
          });
      });

      it('should return an error if admin exists', async () => {
        await createUserAndGetToken(app, adminE2E);

        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              createUser(input:{
                email: "${adminE2E.email}",
                password: "${adminE2E.password}",
                role: ${adminE2E.role},
              }) {
                ok
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.createUser.ok).toEqual(false);
            expect(res.body.data.createUser.error).toEqual(
              'Admin already exists.',
            );
          });
      });

      it('should create a user', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              createUser(input:{
                email: "${customerE2E.email}",
                password: "${customerE2E.password}",
                role: ${customerE2E.role},
              }) {
                ok
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.createUser.ok).toEqual(true);
            expect(res.body.data.createUser.error).toEqual(null);
          });
      });

      it('should return an error if email exists', async () => {
        await createUserAndGetToken(app, customerE2E);

        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              createUser(input:{
                email: "${customerE2E.email}",
                password: "${customerE2E.password}",
                role: ${customerE2E.role},
              }) {
                ok
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.createUser.ok).toEqual(false);
            expect(res.body.data.createUser.error).toEqual(
              'Email already exists.',
            );
          });
      });
    });

    describe('login', () => {
      it('should return an error if email not found', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              login(input:{
                email:"invalid@email.com",
                password:"${customerE2E.password}"
              }) {
                ok
                token
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.login.ok).toEqual(false);
            expect(res.body.data.login.token).toEqual(null);
            expect(res.body.data.login.error).toEqual('User not found.');
          });
      });

      it('should return an error if password is invalid', async () => {
        await createUserAndGetToken(app, customerE2E);

        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              login(input:{
                email:"${customerE2E.email}",
                password:"invalid.password"
              }) {
                ok
                token
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.login.ok).toEqual(false);
            expect(res.body.data.login.token).toEqual(null);
            expect(res.body.data.login.error).toEqual('Invalid password.');
          });
      });

      it('should return a token', async () => {
        await createUserAndGetToken(app, customerE2E);

        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              login(input:{
                email:"${customerE2E.email}",
                password:"${customerE2E.password}"
              }) {
                ok
                token
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.login.ok).toEqual(true);
            expect(res.body.data.login.token).toEqual(expect.any(String));
            expect(res.body.data.login.error).toEqual(null);
          });
      });
    });

    describe('seeMe', () => {
      it('should return an error if token is not provided', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            {
              seeMe {
                ok
                error
                result {
                  email
                }
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return a user', async () => {
        const token = await createUserAndGetToken(app, customerE2E);

        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
            {
              seeMe {
                ok
                error
                result {
                  email
                }
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeMe.ok).toEqual(true);
            expect(res.body.data.seeMe.error).toEqual(null);
            expect(res.body.data.seeMe.result.email).toEqual(customerE2E.email);
          });
      });
    });

    describe('verifyEmail', () => {
      it('should return an error if token is not provided', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
          mutation {
            verifyEmail(input:{
              code:"code"
            }){
              ok
              error
            }
          }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return an error if code is invalid', async () => {
        const token = await createUserAndGetToken(app, customerE2E);

        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
        mutation {
          verifyEmail(input:{
            code:"invalid.code"
          }){
            ok
            error
          }
        }
        `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.verifyEmail.ok).toEqual(false);
            expect(res.body.data.verifyEmail.error).toEqual(
              'Invalid verification code',
            );
          });
      });

      it('should verify an email', async () => {
        const token = await createUserAndGetToken(app, customerE2E);
        const [verification] = await verificationsRepo.find();

        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
        mutation {
          verifyEmail(input:{
            code:"${verification.code}"
          }){
            ok
            error
          }
        }
        `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.verifyEmail.ok).toEqual(true);
            expect(res.body.data.verifyEmail.error).toEqual(null);
          });
      });
    });

    describe('editUser', () => {
      let token: string;
      beforeEach(async () => {
        token = await createUserAndGetToken(app, customerE2E);
      });

      it('should return an error if token is not provided', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              editUser(input:{
                email:"new@email.com",
                password:"new.password"
              }){
                ok
                error
              }
            }
            `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return an error if email exists', async () => {
        await createUserAndGetToken(app, {
          ...customerE2E,
          email: 'email2@mail.com',
        });

        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
            mutation {
              editUser(input:{
                email:"email2@mail.com",
              }){
                ok
                error
              }
            }
            `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.editUser.ok).toEqual(false);
            expect(res.body.data.editUser.error).toEqual(
              'Email already exists.',
            );
          });
      });

      it('should edit a user', async () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
            mutation {
              editUser(input:{
                email:"new@email.com",
                password:"new.password"
              }){
                ok
                error
              }
            }
            `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.editUser.ok).toEqual(true);
            expect(res.body.data.editUser.error).toEqual(null);
          });
      });
    });

    describe('deleteUser', () => {
      let token: string;
      beforeEach(async () => {
        token = await createUserAndGetToken(app, customerE2E);
      });

      it('should return an error if token is not provided', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              deleteUser{
                ok
                error
              }
            }
            `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should delete a user', async () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
            mutation {
              deleteUser{
                ok
                error
              }
            }
            `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteUser.ok).toEqual(true);
            expect(res.body.data.deleteUser.error).toEqual(null);
          });
      });
    });
  });

  describe('promotion', () => {
    describe('createPromotion', () => {
      it('should return error if role is not owner', async () => {
        const customerToken = await createUserAndGetToken(app, customerE2E);

        return gqlTest(
          app,
          `
        mutation {
          createPromotion(input:{
            transactionId:${promotionE2E.transactionId}
          }) {
            ok
            error
          }
        }
        `,
          customerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return error if restaurant not exists', async () => {
        const ownerToken = await createUserAndGetToken(app, ownerE2E);

        return gqlTest(
          app,
          `
        mutation {
          createPromotion(input:{
            transactionId:${promotionE2E.transactionId}
          }) {
            ok
            error
          }
        }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createPromotion.ok).toEqual(false);
            expect(res.body.data.createPromotion.error).toEqual(
              'Restaurant not exists.',
            );
          });
      });

      it('should create promotion', async () => {
        await createCategory(app, {
          name: categoryE2E.name,
          imageUrl: categoryE2E.imageUrl,
        });
        const ownerToken = await createUserAndGetToken(app, ownerE2E);
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(
          app,
          {
            name: restaurantE2E.name,
            categorySlug: categoryE2E.slug,
          },
          owner,
        );

        return gqlTest(
          app,
          `
        mutation {
          createPromotion(input:{
            transactionId:${promotionE2E.transactionId}
          }) {
            ok
            error
          }
        }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createPromotion.ok).toEqual(true);
            expect(res.body.data.createPromotion.error).toEqual(null);
          });
      });
    });

    describe('seePromotions', () => {
      it('should return error if role is not owner', async () => {
        const customerToken = await createUserAndGetToken(app, customerE2E);

        return gqlTest(
          app,
          `
        {
          seePromotions {
            ok
            error
            result {
              transactionId
            }
          }
        }
        `,
          customerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return promotions', async () => {
        const ownerToken = await createUserAndGetToken(app, ownerE2E);
        await createCategory(app, {
          name: categoryE2E.name,
          imageUrl: categoryE2E.imageUrl,
        });
        let owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(
          app,
          {
            name: restaurantE2E.name,
            categorySlug: categoryE2E.slug,
          },
          owner,
        );
        owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createPromotion(app, promotionE2E, owner);

        return gqlTest(
          app,
          `
        {
          seePromotions {
            ok
            error
            result {
              transactionId
            }
          }
        }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seePromotions.ok).toEqual(true);
            expect(res.body.data.seePromotions.error).toEqual(null);
            expect(res.body.data.seePromotions.result).toEqual(
              expect.arrayContaining([
                { transactionId: promotionE2E.transactionId },
              ]),
            );
          });
      });
    });
  });
});
