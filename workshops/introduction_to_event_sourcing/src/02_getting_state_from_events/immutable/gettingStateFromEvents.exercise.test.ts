import { v4 as uuid } from 'uuid';
import { ShoppingCartEvent } from '../oop/gettingStateFromEvents.exercise.test';
import { RandomUuid } from 'testcontainers';
import { time } from 'console';

export type Event<
  EventType extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>,
> = Readonly<{
  type: Readonly<EventType>;
  data: Readonly<EventData>;
}>;

export interface ProductItem {
  productId: string;
  quantity: number;
}

export type PricedProductItem = ProductItem & {
  unitPrice: number;
};

export type ShoppingCartOpened = Event<
  'ShoppingCartOpened',
  {
    shoppingCartId: string;
    clientId: string;
    openedAt: Date;
  }
>;

export type ProductItemAddedToShoppingCart = Event<
  'ProductItemAddedToShoppingCart',
  {
    shoppingCartId: string;
    productItem: PricedProductItem;
  }
>;

export type ProductItemRemovedFromShoppingCart = Event<
  'ProductItemRemovedFromShoppingCart',
  {
    shoppingCartId: string;
    productItem: PricedProductItem;
  }
>;

export type ShoppingCartConfirmed = Event<
  'ShoppingCartConfirmed',
  {
    shoppingCartId: string;
    confirmedAt: Date;
  }
>;

export type ShoppingCartCanceled = Event<
  'ShoppingCartCanceled',
  {
    shoppingCartId: string;
    canceledAt: Date;
  }
>;

enum ShoppingCartStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Canceled = 'Canceled',
}

export type ShoppingCart = Readonly<{
  id: string;
  clientId: string;
  status: ShoppingCartStatus;
  productItems: PricedProductItem[];
  openedAt: Date;
  confirmedAt?: Date;
  canceledAt?: Date;
}>;

const initShopingCart = (): ShoppingCart => {
  let cart: ShoppingCart = {
    id: uuid(),
    clientId: '',
    status: ShoppingCartStatus.Pending,
    productItems: [],
    openedAt: new Date(),
  };

  return cart;
};

export const getShoppingCart = (_events: ShoppingCartEvent[]): ShoppingCart => {
  const cart = initShopingCart();
  return _events.reduce((state, event) => {
    switch (event.type) {
      case 'ShoppingCartOpened': {
        return state;
      }
      case 'ProductItemAddedToShoppingCart': {
        return state;
      }

      case 'ProductItemRemovedFromShoppingCart': {
        return state;
      }

      case 'ShoppingCartConfirmed': {
        return state;
      }
      case 'ShoppingCartCanceled':
        return state;
      default: {
        return state;
      }
    }
  }, cart);
};

describe('Events definition', () => {
  it('all event types should be defined', () => {
    const shoppingCartId = uuid();

    const clientId = uuid();
    const openedAt = new Date();
    const confirmedAt = new Date();
    const canceledAt = new Date();

    const shoesId = uuid();

    const twoPairsOfShoes: PricedProductItem = {
      productId: shoesId,
      quantity: 2,
      unitPrice: 100,
    };
    const pairOfShoes: PricedProductItem = {
      productId: shoesId,
      quantity: 1,
      unitPrice: 100,
    };

    const tShirtId = uuid();
    const tShirt: PricedProductItem = {
      productId: tShirtId,
      quantity: 1,
      unitPrice: 5,
    };

    const events: ShoppingCartEvent[] = [
      // 2. Put your sample events here
      {
        type: 'ShoppingCartOpened',
        data: {
          shoppingCartId,
          clientId,
          openedAt,
        },
      },
      {
        type: 'ProductItemAddedToShoppingCart',
        data: {
          shoppingCartId,
          productItem: twoPairsOfShoes,
        },
      },
      {
        type: 'ProductItemAddedToShoppingCart',
        data: {
          shoppingCartId,
          productItem: tShirt,
        },
      },
      {
        type: 'ProductItemRemovedFromShoppingCart',
        data: { shoppingCartId, productItem: pairOfShoes },
      },
      {
        type: 'ShoppingCartConfirmed',
        data: {
          shoppingCartId,
          confirmedAt,
        },
      },
      {
        type: 'ShoppingCartCanceled',
        data: {
          shoppingCartId,
          canceledAt,
        },
      },
    ];

    const shoppingCart = getShoppingCart(events);

    expect(shoppingCart).toBe({
      id: shoppingCartId,
      clientId,
      status: ShoppingCartStatus.Canceled,
      productItems: [pairOfShoes, tShirt],
      openedAt,
      confirmedAt,
      canceledAt,
    });
  });
});
