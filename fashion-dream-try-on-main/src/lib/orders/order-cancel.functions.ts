import { createServerFn } from "@tanstack/react-start";
import { supabaseUserRequest } from "../supabase-user.server";

export const cancelCustomerOrder = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; orderId: string }) => data)
  .handler(async ({ data }) => {
    const token = data.accessToken.trim();
    const orderId = data.orderId.trim();
    if (!token) throw new Error("UNAUTHORIZED");
    if (!orderId) throw new Error("Mã đơn hàng không hợp lệ.");
    try {
      return await supabaseUserRequest<boolean>("rpc/cancel_my_order", token, {
        method: "POST",
        body: JSON.stringify({ p_order_id: orderId }),
      });
    } catch (error) {
      const status = Number((error as { status?: number }).status || 0);
      if (status === 401 || status === 403) throw new Error("Phiên đăng nhập đã hết hạn.");
      throw error;
    }
  });
