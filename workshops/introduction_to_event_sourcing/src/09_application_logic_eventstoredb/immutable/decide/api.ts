import { Request, Response, Router } from 'express';
import {
  assertNotEmptyString,
  assertPositiveNumber,
} from '../../tools/validation';
import { EventStore, getEventStore } from '../../tools/eventStore';
import { sendCreated } from '../../tools/api';
import { v4 as uuid } from 'uuid';
import {
  emptyShoppingCart,
  evolve,
  PricedProductItem,
  ProductItem,
  ShoppingCart,
  ShoppingCartErrors,
  ShoppingCartEvent,
  ShoppingCartStatus,
} from './shoppingCart';
import { OpenShoppingCart, ShoppingCartCommand } from './businessLogic';
import { EventStoreDBClient } from '@eventstore/db-client';

export const mapShoppingCartStreamId = (id: string) => `shopping_cart-${id}`;

export const handle = async (
  eventStore: EventStore,
  streamId: string,
  execut: (state: ShoppingCart | null) => ShoppingCartEvent,
) => {
  const streamName = mapShoppingCartStreamId(streamId);

  const state = await eventStore.aggregateStream<
    ShoppingCart,
    ShoppingCartEvent
  >(streamName, {
    evolve: evolve,
    getInitialState: () => emptyShoppingCart,
  });

  return execut(state);
};

export const shoppingCartApi =
  (eventStoreDBClient: EventStoreDBClient) => (router: Router) => {
    // Open Shopping cart
    router.post(
      '/clients/:clientId/shopping-carts/',
      async (request: Request, response: Response) => {
        const shoppingCartId = uuid();
        const _clientId = assertNotEmptyString(request.params.clientId);

        const cmd: OpenShoppingCart = {
          type: 'OpenShoppingCart',
          data: {
            shoppingCartId: shoppingCartId,
            clientId: _clientId,
            now: new Date(),
          },
        };
        const eventStoreDB = getEventStore(eventStoreDBClient);

        const event = await handle(
          eventStoreDB,
          shoppingCartId,
          (state: ShoppingCart | null) => {
            if (state === null) {
              return {
                type: 'ShoppingCartOpened',
                data: {
                  shoppingCartId: cmd.data.shoppingCartId,
                  clientId: cmd.data.clientId,
                  openedAt: cmd.data.now,
                },
              };
            }

            if (state.status !== ShoppingCartStatus.Empty) {
              throw new Error(ShoppingCartErrors.CART_ALREADY_EXISTS);
            }

            return {
              type: 'ShoppingCartOpened',
              data: {
                shoppingCartId: cmd.data.shoppingCartId,
                clientId: cmd.data.clientId,
                openedAt: cmd.data.now,
              },
            };
          },
        );

        sendCreated(response, event.data.shoppingCartId);
      },
    );

    router.post(
      '/clients/:clientId/shopping-carts/:shoppingCartId/product-items',
      (request: AddProductItemRequest, response: Response) => {
        const _shoppingCartId = assertNotEmptyString(
          request.params.shoppingCartId,
        );
        const _productItem: ProductItem = {
          productId: assertNotEmptyString(request.body.productId),
          quantity: assertPositiveNumber(request.body.quantity),
        };

        // Fill the gap here
        throw new Error('Not Implemented!');

        response.sendStatus(204);
      },
    );

    // Remove Product Item
    router.delete(
      '/clients/:clientId/shopping-carts/:shoppingCartId/product-items',
      (request: Request, response: Response) => {
        const _shoppingCartId = assertNotEmptyString(
          request.params.shoppingCartId,
        );
        const _productItem: PricedProductItem = {
          productId: assertNotEmptyString(request.query.productId),
          quantity: assertPositiveNumber(Number(request.query.quantity)),
          unitPrice: assertPositiveNumber(Number(request.query.unitPrice)),
        };

        // Fill the gap here
        throw new Error('Not Implemented!');

        response.sendStatus(204);
      },
    );

    // Confirm Shopping Cart
    router.post(
      '/clients/:clientId/shopping-carts/:shoppingCartId/confirm',
      (request: Request, response: Response) => {
        const _shoppingCartId = assertNotEmptyString(
          request.params.shoppingCartId,
        );

        // Fill the gap here
        throw new Error('Not Implemented!');

        response.sendStatus(204);
      },
    );

    // Cancel Shopping Cart
    router.delete(
      '/clients/:clientId/shopping-carts/:shoppingCartId',
      (request: Request, response: Response) => {
        const _shoppingCartId = assertNotEmptyString(
          request.params.shoppingCartId,
        );

        // Fill the gap here
        throw new Error('Not Implemented!');

        response.sendStatus(204);
      },
    );
  };

// Add Product Item
type AddProductItemRequest = Request<
  Partial<{ shoppingCartId: string }>,
  unknown,
  Partial<{ productId: number; quantity: number }>
>;
