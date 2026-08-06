// Supabase is disabled — using local authentication instead.
// This stub prevents import errors from existing code that imports supabase.

const noop = () => Promise.resolve({ data: null, error: null });
const noopAuth = {
  getUser: noop,
  signOut: noop,
  signInWithPassword: noop,
  signUp: noop,
  signInWithOAuth: noop,
  resend: noop,
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
};

const noopFrom = () => ({
  upsert: noop,
  select: noop,
  insert: noop,
  update: noop,
  delete: noop,
  eq: () => noopFrom(),
  single: noop,
});

export const supabase = {
  auth: noopAuth,
  from: noopFrom,
} as any;
