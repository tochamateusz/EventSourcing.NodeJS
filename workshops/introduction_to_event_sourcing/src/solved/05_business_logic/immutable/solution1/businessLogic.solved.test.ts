import { v4 as uuid } from 'uuid';
import {
  ShoppingCartErrors,
  openShoppingCart,
  addProductItemToShoppingCart,
  removeProductItemFromShoppingCart,
  confirmShoppingCart,
  cancelShoppingCart,
  handleCommand,
} from './businessLogic';

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

export type ShoppingCartEvent =
  | ShoppingCartOpened
  | ProductItemAddedToShoppingCart
  | ProductItemRemovedFromShoppingCart
  | ShoppingCartConfirmed
  | ShoppingCartCanceled;

export enum ShoppingCartStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Canceled = 'Canceled',
}

export const merge = <T>(
  array: T[],
  item: T,
  where: (current: T) => boolean,
  onExisting: (current: T) => T,
  onNotFound: () => T | undefined = () => undefined
) => {
  let wasFound = false;

  const result = array
    // merge the existing item if matches condition
    .map((p: T) => {
      if (!where(p)) return p;

      wasFound = true;
      return onExisting(p);
    })
    // filter out item if undefined was returned
    // for cases of removal
    .filter((p) => p !== undefined)
    // make TypeScript happy
    .map((p) => {
      if (!p) throw Error('That should not happen');

      return p;
    });

  // if item was not found and onNotFound action is defined
  // try to generate new item
  if (!wasFound) {
    const result = onNotFound();

    if (result !== undefined) return [...array, item];
  }

  return result;
};

export type ShoppingCart = Readonly<{
  id: string;
  clientId: string;
  status: ShoppingCartStatus;
  productItems: PricedProductItem[];
  openedAt: Date;
  confirmedAt?: Date;
  canceledAt?: Date;
}>;

export const evolve = (
  state: ShoppingCart,
  { type, data: event }: ShoppingCartEvent
): ShoppingCart => {
  switch (type) {
    case 'ShoppingCartOpened':
      return {
        id: event.shoppingCartId,
        clientId: event.clientId,
        openedAt: event.openedAt,
        productItems: [],
        status: ShoppingCartStatus.Pending,
      };
    case 'ProductItemAddedToShoppingCart': {
      const { productItems } = state;
      const { productItem } = event;

      return {
        ...state,
        productItems: merge(
          productItems,
          productItem,
          (p) =>
            p.productId === productItem.productId &&
            p.unitPrice === productItem.unitPrice,
          (p) => {
            return {
              ...p,
              quantity: p.quantity + productItem.quantity,
            };
          },
          () => productItem
        ),
      };
    }
    case 'ProductItemRemovedFromShoppingCart': {
      const { productItems } = state;
      const { productItem } = event;
      return {
        ...state,
        productItems: merge(
          productItems,
          productItem,
          (p) =>
            p.productId === productItem.productId &&
            p.unitPrice === productItem.unitPrice,
          (p) => {
            return {
              ...p,
              quantity: p.quantity - productItem.quantity,
            };
          }
        ),
      };
    }
    case 'ShoppingCartConfirmed':
      return {
        ...state,
        status: ShoppingCartStatus.Confirmed,
        confirmedAt: event.confirmedAt,
      };
    case 'ShoppingCartCanceled':
      return {
        ...state,
        status: ShoppingCartStatus.Canceled,
        canceledAt: event.canceledAt,
      };
    default: {
      const _: never = type;
      throw new Error(ShoppingCartErrors.UNKNOWN_EVENT_TYPE);
    }
  }
};

export const getShoppingCart = (events: ShoppingCartEvent[]): ShoppingCart => {
  // 1. Add logic here
  return events.reduce<ShoppingCart>(evolve, {} as ShoppingCart);
};

export type Event<
  StreamEvent extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>
> = Readonly<{
  type: Readonly<StreamEvent>;
  data: Readonly<EventData>;
}>;

export interface EventStore {
  readStream<E extends Event>(streamId: string): E[];
  appendToStream(streamId: string, events: Event[]): void;
}

export const getEventStore = () => {
  const streams = new Map<string, Event[]>();

  return {
    readStream: <E extends Event>(streamId: string): E[] => {
      return streams.get(streamId)?.map((e) => <E>e) ?? [];
    },
    appendToStream: (streamId: string, events: Event[]): void => {
      const current = streams.get(streamId) ?? [];

      streams.set(streamId, [...current, ...events]);
    },
  };
};

const handle = handleCommand(evolve, () => ({} as ShoppingCart));

describe('Getting state from events', () => {
  it('Should return the state from the sequence of events', () => {
    const eventStore = getEventStore();
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

    handle(eventStore, shoppingCartId, (_) =>
      openShoppingCart({ clientId, shoppingCartId, now: openedAt })
    );

    handle(eventStore, shoppingCartId, (state) =>
      addProductItemToShoppingCart(
        {
          shoppingCartId,
          productItem: twoPairsOfShoes,
        },
        state
      )
    );

    handle(eventStore, shoppingCartId, (state) =>
      addProductItemToShoppingCart(
        {
          shoppingCartId,
          productItem: tShirt,
        },
        state
      )
    );

    handle(eventStore, shoppingCartId, (state) =>
      removeProductItemFromShoppingCart(
        {
          shoppingCartId,
          productItem: pairOfShoes,
        },
        state
      )
    );

    handle(eventStore, shoppingCartId, (state) =>
      confirmShoppingCart({ shoppingCartId, now: confirmedAt }, state)
    );

    const cancel = () =>
      handle(eventStore, shoppingCartId, (state) =>
        cancelShoppingCart({ shoppingCartId, now: canceledAt }, state)
      );

    expect(cancel).toThrowError(ShoppingCartErrors.CART_IS_ALREADY_CLOSED);

    const events = eventStore.readStream<ShoppingCartEvent>(shoppingCartId);

    expect(events).toEqual([
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
      // This should fail
      // {
      //   type: 'ShoppingCartCanceled',
      //   data: {
      //     shoppingCartId,
      //     canceledAt,
      //   },
      // },
    ]);

    const shoppingCart = getShoppingCart(events);

    expect(shoppingCart).toStrictEqual({
      id: shoppingCartId,
      clientId,
      status: ShoppingCartStatus.Confirmed,
      productItems: [pairOfShoes, tShirt],
      openedAt,
      confirmedAt,
    });
  });
});
