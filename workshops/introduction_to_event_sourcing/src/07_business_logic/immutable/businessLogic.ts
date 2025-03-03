import {
  PricedProductItem,
  ShoppingCart,
  ShoppingCartEvent,
  ShoppingCartStatus,
} from './shoppingCart';

//////////////////////////////////////
/// Commands
//////////////////////////////////////

export type OpenShoppingCart = {
  type: 'OpenShoppingCart';
  data: {
    shoppingCartId: string;
    clientId: string;
    now: Date;
  };
};

export type AddProductItemToShoppingCart = {
  type: 'AddProductItemToShoppingCart';
  data: {
    shoppingCartId: string;
    productItem: PricedProductItem;
  };
};

export type RemoveProductItemFromShoppingCart = {
  type: 'RemoveProductItemFromShoppingCart';
  data: {
    shoppingCartId: string;
    productItem: PricedProductItem;
  };
};

export type ConfirmShoppingCart = {
  type: 'ConfirmShoppingCart';
  data: {
    shoppingCartId: string;
    now: Date;
  };
};

export type CancelShoppingCart = {
  type: 'CancelShoppingCart';
  data: {
    shoppingCartId: string;
    now: Date;
  };
};

export type ShoppingCartCommand =
  | OpenShoppingCart
  | AddProductItemToShoppingCart
  | RemoveProductItemFromShoppingCart
  | ConfirmShoppingCart
  | CancelShoppingCart;

//////////////////////////////////////
/// Decide
//////////////////////////////////////

export const enum ShoppingCartErrors {
  CART_ALREADY_EXISTS = 'CART_ALREADY_EXISTS',
  CART_IS_ALREADY_CLOSED = 'CART_IS_ALREADY_CLOSED',
  PRODUCT_ITEM_NOT_FOUND = 'PRODUCT_ITEM_NOT_FOUND',
  PRODUCT_NOT_AVAIABLE = 'PRODUCT_NOT_AVAIABLE',
  CART_IS_EMPTY = 'CART_IS_EMPTY',
  UNKNOWN_EVENT_TYPE = 'UNKNOWN_EVENT_TYPE',
  UNKNOWN_COMMAND_TYPE = 'UNKNOWN_COMMAND_TYPE',
}

export const isProductIsPresentInCart = (
  productItemStore: PricedProductItem[],
  productItem: PricedProductItem,
) => {
  const founded = productItemStore.find(
    (p) =>
      p.productId === productItem.productId &&
      p.unitPrice == productItem.unitPrice,
  );

  if (founded === undefined) {
    throw new Error(ShoppingCartErrors.PRODUCT_ITEM_NOT_FOUND);
  }
};

export const openShoppingCart = ({
  type: _,
  data: { now, ...cmd },
}: OpenShoppingCart): ShoppingCartEvent => {
  return {
    type: 'ShoppingCartOpened',
    data: {
      ...cmd,
      openedAt: now,
    },
  };
};

export const addProductItemToShoppingCart = (
  { data: _command }: AddProductItemToShoppingCart,
  _shoppingCart: ShoppingCart,
): ShoppingCartEvent => {
  if (_shoppingCart.status !== ShoppingCartStatus.Pending) {
    throw new Error(ShoppingCartErrors.CART_IS_ALREADY_CLOSED);
  }

  return {
    type: 'ProductItemAddedToShoppingCart',
    data: {
      shoppingCartId: _command.shoppingCartId,
      productItem: _command.productItem,
    },
  };
};

export const removeProductItemFromShoppingCart = (
  { data: _command }: RemoveProductItemFromShoppingCart,
  _shoppingCart: ShoppingCart,
): ShoppingCartEvent => {
  if (_shoppingCart.status !== ShoppingCartStatus.Pending) {
    throw new Error(ShoppingCartErrors.CART_IS_ALREADY_CLOSED);
  }
  isProductIsPresentInCart(_shoppingCart.productItems, _command.productItem);

  return {
    type: 'ProductItemRemovedFromShoppingCart',
    data: {
      shoppingCartId: _command.shoppingCartId,
      productItem: _command.productItem,
    },
  };
};

export const confirmShoppingCart = (
  { data: _command }: ConfirmShoppingCart,
  _shoppingCart: ShoppingCart,
): ShoppingCartEvent => {
  if (_shoppingCart.status !== ShoppingCartStatus.Pending) {
    throw new Error(ShoppingCartErrors.CART_IS_ALREADY_CLOSED);
  }

  if (_shoppingCart.productItems.length === 0) {
    throw new Error(ShoppingCartErrors.CART_IS_EMPTY);
  }

  return {
    type: 'ShoppingCartConfirmed',
    data: {
      shoppingCartId: _command.shoppingCartId,
      confirmedAt: _command.now,
    },
  };
};

export const cancelShoppingCart = (
  { data: _command }: CancelShoppingCart,
  _shoppingCart: ShoppingCart,
): ShoppingCartEvent => {
  if (_shoppingCart.status !== ShoppingCartStatus.Pending) {
    throw new Error(ShoppingCartErrors.CART_IS_ALREADY_CLOSED);
  }

  return {
    type: 'ShoppingCartCanceled',
    data: {
      shoppingCartId: _command.shoppingCartId,
      canceledAt: _command.now,
    },
  };
};
