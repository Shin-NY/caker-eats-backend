import { INestApplication } from '@nestjs/common';
import { CreateUserInput } from 'src/user/dtos/create-user.dto';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { GRAPHQL_ENDPOINT } from './constants-e2e';
import { CreateCategoryInput } from 'src/restaurant/dtos/create-category.dto';
import { CreateRestaurantInput } from 'src/restaurant/dtos/create-restaurant.dto';
import { RestaurantService } from 'src/restaurant/restaurant.service';
import { CategoryService } from 'src/restaurant/category.service';
import { User } from 'src/user/entities/user.entity';
import { CreatePromotionInput } from 'src/user/dtos/create-promotion.dto';
import { PromotionService } from 'src/user/promotion.service';
import { DishService } from 'src/restaurant/dish.service';
import { CreateDishInput } from 'src/restaurant/dtos/create-dish.dto';
import { CreateOrderInput } from 'src/order/dtos/create-order.dto';
import { OrderService } from 'src/order/order.service';
import { HEADER_TOKEN } from 'src/auth/auth.constants';

export const gqlTest = (
  app: INestApplication,
  query: string,
  token?: string,
) => {
  if (token)
    return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .set(HEADER_TOKEN, token)
      .send({
        query,
      });
  return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
    query,
  });
};

export const clearDB = async (app: INestApplication) => {
  const dataSource = app.get(DataSource);
  const entities = dataSource.entityMetadatas;
  const tableNames = entities.map(entity => `"${entity.tableName}"`).join(', ');
  await dataSource.query(`TRUNCATE ${tableNames} CASCADE;`);
};

export const getMockedMailService = () => {
  return { sendVerificationEmail: () => {} };
};

export const createUserAndGetToken = async (
  app: INestApplication,
  data: CreateUserInput,
): Promise<string> => {
  const userService = app.get(UserService);
  const { error: createUserError } = await userService.createUser(data);
  if (createUserError) throw Error(createUserError);

  const { ok, token, error } = await userService.login({
    email: data.email,
    password: data.password,
  });
  if (!ok) throw Error(error);

  return token;
};

export const createCategory = async (
  app: INestApplication,
  category: CreateCategoryInput,
) => {
  const categoryService = app.get(CategoryService);

  const { ok, error } = await categoryService.createCategory(category);
  if (!ok) throw Error(error);
};

export const createRestaurant = async (
  app: INestApplication,
  restaurant: CreateRestaurantInput,
  owner: User,
) => {
  const restaurantService = app.get(RestaurantService);

  const { ok, error, restaurantId } = await restaurantService.createRestaurant(
    restaurant,
    owner,
  );
  if (!ok) throw Error(error);

  return restaurantId;
};

export const createPromotion = async (
  app: INestApplication,
  promotion: CreatePromotionInput,
  owner: User,
) => {
  const promotionService = app.get(PromotionService);

  const { ok, error } = await promotionService.createPromotion(
    promotion,
    owner,
  );
  if (!ok) throw Error(error);
};

export const createDish = async (
  app: INestApplication,
  dish: CreateDishInput,
  owner: User,
) => {
  const dishService = app.get(DishService);

  const { ok, error, dishId } = await dishService.createDish(dish, owner);
  if (!ok) throw Error(error);

  return dishId;
};

export const createOrder = async (
  app: INestApplication,
  orderInput: CreateOrderInput,
  customer: User,
) => {
  const orderService = app.get(OrderService);

  const { ok, error, orderId } = await orderService.createOrder(
    orderInput,
    customer,
  );
  if (!ok) throw Error(error);

  return orderId;
};
