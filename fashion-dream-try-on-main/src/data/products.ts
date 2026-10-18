import { formatPrice } from "@/lib/i18n";

export type ProductDetails = {
  material?: string;
  fit?: string;
  style?: string;
  care?: string;
  origin?: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: "hoodies" | "tees" | "outerwear" | "accessories" | "cap" | "sunglass";
  image: string;
  gallery: string[];
  sizes: string[];
  colors: string[];
  badge?: string;
  fashionStyle?: "Street" | "Minimal" | "Smart casual" | "Y2K" | null;
  tags?: string[];
  shortDescription?: string;
  description: string;
  details?: ProductDetails;
  sku?: string;
};

const px = (id: string, w = 900) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const CATEGORIES = [
  { slug: "hoodies", name: "Hoodies", image: px("18956666", 800) },
  { slug: "tees", name: "Tees", image: px("1311588", 800) },
  { slug: "outerwear", name: "Outerwear", image: px("19273260", 800) },
  { slug: "accessories", name: "Accessories", image: px("30989278", 800) },
  { slug: "cap", name: "Caps", image: px("6612173", 800) },
  { slug: "sunglass", name: "Sunglasses", image: px("30989278", 800) },
] as const;

export const PRODUCTS: Product[] = [
  {
    id: "shadow-hoodie", name: "Shadow Hoodie", price: 1290000, category: "hoodies", image: px("18956666"),
    gallery: [px("18956666"), px("774909"), px("15213195")], sizes: ["S", "M", "L", "XL"], colors: ["Charcoal", "Ivory"], badge: "New drop",
    tags: ["Unisex", "Oversized", "Everyday"], shortDescription: "Hoodie oversize 480gsm với vai xuôi và mũ 2 lớp.",
    description: "Hoodie oversize vải nỉ bông 480gsm, form rộng vai xuôi, mũ 2 lớp. Dễ phối cho những ngày thường, đi học hoặc xuống phố.",
    details: { material: "Cotton blend 480gsm", fit: "Oversized", style: "Unisex / Everyday", care: "Giặt máy ở nhiệt độ thấp", origin: "Designed by WEARO" }, sku: "WR-HOD-SHD"
  },
  {
    id: "statement-tee", name: "Statement Tee", price: 690000, category: "tees", image: px("1311588"),
    gallery: [px("1311588"), px("30186074"), px("14216454")], sizes: ["S", "M", "L", "XL"], colors: ["Black", "Ivory"],
    tags: ["Unisex", "Cotton", "Everyday"], shortDescription: "T-shirt cotton compact 100% với phom thoải mái.",
    description: "Cotton 100% dệt compact, phom thoải mái và dễ phối. Một lớp nền gọn gàng cho nhiều phong cách cá nhân.",
    details: { material: "Cotton 100% compact", fit: "Relaxed", style: "Unisex / Everyday", care: "Giặt máy ở nhiệt độ thấp", origin: "Designed by WEARO" }, sku: "WR-TEE-STM"
  },
  {
    id: "night-shift-set", name: "Night Shift Set", price: 1490000, category: "outerwear", image: px("17037339"),
    gallery: [px("17037339"), px("12104691"), px("28484979")], sizes: ["M", "L", "XL"], colors: ["Black"], badge: "Best seller",
    tags: ["Unisex", "Set", "Minimal"], shortDescription: "Set áo khoác và quần ống suông linh hoạt.",
    description: "Set áo khoác + quần ống suông tối giản, phối cùng nhau hoặc tách rời đều linh hoạt cho ngày làm việc và cuối tuần.",
    details: { material: "Technical blend", fit: "Relaxed", style: "Minimal / Unisex", care: "Giặt máy ở nhiệt độ thấp", origin: "Designed by WEARO" }, sku: "WR-SET-NSH"
  },
  {
    id: "oversized-shell-jacket", name: "Oversized Shell Jacket", price: 1890000, category: "outerwear", image: px("19273260"),
    gallery: [px("19273260"), px("18698406"), px("5840443")], sizes: ["M", "L", "XL"], colors: ["Moss", "Charcoal"],
    tags: ["Unisex", "Oversized", "Outerwear"], shortDescription: "Shell jacket chống gió nhẹ với túi hộp lớn.",
    description: "Áo khoác shell chống gió nhẹ, seam dán, túi hộp lớn — một lớp outerwear hiện đại cho mọi tủ đồ.",
    details: { material: "Lightweight shell", fit: "Oversized", style: "Unisex / Utility", care: "Lau sạch hoặc giặt nhẹ", origin: "Designed by WEARO" }, sku: "WR-JKT-OSJ"
  },
  {
    id: "beanie-mono", name: "Beanie Mono", price: 390000, category: "accessories", image: px("6612173"),
    gallery: [px("6612173"), px("30989278")], sizes: ["Freesize"], colors: ["Black", "Electric"],
    tags: ["Unisex", "Accessory", "Everyday"], shortDescription: "Beanie len tăm tối giản cho outfit hằng ngày.",
    description: "Beanie len tăm, thiết kế tối giản. Món phụ kiện gọn giúp hoàn thiện outfit hằng ngày.",
    details: { material: "Rib knit", fit: "Freesize", style: "Unisex / Everyday", care: "Giặt tay nhẹ", origin: "Designed by WEARO" }, sku: "WR-ACC-BNM"
  },
  {
    id: "crossbody-utility", name: "Crossbody Utility", price: 590000, category: "accessories", image: px("30989278"),
    gallery: [px("30989278"), px("28484979")], sizes: ["Freesize"], colors: ["Black"],
    tags: ["Utility", "Unisex", "Everyday"], shortDescription: "Túi cordura 3 ngăn với dây bản to điều chỉnh nhanh.",
    description: "Túi đeo chéo vải cordura, 3 ngăn, dây bản to điều chỉnh nhanh — thực dụng và dễ dùng cho cả nam lẫn nữ.",
    details: { material: "Cordura fabric", fit: "Adjustable", style: "Utility / Unisex", care: "Lau sạch", origin: "Designed by WEARO" }, sku: "WR-BAG-CBU"
  },
  {
    id: "cargo-wide-pant", name: "Cargo Wide Pant", price: 990000, category: "outerwear", image: px("12104691"),
    gallery: [px("12104691"), px("18698406")], sizes: ["S", "M", "L", "XL"], colors: ["Cement", "Moss"],
    tags: ["Unisex", "Cargo", "Wide fit"], shortDescription: "Quần cargo ống rộng với túi hộp và lai bo dây rút.",
    description: "Quần cargo ống rộng, túi hộp gập, lai bo dây rút — thoải mái từ giảng đường ra phố.",
    details: { material: "Cotton blend", fit: "Wide", style: "Unisex / Utility", care: "Giặt máy ở nhiệt độ thấp", origin: "Designed by WEARO" }, sku: "WR-PNT-CWP"
  },
  {
    id: "campus-crewneck", name: "Campus Crewneck", price: 890000, category: "hoodies", image: px("15213195"),
    gallery: [px("15213195"), px("774909")], sizes: ["S", "M", "L", "XL"], colors: ["Beige", "Charcoal"], badge: "IUH edition",
    tags: ["Unisex", "Layering", "Everyday"], shortDescription: "Crewneck phom vừa, màu trung tính, dễ layer quanh năm.",
    description: "Sweater cổ tròn phom vừa, màu trung tính và dễ layer quanh năm. Thiết kế unisex cho phong cách everyday.",
    details: { material: "Cotton fleece", fit: "Regular", style: "Unisex / Campus", care: "Giặt máy ở nhiệt độ thấp", origin: "Designed by WEARO" }, sku: "WR-SWT-CCN"
  },
  {
    id: "street-cap", name: "Street Cap", price: 490000, category: "cap", image: px("6612173"),
    gallery: [px("6612173"), px("30989278")], sizes: ["Freesize"], colors: ["Black", "Electric"], badge: "New accessory",
    tags: ["Unisex", "Accessory", "Everyday"], shortDescription: "Mũ cotton 6 mảnh với logo thêu nổi và khóa điều chỉnh.",
    description: "Mũ lưỡi trai cotton 6 mảnh, logo thêu nổi và khóa điều chỉnh phía sau. Dễ phối cho mọi outfit.",
    details: { material: "Cotton", fit: "Freesize", style: "Unisex / Everyday", care: "Lau sạch", origin: "Designed by WEARO" }, sku: "WR-CAP-STC"
  },
  {
    id: "shade-runner", name: "Shade Runner", price: 750000, category: "sunglass", image: px("30989278"),
    gallery: [px("30989278"), px("28484979")], sizes: ["Freesize"], colors: ["Black"],
    tags: ["Unisex", "Accessory", "Casual"], shortDescription: "Kính râm gọng vuông nhẹ với thiết kế casual hiện đại.",
    description: "Kính râm gọng vuông nhẹ, tròng tối và thiết kế gọn cho phong cách casual hiện đại.",
    details: { material: "Acetate blend", fit: "Freesize", style: "Unisex / Casual", care: "Lau bằng khăn mềm", origin: "Designed by WEARO" }, sku: "WR-EYE-SHR"
  },
];

export function getProduct(id: string) { return PRODUCTS.find((p) => p.id === id); }
export function formatVnd(value: number) { return formatPrice(value); }
