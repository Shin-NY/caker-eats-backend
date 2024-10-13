import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import {
  adminE2E,
  categoryE2E,
  customerE2E,
  dishE2E,
  editedDishE2E,
  editedRestaurantE2E,
  owner2E2E,
  ownerE2E,
  restaurant2E2E,
  restaurantE2E,
} from './shared/data-e2e';
import {
  clearDB,
  createCategory,
  createDish,
  createRestaurant,
  createUserAndGetToken,
  getMockedMailService,
  gqlTest,
} from './shared/utils-e2e';
import { MailService } from 'src/mail/mail.service';

describe('Restaurant Module (e2e)', () => {
  let app: INestApplication;
  let usersRepo: Repository<User>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(getMockedMailService())
      .compile();

    app = module.createNestApplication();
    usersRepo = module.get(getRepositoryToken(User));

    await app.init();
  });

  beforeEach(async () => {
    await clearDB(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('category', () => {
    describe('createCategory', () => {
      it('should return an error if not admin', async () => {
        const customerToken = await createUserAndGetToken(app, customerE2E);

        return gqlTest(
          app,
          `
        mutation {
          createCategory(input:{
            name:"${categoryE2E.name}",
            imageUrl:"${categoryE2E.imageUrl}"
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

      it('should create category', async () => {
        const adminToken = await createUserAndGetToken(app, adminE2E);

        return gqlTest(
          app,
          `
        mutation {
          createCategory(input:{
            name:"${categoryE2E.name}",
            imageUrl:"${categoryE2E.imageUrl}"
          }) {
            ok
            error
          }
        }
    `,
          adminToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createCategory.ok).toEqual(true);
            expect(res.body.data.createCategory.error).toEqual(null);
          });
      });

      it('should return an error if slug already exists', async () => {
        const adminToken = await createUserAndGetToken(app, adminE2E);
        await createCategory(app, categoryE2E);

        return gqlTest(
          app,
          `
        mutation {
          createCategory(input:{
            name:"${categoryE2E.name}",
            imageUrl:"${categoryE2E.imageUrl}"
          }) {
            ok
            error
          }
        }
    `,
          adminToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createCategory.ok).toEqual(false);
            expect(res.body.data.createCategory.error).toEqual(
              'Category slug already exists.',
            );
          });
      });
    });

    describe('seeCategories', () => {
      it('should return categories', async () => {
        await createCategory(app, categoryE2E);

        return gqlTest(
          app,
          `
          {
            seeCategories {
              ok
              result {
                name
              }
              error
            }
          }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeCategories.ok).toEqual(true);
            expect(res.body.data.seeCategories.result).toEqual([
              { name: categoryE2E.name },
            ]);
            expect(res.body.data.seeCategories.error).toEqual(null);
          });
      });
    });

    describe('seeCategory', () => {
      it('should return an error if slug not found', () => {
        return gqlTest(
          app,
          `
          {
            seeCategory(input:{
              slug:"invalid-slug"
            }) {
              ok
              result {
                name
              }
              error
            }
          }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeCategory.ok).toEqual(false);
            expect(res.body.data.seeCategory.result).toEqual(null);
            expect(res.body.data.seeCategory.error).toEqual(
              'Category not found.',
            );
          });
      });

      it('should return category', async () => {
        await createCategory(app, categoryE2E);

        return gqlTest(
          app,
          `
          {
            seeCategory(input:{
              slug:"${categoryE2E.slug}"
            }) {
              ok
              result {
                name
              }
              error
            }
          }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeCategory.ok).toEqual(true);
            expect(res.body.data.seeCategory.result).toEqual({
              name: categoryE2E.name,
            });
            expect(res.body.data.seeCategory.error).toEqual(null);
          });
      });
    });

    describe('deleteCategory', () => {
      it('should return an error if not admin', async () => {
        const customerToken = await createUserAndGetToken(app, customerE2E);

        return gqlTest(
          app,
          `
          mutation {
            deleteCategory(input:{
              slug:"${categoryE2E.slug}"
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

      it('should delete category', async () => {
        const token = await createUserAndGetToken(app, adminE2E);
        await createCategory(app, categoryE2E);

        return gqlTest(
          app,
          `
          mutation {
            deleteCategory(input:{
              slug:"${categoryE2E.slug}"
            }) {
              ok
              error
            }
          }
      `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteCategory.ok).toEqual(true);
            expect(res.body.data.deleteCategory.error).toEqual(null);
          });
      });
    });
  });

  describe('restaurant', () => {
    describe('createRestaurant', () => {
      it('should return an error if role is not owner', async () => {
        const token = await createUserAndGetToken(app, customerE2E);

        return gqlTest(
          app,
          `
        mutation {
          createRestaurant(input:{
            name:"${restaurantE2E.name}",
            categorySlug:"${restaurantE2E.categorySlug}"
          }) {
            ok
            error
          }
        }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return error if category not exists', async () => {
        const token = await createUserAndGetToken(app, ownerE2E);

        return gqlTest(
          app,
          `
        mutation {
          createRestaurant(input:{
            name:"${restaurantE2E.name}",
            categorySlug:"invalid-category-slug"
          }) {
            ok
            error
          }
        }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createRestaurant.ok).toEqual(false);
            expect(res.body.data.createRestaurant.error).toEqual(
              'Category does not exists.',
            );
          });
      });

      it('should create restaurant', async () => {
        await createCategory(app, categoryE2E);
        const token = await createUserAndGetToken(app, ownerE2E);

        return gqlTest(
          app,
          `
        mutation {
          createRestaurant(input:{
            name:"${restaurantE2E.name}",
            categorySlug:"${restaurantE2E.categorySlug}"
          }) {
            ok
            error
          }
        }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createRestaurant.ok).toEqual(true);
            expect(res.body.data.createRestaurant.error).toEqual(null);
          });
      });

      it('should return error if owner already has restaurant', async () => {
        await createCategory(app, categoryE2E);
        const token = await createUserAndGetToken(app, ownerE2E);
        const [owner] = await usersRepo.find();
        await createRestaurant(app, restaurantE2E, owner);

        return gqlTest(
          app,
          `
        mutation {
          createRestaurant(input:{
            name:"${restaurantE2E.name}",
            categorySlug:"${restaurantE2E.categorySlug}"
          }) {
            ok
            error
          }
        }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createRestaurant.ok).toEqual(false);
            expect(res.body.data.createRestaurant.error).toEqual(
              'Restaurant already exists.',
            );
          });
      });

      it('should return error if restaurant name already exists', async () => {
        await createCategory(app, categoryE2E);
        await createUserAndGetToken(app, ownerE2E);
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(app, restaurantE2E, owner);

        const token = await createUserAndGetToken(app, owner2E2E);

        return gqlTest(
          app,
          `
        mutation {
          createRestaurant(input:{
            name:"${restaurantE2E.name}",
            categorySlug:"${restaurantE2E.categorySlug}"
          }) {
            ok
            error
          }
        }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createRestaurant.ok).toEqual(false);
            expect(res.body.data.createRestaurant.error).toEqual(
              'Restaurant name already exists.',
            );
          });
      });
    });

    describe('seeRestaurants', () => {
      it('should return restaurants', async () => {
        await createCategory(app, categoryE2E);
        await createUserAndGetToken(app, ownerE2E);
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(app, restaurantE2E, owner);

        return gqlTest(
          app,
          `
        {
          seeRestaurants(input:{
            page:1
          }) {
            ok
            error
            result {
              id
              name
            }
          }
        }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeRestaurants.ok).toEqual(true);
            expect(res.body.data.seeRestaurants.error).toEqual(null);
            expect(res.body.data.seeRestaurants.result).toEqual(
              expect.arrayContaining([
                { id: expect.any(Number), name: restaurantE2E.name },
              ]),
            );
          });
      });
    });

    describe('seeRestaurant', () => {
      it('should return error if restaurant not found', () => {
        return gqlTest(
          app,
          `
        {
          seeRestaurant(input:{
            restaurantId:999
          }) {
            ok
            error
            result {
              id
              name
            }
          }
        }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeRestaurant.ok).toEqual(false);
            expect(res.body.data.seeRestaurant.error).toEqual(
              'Restaurant not found.',
            );
            expect(res.body.data.seeRestaurant.result).toEqual(null);
          });
      });

      it('should return restaurant', async () => {
        await createCategory(app, categoryE2E);
        await createUserAndGetToken(app, ownerE2E);
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        const restaurantId = await createRestaurant(app, restaurantE2E, owner);

        return gqlTest(
          app,
          `
        {
          seeRestaurant(input:{
            restaurantId:${restaurantId}
          }) {
            ok
            error
            result {
              id
              name
            }
          }
        }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeRestaurant.ok).toEqual(true);
            expect(res.body.data.seeRestaurant.error).toEqual(null);
            expect(res.body.data.seeRestaurant.result).toEqual({
              id: restaurantId,
              name: restaurantE2E.name,
            });
          });
      });
    });

    describe('editRestaurant', () => {
      let ownerToken: string;
      beforeEach(async () => {
        await createCategory(app, categoryE2E);
        ownerToken = await createUserAndGetToken(app, ownerE2E);
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(app, restaurantE2E, owner);
      });

      it('should return an error if role is not owner', async () => {
        const token = await createUserAndGetToken(app, customerE2E);

        return gqlTest(
          app,
          `
          mutation {
            editRestaurant(input:{
              name:"${editedRestaurantE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return error if restaurant not exists', async () => {
        const token = await createUserAndGetToken(app, owner2E2E);

        return gqlTest(
          app,
          `
          mutation {
            editRestaurant(input:{
              name:"${editedRestaurantE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editRestaurant.ok).toEqual(false);
            expect(res.body.data.editRestaurant.error).toEqual(
              'Restaurant not exists.',
            );
          });
      });

      it('should return error if restaurant name already exists', async () => {
        const newOwnertoken = await createUserAndGetToken(app, owner2E2E);
        const newOwner = await usersRepo.findOneBy({ email: owner2E2E.email });
        await createRestaurant(app, restaurant2E2E, newOwner);

        return gqlTest(
          app,
          `
          mutation {
            editRestaurant(input:{
              name:"${restaurantE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          newOwnertoken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editRestaurant.ok).toEqual(false);
            expect(res.body.data.editRestaurant.error).toEqual(
              'Restaurant name already exists.',
            );
          });
      });

      it('should return error if category not exists', async () => {
        return gqlTest(
          app,
          `
          mutation {
            editRestaurant(input:{
              name:"${editedRestaurantE2E.name}",
              categorySlug:"invalid-slug"
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
            expect(res.body.data.editRestaurant.ok).toEqual(false);
            expect(res.body.data.editRestaurant.error).toEqual(
              'Category not found.',
            );
          });
      });

      it('should edit restaurant', async () => {
        return gqlTest(
          app,
          `
          mutation {
            editRestaurant(input:{
              name:"${editedRestaurantE2E.name}",
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
            expect(res.body.data.editRestaurant.ok).toEqual(true);
            expect(res.body.data.editRestaurant.error).toEqual(null);
          });
      });
    });

    describe('searchRestaurant', () => {
      it('should return error if key not provided', () => {
        return gqlTest(
          app,
          `
        {
          searchRestaurant(input:{
            key:""
          }) {
            ok
            error
            result {
              name
            }
          }
        }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.searchRestaurant.ok).toEqual(false);
            expect(res.body.data.searchRestaurant.error).toEqual(
              'Key must me provided',
            );
            expect(res.body.data.searchRestaurant.result).toEqual(null);
          });
      });

      it('should return searched restaurants', async () => {
        await createCategory(app, categoryE2E);
        await createUserAndGetToken(app, ownerE2E);
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(app, restaurantE2E, owner);

        return gqlTest(
          app,
          `
        {
          searchRestaurant(input:{
            key:"${restaurantE2E.name}"
          }) {
            ok
            error
            result {
              name
            }
          }
        }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.searchRestaurant.ok).toEqual(true);
            expect(res.body.data.searchRestaurant.error).toEqual(null);
            expect(res.body.data.searchRestaurant.result).toEqual(
              expect.arrayContaining([{ name: restaurantE2E.name }]),
            );
          });
      });
    });

    describe('deleteRestaurant', () => {
      it('should return an error if role is not owner', async () => {
        const customerToken = await createUserAndGetToken(app, customerE2E);

        return gqlTest(
          app,
          `
        mutation {
          deleteRestaurant {
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
        const token = await createUserAndGetToken(app, ownerE2E);

        return gqlTest(
          app,
          `
        mutation {
          deleteRestaurant {
            ok
            error
          }
        }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteRestaurant.ok).toEqual(false);
            expect(res.body.data.deleteRestaurant.error).toEqual(
              'Restaurant does not exist.',
            );
          });
      });

      it('should delete restaurant', async () => {
        await createCategory(app, categoryE2E);
        const token = await createUserAndGetToken(app, ownerE2E);
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(app, restaurantE2E, owner);

        return gqlTest(
          app,
          `
        mutation {
          deleteRestaurant {
            ok
            error
          }
        }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteRestaurant.ok).toEqual(true);
            expect(res.body.data.deleteRestaurant.error).toEqual(null);
          });
      });
    });
  });

  describe('dish', () => {
    describe('createDish', () => {
      it('should return an error if role is not owner', async () => {
        const customerToken = await createUserAndGetToken(app, customerE2E);

        return gqlTest(
          app,
          `
        mutation {
          createDish(input:{
            name:"${dishE2E.name}",
            price:${dishE2E.price}
          }) {
            ok
            error
            dishId
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

      it('should return an error if restaurant not exists', async () => {
        const token = await createUserAndGetToken(app, ownerE2E);

        return gqlTest(
          app,
          `
        mutation {
          createDish(input:{
            name:"${dishE2E.name}",
            price:${dishE2E.price}
          }) {
            ok
            error
            dishId
          }
        }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createDish.ok).toEqual(false);
            expect(res.body.data.createDish.error).toEqual(
              'Restaurant not exists.',
            );
          });
      });

      it('should create dish', async () => {
        await createCategory(app, categoryE2E);
        const token = await createUserAndGetToken(app, ownerE2E);
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(app, restaurantE2E, owner);

        return gqlTest(
          app,
          `
        mutation {
          createDish(input:{
            name:"${dishE2E.name}",
            price:${dishE2E.price}
          }) {
            ok
            error
            dishId
          }
        }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createDish.ok).toEqual(true);
            expect(res.body.data.createDish.error).toEqual(null);
            expect(res.body.data.createDish.dishId).toEqual(expect.any(Number));
          });
      });
    });

    describe('editDish', () => {
      it('should return an error if role is not owner', async () => {
        const customerToken = await createUserAndGetToken(app, customerE2E);

        return gqlTest(
          app,
          `
          mutation {
            editDish(input:{
              dishId:1,
              name:"${editedDishE2E.name}"
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

      it('should return an error if restaurant not exists', async () => {
        const token = await createUserAndGetToken(app, ownerE2E);

        return gqlTest(
          app,
          `
          mutation {
            editDish(input:{
              dishId:1,
              name:"${editedDishE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editDish.ok).toEqual(false);
            expect(res.body.data.editDish.error).toEqual(
              'Restaurant not exists.',
            );
          });
      });

      it('should return an error if dish not exists', async () => {
        await createCategory(app, categoryE2E);
        const token = await createUserAndGetToken(app, ownerE2E);
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(app, restaurantE2E, owner);

        return gqlTest(
          app,
          `
          mutation {
            editDish(input:{
              dishId:999,
              name:"${editedDishE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editDish.ok).toEqual(false);
            expect(res.body.data.editDish.error).toEqual('Dish not found.');
          });
      });

      it('should edit dish', async () => {
        await createCategory(app, categoryE2E);
        const token = await createUserAndGetToken(app, ownerE2E);
        let owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(app, restaurantE2E, owner);

        owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        const dishId = await createDish(app, dishE2E, owner);

        return gqlTest(
          app,
          `
          mutation {
            editDish(input:{
              dishId:${dishId},
              name:"${editedDishE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editDish.ok).toEqual(true);
            expect(res.body.data.editDish.error).toEqual(null);
          });
      });
    });

    describe('deleteDish', () => {
      it('should return an error if role is not owner', async () => {
        const customerToken = await createUserAndGetToken(app, customerE2E);

        return gqlTest(
          app,
          `
          mutation {
            deleteDish(input:{
              dishId:1
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

      it('should return an error if restaurant not exists', async () => {
        const token = await createUserAndGetToken(app, ownerE2E);

        return gqlTest(
          app,
          `
          mutation {
            deleteDish(input:{
              dishId:1
            }) {
              ok
              error
            }
          }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteDish.ok).toEqual(false);
            expect(res.body.data.deleteDish.error).toEqual(
              'Restaurant not exists.',
            );
          });
      });

      it('should return an error if dish not exists', async () => {
        await createCategory(app, categoryE2E);
        const token = await createUserAndGetToken(app, ownerE2E);
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(app, restaurantE2E, owner);

        return gqlTest(
          app,
          `
          mutation {
            deleteDish(input:{
              dishId:999
            }) {
              ok
              error
            }
          }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteDish.ok).toEqual(false);
            expect(res.body.data.deleteDish.error).toEqual('Dish not found.');
          });
      });

      it('should delete dish', async () => {
        await createCategory(app, categoryE2E);
        const token = await createUserAndGetToken(app, ownerE2E);
        let owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await createRestaurant(app, restaurantE2E, owner);

        owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        const dishId = await createDish(app, dishE2E, owner);

        return gqlTest(
          app,
          `
          mutation {
            deleteDish(input:{
              dishId:${dishId}
            }) {
              ok
              error
            }
          }
        `,
          token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteDish.ok).toEqual(true);
            expect(res.body.data.deleteDish.error).toEqual(null);
          });
      });
    });
  });
});
