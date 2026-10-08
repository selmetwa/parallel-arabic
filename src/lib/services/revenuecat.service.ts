import { env } from '$env/dynamic/public';
import type { CustomerInfo, PurchasesPackage } from '@revenuecat/purchases-capacitor';

export const ENTITLEMENT_ID = 'Parallel Arabic Premium';

/** One App Store plan, with prices straight from StoreKit (localized). */
export type StorePlan = {
  pkg: PurchasesPackage;
  priceString: string;
  /** Annual only, and only when StoreKit reports it, e.g. "$8.33". */
  pricePerMonthString: string | null;
  /** Free-trial length in days when Apple says this user can still get it. */
  trialDays: number | null;
};

export type StorePlans = { monthly: StorePlan; annual: StorePlan | null };

let initPromise: Promise<void> | null = null;
let plansPromise: Promise<StorePlans | null> | null = null;

const DAYS_PER_UNIT: Record<string, number> = { DAY: 1, WEEK: 7 };

function toStorePlan(pkg: PurchasesPackage, eligible: boolean): StorePlan {
  const product = pkg.product;
  const intro = product.introPrice;
  const unitDays = intro ? DAYS_PER_UNIT[intro.periodUnit] : undefined;
  const isFreeTrial = eligible && !!intro && intro.price === 0 && !!unitDays;
  return {
    pkg,
    priceString: product.priceString,
    pricePerMonthString: product.pricePerMonthString ?? null,
    trialDays: isFreeTrial ? unitDays! * intro!.periodNumberOfUnits * intro!.cycles : null
  };
}

export const RevenueCatService = {
  // Shared promise so callers that start at the same time configure once.
  initialize(userId: string): Promise<void> {
    initPromise ??= (async () => {
      const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      const apiKey = env.PUBLIC_REVENUECAT_IOS_API_KEY ?? 'MISSING';
      console.log(`🔑🔑🔑 RC API KEY = [${apiKey}] length=${apiKey.length}`);
      await Purchases.configure({
        apiKey,
        appUserID: userId
      });
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
    return initPromise;
  },

  /**
   * Monthly and annual plans from the current offering, with Apple's trial
   * eligibility. Annual is null until the product is live in the offering, so
   * callers fall back to monthly only. Cached for the page's lifetime; a
   * failed load is retried on the next call.
   */
  getPlans(userId: string): Promise<StorePlans | null> {
    plansPromise ??= (async () => {
      await this.initialize(userId);
      const { Purchases, INTRO_ELIGIBILITY_STATUS } = await import('@revenuecat/purchases-capacitor');
      const { current } = await Purchases.getOfferings();
      const monthly = current?.monthly ?? current?.availablePackages[0] ?? null;
      if (!monthly) return null;
      const annual = current?.annual ?? null;

      const ids = [monthly, annual].filter((p) => p !== null).map((p) => p.product.identifier);
      const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility({
        productIdentifiers: ids
      }).catch(() => ({}) as Record<string, { status: number }>);
      const isEligible = (pkg: PurchasesPackage) =>
        eligibility[pkg.product.identifier]?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;

      return {
        monthly: toStorePlan(monthly, isEligible(monthly)),
        annual: annual ? toStorePlan(annual, isEligible(annual)) : null
      };
    })().catch((err) => {
      plansPromise = null;
      console.error('[RevenueCat] getPlans failed:', err);
      return null;
    });
    return plansPromise;
  },

  /** Drop cached plans, e.g. after a purchase changes trial eligibility. */
  clearPlans() {
    plansPromise = null;
  },

  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return customerInfo;
  },

  async restorePurchases(): Promise<CustomerInfo> {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo;
  },

  async getCustomerInfo(): Promise<CustomerInfo> {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  },

  isEntitlementActive(customerInfo: CustomerInfo): boolean {
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return !!entitlement;
  }
};
