// 1. Define your events and entity here
//
//
//
const withMetadata = (evt: any) => {
  return 
};

type CartEvents =
  | { type: 'CART_OPENED'; id: string }
  | { type: 'PRODUCT_ADDED'; product_id: string; quantity: number; id: string }
  | { type: 'PRODUCT_REMOVED'; product_id: string; id: string }
  | { type: 'CART_CONFIRMED'; id: string }
  | { type: 'CART_CANCELED'; id: string };

describe('Events definition', () => {
  it('all event types should be defined', () => {
    const events: CartEvents[] = [
      { type: 'CART_OPENED', id: '88dd34c4-25f5-4e38-ae5d-6fec6db27ff4' },
      {
        type: 'PRODUCT_ADDED',
        id: '88dd34c4-25f5-4e38-ae5d-6fec6db27ff4',
        quantity: 2,
        product_id: 'e2780217-45b8-4f09-995e-d126994af949',
      },
      {
        type: 'PRODUCT_REMOVED',
        id: '88dd34c4-25f5-4e38-ae5d-6fec6db27ff4',
        product_id: 'e2780217-45b8-4f09-995e-d126994af949',
      },
      { type: 'CART_CONFIRMED', id: '88dd34c4-25f5-4e38-ae5d-6fec6db27ff4' },
    ];

    expect(events.length).toBe(5);
  });
});
