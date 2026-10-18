import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/new-arrivals")({ component: NewArrivalsPage });

function NewArrivalsPage() {
  return <main><h1>NEW ARRIVALS — Hàng mới về</h1><p>Khám phá những sản phẩm vừa được bổ sung.</p></main>;
}
