import { env } from '$env/dynamic/public';
import type { CustomerInfo, PurchasesPackage } from '@revenuecat/purchases-capacitor';

export const ENTITLEMENT_ID = 'Parallel Arabic Premium';

let initialized = false;

export const RevenueCatService = {
  async initialize(userId: string) {
    if (initialized) return;
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    console.log('[RC] Initializing with key:', env.PUBLIC_REVENUECAT_IOS_API_KEY?.slice(0, 10));
    await Purchases.configure({
      apiKey: env.PUBLIC_REVENUECAT_IOS_API_KEY,
      appUserID: userId
    });
    initialized = true;
  },

  async getCurrentOffering(): Promise<PurchasesPackage | null> {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { current } = await Purchases.getOfferings();
    return current?.availablePackages[0] ?? null;
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
