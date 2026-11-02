import { test, expect } from '../../src/fixtures/api';
import { expectError } from '../../src/api/helpers/accounts';
import { isIsoTimestamp } from '../../src/shared/data/formats';
import { activeLabProfile, labProfiles } from '../../src/shared/data/lab';

// Anyone signed in can read the lab profile. Only the admin can select one.
// Tests never switch to a different profile, because that would change API behavior for every parallel test.
test.describe('Lab profile', () => {
  // The customer reads exactly the 7 lab profiles with "baseline" active.
  // The admin reselects "baseline", which must stay active.
  // A product created before the call must be unchanged, proving selection does not reset data.
  test('admin can reselect the active profile without losing data', async ({
    labService, productService, adminToken, customerToken, stockedProduct,
  }) => {
    const profile = await labService.getProfile(customerToken);
    expect(isIsoTimestamp(profile.updatedAt)).toBe(true);
    expect(profile).toEqual({ activeProfile: activeLabProfile, updatedAt: profile.updatedAt, profiles: labProfiles });

    expect(await labService.selectProfile(activeLabProfile, adminToken)).toMatchObject({
      activeProfile: activeLabProfile, profiles: labProfiles,
    });
    expect(await labService.getProfile(customerToken)).toMatchObject({ activeProfile: activeLabProfile, profiles: labProfiles });
    expect(await productService.get(stockedProduct.id)).toEqual(stockedProduct);
  });

  // The admin selects a profile that does not exist. The API must answer 422 and keep "baseline" active.
  test('unknown profile is rejected', async ({ labService, labApi, adminToken, customerToken }) => {
    await expectError(await labApi.selectProfile({ profile: 'nonexistent-api-test-profile' }, adminToken), 422, 'PROFILE_UNKNOWN');
    expect(await labService.getProfile(customerToken)).toMatchObject({ activeProfile: activeLabProfile });
  });

  // A customer tries to select a profile. The API must answer 403 and keep "baseline" active.
  test('customer cannot select a profile', async ({ labService, labApi, customerToken }) => {
    await expectError(await labApi.selectProfile({ profile: activeLabProfile }, customerToken), 403, 'FORBIDDEN');
    expect(await labService.getProfile(customerToken)).toMatchObject({ activeProfile: activeLabProfile });
  });
});
