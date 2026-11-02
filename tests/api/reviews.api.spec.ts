import { test, expect } from '../../src/fixtures/api';
import { expectError } from '../../src/api/helpers/accounts';
import { isIsoTimestamp, uuidPattern } from '../../src/shared/data/formats';
import { seedCustomer } from '../../src/shared/data/users';

// Only a customer with a delivered order can review the product they bought.
test.describe('Product reviews', () => {
  // The admin delivers the order, then the customer posts a 4-star review.
  // The product must show exactly that review under the customer's name, with a 4.0 average from 1 review.
  // Posting the same review again must fail with 409.
  test('customer can review a delivered purchase only once', async ({
    reviewService, reviewsApi, orderService, productService, customerToken, adminToken, placedOrder, stockedProduct,
  }) => {
    await orderService.deliver(placedOrder.id, adminToken);
    const body = { productId: stockedProduct.id, orderId: placedOrder.id, rating: 4, comment: 'Verified API purchase review.' };
    const review = await reviewService.create(body, customerToken);
    expect(review.id).toMatch(uuidPattern);
    expect(isIsoTimestamp(review.createdAt)).toBe(true);
    expect(review).toEqual({ ...body, id: review.id, userId: seedCustomer.id, createdAt: review.createdAt });

    expect(await productService.get(stockedProduct.id)).toMatchObject({
      averageRating: 4,
      reviewCount: 1,
      reviews: [{ id: review.id, rating: 4, comment: body.comment, createdAt: review.createdAt, authorName: seedCustomer.fullName }],
    });
    await expectError(await reviewsApi.create(body, customerToken), 409, 'REVIEW_EXISTS');
  });

  // The order is still confirmed, not delivered. The review must fail with 403 and the product stays unreviewed.
  test('customer cannot review an order that is not delivered', async ({
    reviewsApi, productService, customerToken, placedOrder, stockedProduct,
  }) => {
    await expectError(await reviewsApi.create({
      productId: stockedProduct.id, orderId: placedOrder.id, rating: 5, comment: 'Not delivered yet.',
    }, customerToken), 403, 'REVIEW_NOT_ELIGIBLE');
    expect(await productService.get(stockedProduct.id)).toMatchObject({ averageRating: 0, reviewCount: 0, reviews: [] });
  });
});
