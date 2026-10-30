-- RLS policies on orders and order_items call this helper for the backoffice branch.
-- The function only evaluates the current auth.uid(), so authenticated users can
-- safely execute it without gaining access to another user's role records.
grant execute on function public.has_backoffice_role(public.app_role) to authenticated;
