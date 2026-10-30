export {
  getCustomerSession,
  getCustomerUser,
  isCustomerAuthenticated,
  signInCustomer,
  signUpCustomer,
  signOutCustomer,
  requestPasswordReset,
  updateCustomerPassword,
  refreshCustomerSession,
  getSafeReturnPath,
  startCustomerSessionWatcher,
} from "@/lib/auth";

export type {
  Session as CustomerSession,
} from "@/lib/upthink-supabase";

type CustomerUser = { id: string; email?: string };
export type { CustomerUser };
