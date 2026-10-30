import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MarkdownDescriptionEditor } from "@/components/markdown-description";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addProductImage,
  createProductVariant,
  deleteProduct,
  deleteProductVariant,
  getProduct,
  listProductImages,
  listProductVariants,
  deleteProductImage,
  setPrimaryProductImage,
  suggestProductColorName,
  updateProduct,
  uploadProductImage,
  updateProductVariant,
  type Product,
  type ProductImage,
  type ProductVariant,
} from "@/lib/upthink-supabase";

export const Route = createFileRoute("/admin/products/$id/")({
  component: ProductDetailPage,
  head: () => ({ meta: [{ title: "Product Detail — UpThink" }] }),
});

type ProductForm = {
  name: string;
  slug: string;
  category: string;
  price: string;
  short_description: string;
  long_description: string;
  status: Product["status"];
  featured: boolean;
  new_arrival: boolean;
  fashion_style: string;
  gender: "Male" | "Female" | "Unisex";
};

type VariantForm = {
  size: string;
  color: string;
  sku: string;
  stock: string;
};

const categories = ["hoodies", "tees", "outerwear", "pants", "cap", "sunglass", "accessories"];
const sizes = ["S", "M", "L", "XL", "Freesize"];
const colors = ["Black", "White", "Cream", "Beige", "Ivory", "Charcoal", "Cement", "Moss", "Electric"];
const emptyVariant: VariantForm = { size: "", color: "", sku: "", stock: "0" };

const namedColors: Record<string, { name: string; hex: string }> = {
  "#111111": { name: "Black", hex: "#111111" },
  "#FFFFFF": { name: "White", hex: "#FFFFFF" },
  "#FFFDD0": { name: "Cream", hex: "#FFFDD0" },
  "#D8C2A4": { name: "Beige", hex: "#D8C2A4" },
  "#F4F0DF": { name: "Ivory", hex: "#F4F0DF" },
  "#4B4B4B": { name: "Charcoal", hex: "#4B4B4B" },
  "#8B8B83": { name: "Cement", hex: "#8B8B83" },
  "#68745B": { name: "Moss", hex: "#68745B" },
  "#3155FF": { name: "Electric", hex: "#3155FF" },
  "#AA6200": { name: "Mai Tai", hex: "#AA6200" },
};

function normalizeHex(value: string) {
  const raw = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toUpperCase()}`;
}

function colorNameFromHex(hex: string) {
  const normalized = normalizeHex(hex);
  if (!normalized) return "Mã màu không hợp lệ";
  return namedColors[normalized]?.name ?? `Màu tùy chỉnh ${normalized}`;
}

function colorLabelFromHex(hex: string) {
  const normalized = normalizeHex(hex);
  if (!normalized) return "";
  const named = namedColors[normalized];
  return named ? (named.name === "Cream" ? "Cream" : named.name) : `${colorNameFromHex(normalized)} (${normalized})`;
}

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
}

function colorValue(color: string) {
  const hexInLabel = color.match(/#([0-9a-fA-F]{6})/);
  if (hexInLabel) return `#${hexInLabel[1].toUpperCase()}`;
  const values: Record<string, string> = {
    Black: "#111111",
    White: "#ffffff",
    Cream: "#FFFDD0",
    Beige: "#d8c2a4",
    Ivory: "#f4f0df",
    Charcoal: "#4b4b4b",
    Cement: "#8b8b83",
    Moss: "#68745b",
    Electric: "#3155ff",
  };
  return values[color] ?? "#b5b5b5";
}

function stockMeta(stock: number) {
  if (stock === 0) return { label: "HẾT HÀNG", className: "out" };
  if (stock <= 5) return { label: "SẮP HẾT", className: "low" };
  return { label: "CÒN HÀNG", className: "in" };
}

function ProductDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imageActionId, setImageActionId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [makeUploadedPrimary, setMakeUploadedPrimary] = useState(true);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm>(emptyVariant);
  const [variantColorHex, setVariantColorHex] = useState("#FFFDD0");
  const [variantColorHexInput, setVariantColorHexInput] = useState("#FFFDD0");
  const [suggestingColorName, setSuggestingColorName] = useState(false);
  const [generatorCustomHex, setGeneratorCustomHex] = useState("#FFFDD0");
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatorSizes, setGeneratorSizes] = useState<string[]>([]);
  const [generatorColors, setGeneratorColors] = useState<string[]>([]);
  const [generatorStock, setGeneratorStock] = useState("0");
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productData, variantData, imageData] = await Promise.all([getProduct(id), listProductVariants(id), listProductImages(id)]);
      if (!productData) {
        setProduct(null);
        setForm(null);
        setVariants([]);
        setError("Không tìm thấy sản phẩm.");
        return;
      }
      setProduct(productData);
      setVariants(variantData);
      setImages(imageData);
      setForm({
        name: productData.name,
        slug: productData.slug,
        category: productData.category,
        price: String(productData.price),
        short_description: productData.short_description ?? "",
        long_description: productData.long_description ?? "",
        status: productData.status,
        featured: productData.featured,
        new_arrival: productData.new_arrival ?? false,
        fashion_style: productData.fashion_style ?? "Casual",
        gender: productData.gender ?? "Unisex",
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const inventory = useMemo(() => {
    const low = variants.filter((variant) => variant.stock > 0 && variant.stock <= 5).length;
    const out = variants.filter((variant) => variant.stock === 0).length;
    return { total: variants.reduce((sum, variant) => sum + variant.stock, 0), low, out };
  }, [variants]);

  const generatorPreview = useMemo(() => {
    const existing = new Set(variants.map((variant) => `${variant.size.toLowerCase()}::${variant.color.toLowerCase()}`));
    return generatorSizes.flatMap((size) => generatorColors
      .filter((color) => !existing.has(`${size.toLowerCase()}::${color.toLowerCase()}`))
      .map((color) => ({ size, color })));
  }, [generatorSizes, generatorColors, variants]);

  const statusLabel = product?.status === "published" ? (product.active ? "Đang hoạt động" : "Đã ẩn") : product?.status === "draft" ? "Bản nháp" : "Trong thùng rác";
  const hasUnsavedChanges = useMemo(() => {
    if (!product || !form) return false;
    return form.name !== product.name
      || form.slug !== product.slug
      || form.category !== product.category
      || form.price !== String(product.price)
      || form.short_description !== (product.short_description ?? "")
      || form.long_description !== (product.long_description ?? "")
      || form.status !== product.status
      || form.featured !== product.featured
      || form.new_arrival !== (product.new_arrival ?? false)
      || form.fashion_style !== (product.fashion_style ?? "Casual")
      || form.gender !== (product.gender ?? "Unisex");
  }, [form, product]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  function resetProductForm() {
    if (!product) return;
    setForm({
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: String(product.price),
      short_description: product.short_description ?? "",
      long_description: product.long_description ?? "",
      status: product.status,
      featured: product.featured,
      new_arrival: product.new_arrival ?? false,
      fashion_style: product.fashion_style ?? "Casual",
      gender: product.gender ?? "Unisex",
    });
    setError("");
    setMessage("Đã hoàn tác các thay đổi chưa lưu.");
  }

  function confirmLeaveIfDirty(event: React.MouseEvent<HTMLAnchorElement>) {
    if (hasUnsavedChanges && !window.confirm("Bạn có thay đổi chưa lưu. Rời trang sẽ làm mất các thay đổi này. Bạn vẫn muốn tiếp tục?")) {
      event.preventDefault();
    }
  }

  function resetVariantForm() {
    setEditingVariant(null);
    setVariantForm(emptyVariant);
    setVariantColorHex("#FFFDD0");
    setVariantColorHexInput("#FFFDD0");
  }

  function startEditVariant(variant: ProductVariant) {
    setEditingVariant(variant);
    setVariantForm({ size: variant.size, color: variant.color, sku: variant.sku ?? "", stock: String(variant.stock) });
    const existingHex = variant.color.match(/#([0-9a-fA-F]{6})/)?.[0] ?? colorValue(variant.color);
    const normalizedHex = normalizeHex(existingHex) ?? "#FFFDD0";
    setVariantColorHex(normalizedHex);
    setVariantColorHexInput(normalizedHex);
    setMessage("");
    setError("");
  }

  async function handleSuggestColorName() {
    const hex = normalizeHex(variantColorHexInput);
    if (!hex) {
      setError("Vui lòng nhập mã HEX hợp lệ gồm 6 ký tự, ví dụ #2F7F57.");
      return;
    }
    setSuggestingColorName(true);
    setError("");
    setMessage("");
    try {
      const suggestion = await suggestProductColorName(hex);
      setVariantColorHex(hex);
      setVariantColorHexInput(hex);
      setVariantForm((current) => ({ ...current, color: `${suggestion.name} (${hex})` }));
      setMessage(`Đã gợi ý tên màu “${suggestion.name}” từ ${suggestion.source === "wearo" ? "thư viện màu WEARO" : "The Color API"}. Bạn có thể chỉnh sửa trước khi lưu.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể gợi ý tên màu.");
    } finally {
      setSuggestingColorName(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!files.length || !product) return;

    const invalid = files.find((file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024);
    if (invalid) {
      setError(!invalid.type.startsWith("image/") ? "Vui lòng chỉ chọn tệp ảnh." : `Ảnh "${invalid.name}" vượt quá 10 MB.`);
      return;
    }

    setUploadingImages(true);
    setMessage("");
    setError("");
    try {
      let nextSortOrder = images.reduce((max, image) => Math.max(max, Number(image.sort_order) || 0), -1) + 1;
      let firstUploaded: ProductImage | null = null;
      for (const file of files) {
        const imageUrl = await uploadProductImage(id, file);
        const created = await addProductImage(id, imageUrl, false, nextSortOrder++);
        if (!firstUploaded) firstUploaded = created;
      }

      if (firstUploaded && (makeUploadedPrimary || !images.some((image) => image.is_primary))) {
        await setPrimaryProductImage(id, firstUploaded.id!);
        await updateProduct(id, { image: firstUploaded.image_url });
      }
      await load();
      setMessage(`Đã tải lên ${files.length} ảnh sản phẩm.${firstUploaded && (makeUploadedPrimary || !images.some((image) => image.is_primary)) ? " Ảnh đầu tiên đã được đặt làm ảnh chính." : ""}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải ảnh sản phẩm lên.");
      await load();
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleImageDelete(image: ProductImage) {
    if (!image.id) return setError("Ảnh này thiếu ID nên không thể xóa an toàn.");
    if (!window.confirm("Xóa ảnh sản phẩm này khỏi thư viện ảnh? Thao tác này không thể hoàn tác.")) return;
    setImageActionId(image.id); setMessage(""); setError("");
    try {
      const remaining = images.filter((item) => item.id !== image.id);
      if (image.is_primary || product?.image === image.image_url) {
        const nextPrimary = remaining[0];
        if (nextPrimary?.id) {
          await setPrimaryProductImage(id, nextPrimary.id);
          await updateProduct(id, { image: nextPrimary.image_url });
          setImages(remaining.map((item) => ({ ...item, is_primary: item.id === nextPrimary.id })));
          setProduct((current) => current ? { ...current, image: nextPrimary.image_url } : current);
        } else {
          await updateProduct(id, { image: null });
          setProduct((current) => current ? { ...current, image: null } : current);
        }
      }
      const deletion = await deleteProductImage(image.id);
      setImages(remaining);
      setMessage(deletion.storageCleanup === "failed"
        ? "Đã xóa ảnh khỏi thư viện, nhưng chưa xóa được file Storage. Có thể cần dọn file này thủ công."
        : deletion.storageCleanup === "retained"
          ? "Đã xóa bản ghi ảnh; file được giữ lại vì vẫn còn tham chiếu."
          : "Đã xóa ảnh khỏi thư viện ảnh sản phẩm.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xóa ảnh sản phẩm.");
      await load();
    } finally { setImageActionId(null); }
  }

  async function handleSetPrimaryImage(image: ProductImage) {
    if (!image.id || !product) return;
    setImageActionId(image.id); setMessage(""); setError("");
    try {
      await setPrimaryProductImage(id, image.id);
      await updateProduct(id, { image: image.image_url });
      setImages((current) => current.map((item) => ({ ...item, is_primary: item.id === image.id })));
      setProduct((current) => current ? { ...current, image: image.image_url } : current);
      setMessage("Đã đặt ảnh chính cho sản phẩm.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đổi ảnh chính.");
      await load();
    } finally { setImageActionId(null); }
  }

  async function handleProductSave(event: React.FormEvent) {
    event.preventDefault();
    if (!product || !form) return;
    const name = form.name.trim();
    const slug = form.slug.trim();
    const price = Number(form.price);
    if (!name) return setError("Vui lòng nhập tên sản phẩm.");
    if (!slug) return setError("Vui lòng nhập slug.");
    if (!Number.isFinite(price) || !Number.isInteger(price) || price < 1000) return setError("Giá tối thiểu là 1.000 ₫. Vui lòng nhập giá từ 1000 trở lên.");

    setSaving(true); setMessage(""); setError("");
    try {
      const updated = await updateProduct(product.id, {
        name,
        slug,
        category: form.category,
        price,
        short_description: form.short_description.trim() || null,
        long_description: form.long_description.trim() || null,
        description: form.long_description.trim() || form.short_description.trim() || null,
        status: form.status,
        active: form.status === "published",
        featured: form.featured,
        new_arrival: form.new_arrival,
        fashion_style: form.fashion_style,
        gender: form.gender,
      });
      const savedProduct = updated ?? {
        ...product,
        name,
        slug,
        category: form.category,
        price,
        short_description: form.short_description.trim() || null,
        long_description: form.long_description.trim() || null,
        description: form.long_description.trim() || form.short_description.trim() || null,
        status: form.status,
        active: form.status === "published",
        featured: form.featured,
        new_arrival: form.new_arrival,
        fashion_style: form.fashion_style,
        gender: form.gender,
      };
      setProduct(savedProduct);
      setForm({
        name: savedProduct.name,
        slug: savedProduct.slug,
        category: savedProduct.category,
        price: String(savedProduct.price),
        short_description: savedProduct.short_description ?? "",
        long_description: savedProduct.long_description ?? "",
        status: savedProduct.status,
        featured: savedProduct.featured,
        new_arrival: savedProduct.new_arrival ?? false,
        fashion_style: savedProduct.fashion_style ?? "Casual",
        gender: savedProduct.gender ?? "Unisex",
      });
      setMessage("Đã lưu thay đổi sản phẩm.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể cập nhật sản phẩm.");
    } finally { setSaving(false); }
  }

  async function handleProductDelete() {
    if (!product) return;
    const unsavedWarning = hasUnsavedChanges ? "\n\nLưu ý: các thay đổi chưa lưu sẽ bị bỏ." : "";
    if (!window.confirm(`Chuyển "${product.name}" vào thùng rác?\n\nSản phẩm sẽ bị ẩn khỏi cửa hàng nhưng vẫn được giữ trong database để bảo toàn lịch sử. Bạn có thể khôi phục từ danh sách sản phẩm.${unsavedWarning}\n\nBạn có chắc muốn tiếp tục?`)) return;
    setDeleting(true); setMessage(""); setError("");
    try {
      await deleteProduct(product.id);
      await navigate({ to: "/admin/products" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể ẩn sản phẩm.");
    } finally { setDeleting(false); }
  }

  async function handleVariantSubmit(event: React.FormEvent) {
    event.preventDefault();
    const size = variantForm.size.trim();
    const color = variantForm.color.trim();
    const sku = variantForm.sku.trim();
    const stock = Number(variantForm.stock);
    if (!size) return setError("Vui lòng chọn Size.");
    if (!color) return setError("Vui lòng chọn Color.");
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock phải là số nguyên từ 0 trở lên.");

    setSaving(true); setMessage(""); setError("");
    try {
      if (editingVariant) {
        await updateProductVariant(editingVariant.id, { size, color, sku: sku || null, stock });
        setMessage("Đã cập nhật variant và tồn kho.");
      } else {
        await createProductVariant({ product_id: id, size, color, sku: sku || null, stock });
        setMessage("Đã tạo variant.");
      }
      resetVariantForm();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu variant.");
    } finally { setSaving(false); }
  }

  async function handleGenerateVariants() {
    if (!product) return;
    if (!generatorSizes.length || !generatorColors.length) {
      setError("Hãy chọn ít nhất một size và một màu để tạo ma trận variant.");
      return;
    }
    const stock = Number(generatorStock);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Tồn kho mặc định phải là số nguyên từ 0 trở lên.");
      return;
    }

    const existing = new Set(variants.map((variant) => `${variant.size.toLowerCase()}::${variant.color.toLowerCase()}`));
    const combos = generatorSizes.flatMap((size) => generatorColors
      .filter((color) => !existing.has(`${size.toLowerCase()}::${color.toLowerCase()}`))
      .map((color) => ({ size, color })));
    if (!combos.length) {
      setMessage("Các tổ hợp đã chọn đều tồn tại. Không có variant trùng được tạo.");
      setError("");
      return;
    }

    const skuBase = (product.slug || product.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    const colorCode = (color: string) => color.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 4) || "COLOR";
    setGeneratingVariants(true); setError(""); setMessage("");
    let created = 0;
    const failures: string[] = [];
    try {
      for (const combo of combos) {
        try {
          await createProductVariant({
            product_id: id,
            size: combo.size,
            color: combo.color,
            sku: `${skuBase}-${colorCode(combo.color)}-${combo.size.toUpperCase().replace(/[^A-Z0-9]+/g, "")}`,
            stock,
          });
          created += 1;
        } catch (cause) {
          failures.push(`${combo.size}/${combo.color}: ${cause instanceof Error ? cause.message : "Lỗi không xác định"}`);
        }
      }
      await load();
      if (failures.length) {
        setError(`Đã tạo ${created}/${combos.length} variant. Một số tổ hợp chưa tạo được: ${failures.slice(0, 3).join("; ")}`);
      } else {
        setMessage(`Đã tạo ${created} variant; bỏ qua các tổ hợp đã tồn tại. Hãy kiểm tra SKU trước khi đưa sản phẩm lên cửa hàng.`);
        setGeneratorOpen(false);
      }
    } finally {
      setGeneratingVariants(false);
    }
  }

  async function handleVariantDelete(variant: ProductVariant) {
    if (!window.confirm(`Xóa variant ${variant.size} / ${variant.color}?`)) return;
    setSaving(true); setMessage(""); setError("");
    try {
      await deleteProductVariant(variant.id);
      if (editingVariant?.id === variant.id) resetVariantForm();
      setMessage("Đã xóa variant.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xóa variant.");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="up-admin-empty">Đang tải thông tin sản phẩm…</div>;

  if (!product || !form) {
    return <div><header className="up-admin-topbar"><div><div className="up-admin-kicker">CATALOG / PRODUCT</div><h1>Không tìm thấy sản phẩm</h1><p>{error || "Sản phẩm không tồn tại."}</p></div><Link className="up-admin-primary" to="/admin/products">← SẢN PHẨM</Link></header></div>;
  }

  return (
    <div>
      <header className="up-admin-topbar">
        <div>
          <div className="up-admin-kicker">CATALOG / PRODUCT DETAIL</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link className="up-admin-secondary" to="/admin/products" onClick={confirmLeaveIfDirty}>← SẢN PHẨM</Link>
          <Link className="up-admin-primary" to="/product/$id" params={{ id: product.id }} onClick={confirmLeaveIfDirty}>XEM TRÊN CỬA HÀNG ↗</Link>
        </div>
      </header>

      {error && <div className="up-admin-toast" role="alert">{error}</div>}
      {message && <div className="up-admin-toast" role="status">{message}</div>}

      <section className="up-admin-editor">
        <div className="up-editor-head">
          <div><div className="up-admin-kicker">THÔNG TIN SẢN PHẨM</div><h2>Thông tin sản phẩm</h2><p>Chỉnh sửa thông tin, hình ảnh, biến thể và tồn kho cho sản phẩm này.</p></div>
          <span className={`up-status ${product.status}`}>{statusLabel}</span>
        </div>
        <div className="up-editor-grid">
          <div className="up-editor-left">
            <div className="up-upload-card">
              {product.image ? <img src={product.image} alt={product.name} /> : <div><b>NO IMAGE</b><span>Sản phẩm chưa có ảnh</span></div>}
            </div>
            <section className="up-product-image-manager" aria-label="Quản lý ảnh sản phẩm">
              <div className="up-product-image-manager__head">
                <div><strong>ẢNH SẢN PHẨM</strong><span>{images.length} ảnh đã lưu</span></div>
                <small>Chọn ảnh chính hoặc xóa ảnh không còn sử dụng.</small>
              </div>
              <div className="up-product-image-upload">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  hidden
                  onChange={(event) => void handleImageUpload(event)}
                  disabled={uploadingImages || saving || deleting}
                />
                <div className="up-product-image-upload__controls">
                  <button type="button" className="up-admin-primary" onClick={() => imageInputRef.current?.click()} disabled={uploadingImages || saving || deleting}>
                    {uploadingImages ? "ĐANG TẢI ẢNH…" : "＋ THÊM ẢNH MỚI"}
                  </button>
                  <label className="up-product-image-upload__primary">
                    <input type="checkbox" checked={makeUploadedPrimary} onChange={(event) => setMakeUploadedPrimary(event.target.checked)} disabled={uploadingImages || saving || deleting} />
                    Đặt ảnh đầu tiên vừa tải làm ảnh chính
                  </label>
                </div>
                <small>PNG, JPG, WEBP hoặc GIF · tối đa 10 MB/ảnh. Muốn thay ảnh cũ, tải ảnh mới lên rồi xóa ảnh cũ bên dưới.</small>
              </div>
              {images.length ? <div className="up-product-image-grid">
                {images.map((image, index) => <article className="up-product-image-item" key={image.id ?? image.image_url}>
                  <div className="up-product-image-item__preview"><img src={image.image_url} alt={image.alt_text || product.name + " - ảnh " + (index + 1)} loading="lazy" />{image.is_primary && <span className="up-product-image-primary-badge">ẢNH CHÍNH</span>}</div>
                  <div className="up-product-image-item__actions">
                    <details className="up-product-image-actions-menu">
                      <summary aria-label={`Thao tác ảnh ${index + 1}`}>Thao tác ảnh <span aria-hidden="true">⌄</span></summary>
                      <div className="up-product-image-actions-menu__items">
                        {!image.is_primary && <button type="button" className="up-row-action" onClick={() => void handleSetPrimaryImage(image)} disabled={Boolean(imageActionId) || saving || deleting}>Đặt làm ảnh chính</button>}
                        <button type="button" className="up-row-action up-row-action-danger" onClick={() => void handleImageDelete(image)} disabled={Boolean(imageActionId) || saving || deleting}>{imageActionId === image.id ? "Đang xử lý…" : "Xóa ảnh"}</button>
                      </div>
                    </details>
                  </div>
                </article>)}
              </div> : <p className="up-product-image-manager__empty">Chưa có ảnh trong bảng thư viện ảnh của sản phẩm. Ảnh đại diện hiện tại vẫn được hiển thị ở khung phía trên nếu có.</p>}
            </section>
          </div>
          <form className="up-editor-right" onSubmit={handleProductSave}>
            <section className="up-product-form-section" aria-labelledby="product-basic-heading">
              <div className="up-product-form-section__heading"><h3 id="product-basic-heading">1. Thông tin cơ bản</h3><p>Tên và đường dẫn định danh của sản phẩm.</p></div>
            <label>Tên sản phẩm<input value={form.name} onChange={(e) => setForm((c) => c && ({ ...c, name: e.target.value }))} disabled={saving || deleting} /></label>
            <label>Slug<input value={form.slug} onChange={(e) => setForm((c) => c && ({ ...c, slug: e.target.value }))} disabled={saving || deleting} /></label>
            </section>
            <section className="up-product-form-section" aria-labelledby="product-catalog-heading">
              <div className="up-product-form-section__heading"><h3 id="product-catalog-heading">2. Giá & phân loại</h3><p>Thông tin giúp khách hàng tìm đúng sản phẩm.</p></div>
            <div className="up-two-col">
              <label>Danh mục<select value={form.category} onChange={(e) => setForm((c) => c && ({ ...c, category: e.target.value }))} disabled={saving || deleting}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Giới tính<select value={form.gender} onChange={(e) => setForm((c) => c && ({ ...c, gender: e.target.value as ProductForm["gender"] }))} disabled={saving || deleting}><option value="Male">Nam (Male)</option><option value="Female">Nữ (Female)</option><option value="Unisex">Unisex</option></select><small className="up-style-helper">Hiển thị giới tính trên trang sản phẩm.</small></label>
              <label>Giá (VND)<input type="number" min="1000" step="1" required aria-describedby="product-price-minimum" value={form.price} onChange={(e) => setForm((c) => c && ({ ...c, price: e.target.value }))} disabled={saving || deleting} /><small id="product-price-minimum">Giá tối thiểu: 1.000 ₫.</small></label>
            </div>
            </section>
            <section className="up-product-form-section" aria-labelledby="product-content-heading">
              <div className="up-product-form-section__heading"><h3 id="product-content-heading">3. Nội dung</h3><p>Mô tả ngắn hiển thị nhanh; mô tả chi tiết cung cấp thêm thông tin.</p></div>
            <label>Mô tả ngắn<textarea rows={3} value={form.short_description} onChange={(e) => setForm((c) => c && ({ ...c, short_description: e.target.value }))} disabled={saving || deleting} /></label>
            <label>Mô tả chi tiết<MarkdownDescriptionEditor value={form.long_description} onChange={(value) => setForm((c) => c && ({ ...c, long_description: value }))} disabled={saving || deleting} rows={7} /></label>
            </section>
            <section className="up-product-form-section" aria-labelledby="product-display-heading">
              <div className="up-product-form-section__heading"><h3 id="product-display-heading">4. Hiển thị trên cửa hàng</h3><p>Kiểm soát trạng thái xuất bản và các nhãn sản phẩm.</p></div>
            <label>Trạng thái<select value={form.status} onChange={(e) => setForm((c) => c && ({ ...c, status: e.target.value as Product["status"] }))} disabled={saving || deleting}><option value="draft">Bản nháp</option><option value="published">Đang hoạt động</option><option value="archived">Đã ẩn</option></select></label>
            <label>Phong cách thời trang<select value={form.fashion_style} onChange={(e) => setForm((current) => current && ({ ...current, fashion_style: e.target.value }))} disabled={saving || deleting}><option value="Casual">Casual</option><option value="Basic">Basic</option><option value="Streetwear">Streetwear</option><option value="Outerwear">Outerwear</option></select><small className="up-style-helper">Phong cách được lưu cùng sản phẩm.</small></label>
            <label className="up-check up-new-arrival-check"><input type="checkbox" checked={form.new_arrival} onChange={(e) => setForm((current) => current && ({ ...current, new_arrival: e.target.checked }))} disabled={saving || deleting} /><span><strong>Hàng mới (New Arrival)</strong><small>Gắn nhãn “New Arrival” trên thẻ sản phẩm ở cửa hàng.</small></span></label>
            <label className="up-check"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((c) => c && ({ ...c, featured: e.target.checked }))} disabled={saving || deleting} />Sản phẩm nổi bật</label>
            </section>
            <div className="up-editor-actions up-editor-actions--sticky">
              <div className="up-editor-save-state" aria-live="polite">
                {saving ? <><span className="up-save-state-dot" />Đang lưu…</> : hasUnsavedChanges ? <><span className="up-save-state-dot is-dirty" />Có thay đổi chưa lưu</> : <><span className="up-save-state-dot is-saved" />Đã lưu</>}
              </div>
              <div className="up-editor-save-buttons">
                <button className="up-admin-secondary" type="button" onClick={resetProductForm} disabled={!hasUnsavedChanges || saving || deleting}>Hoàn tác</button>
                <button className="up-admin-primary" type="submit" disabled={!hasUnsavedChanges || saving || deleting}>{saving ? "ĐANG LƯU…" : "LƯU THAY ĐỔI"}</button>
              </div>
            </div>
          </form>
        </div>
        <section className="up-product-danger-zone" aria-labelledby="product-danger-heading">
          <div><h3 id="product-danger-heading">Vùng thao tác nguy hiểm</h3><p>Chuyển sản phẩm vào thùng rác sẽ ẩn sản phẩm khỏi cửa hàng. Dữ liệu được giữ lại để có thể khôi phục.</p></div>
          <button className="up-row-action up-row-action-danger" type="button" onClick={() => void handleProductDelete()} disabled={saving || deleting}>{deleting ? "ĐANG CHUYỂN…" : "CHUYỂN VÀO THÙNG RÁC"}</button>
        </section>
      </section>

      <section className="up-admin-stats" aria-label="Tổng quan biến thể và tồn kho">
        <div><span>BIẾN THỂ</span><strong>{variants.length}</strong></div>
        <div><span>TỔNG TỒN KHO</span><strong>{inventory.total}</strong></div>
        <div><span>SẮP HẾT (1–5)</span><strong>{inventory.low}</strong></div>
        <div><span>HẾT HÀNG</span><strong>{inventory.out}</strong></div>
      </section>

      <section className="up-admin-table-wrap up-variant-generator" style={{ marginBottom: 16 }}>
        <div className="up-variant-generator__header">
          <div><div className="up-admin-kicker">TẠO BIẾN THỂ HÀNG LOẠT</div><h2>Tạo biến thể hàng loạt</h2><p>Chọn size và màu để tạo các tổ hợp còn thiếu; hệ thống bỏ qua biến thể đã tồn tại.</p></div>
          <button className="up-row-action" type="button" onClick={() => setGeneratorOpen((open) => !open)} aria-expanded={generatorOpen}>{generatorOpen ? "ĐÓNG" : "MỞ BỘ TẠO"}</button>
        </div>
        {generatorOpen && <form className="up-variant-generator__form" onSubmit={(event) => { event.preventDefault(); void handleGenerateVariants(); }}>
          <fieldset><legend>SIZE</legend><div className="up-variant-options">{sizes.map((size) => <label key={size}><input type="checkbox" checked={generatorSizes.includes(size)} onChange={(event) => setGeneratorSizes((current) => event.target.checked ? [...current, size] : current.filter((value) => value !== size))} disabled={generatingVariants || saving || deleting} />{size}</label>)}</div></fieldset>
          <fieldset><legend>MÀU SẮC</legend><div className="up-variant-options">{colors.map((color) => <label key={color}><input type="checkbox" checked={generatorColors.includes(color)} onChange={(event) => setGeneratorColors((current) => event.target.checked ? [...current, color] : current.filter((value) => value !== color))} disabled={generatingVariants || saving || deleting} /><i style={{ background: colorValue(color) }} />{color}</label>)}</div>
            <div className="up-variant-custom-color" style={{ display: "grid", gridTemplateColumns: "36px minmax(0,1fr) auto", gap: 8, alignItems: "center", marginTop: 12 }}>
              <input aria-label="Chọn màu tùy chỉnh cho ma trận" type="color" value={generatorCustomHex} onChange={(e) => setGeneratorCustomHex(e.target.value.toUpperCase())} disabled={generatingVariants || saving || deleting} style={{ width: 36, height: 36, padding: 2 }} />
              <div><strong>{colorNameFromHex(generatorCustomHex)}</strong><small style={{ display: "block" }}>{generatorCustomHex}</small></div>
              <button className="up-row-action" type="button" onClick={() => setGeneratorColors((current) => current.includes(colorLabelFromHex(generatorCustomHex)) ? current : [...current, colorLabelFromHex(generatorCustomHex)])} disabled={generatingVariants || saving || deleting || generatorColors.includes(colorLabelFromHex(generatorCustomHex))}>THÊM MÀU</button>
            </div>
          </fieldset>
          <label className="up-variant-generator__stock">Tồn kho ban đầu cho mỗi SKU<input type="number" min="0" step="1" value={generatorStock} onChange={(event) => setGeneratorStock(event.target.value)} disabled={generatingVariants || saving || deleting} /></label>
          <div className="up-variant-generator__footer"><div className="up-variant-preview"><strong>{generatorPreview.length} tổ hợp mới sẽ được tạo</strong><div className="up-variant-preview__chips">{generatorPreview.slice(0, 8).map((combo) => <span key={`${combo.size}-${combo.color}`}>{combo.size} / {combo.color}</span>)}{generatorPreview.length > 8 && <span>+{generatorPreview.length - 8} tổ hợp khác</span>}</div><small>Không tạo lại tổ hợp size/màu đã tồn tại. Hãy kiểm tra số lượng trước khi áp dụng.</small></div><button className="up-admin-primary" type="submit" disabled={generatingVariants || saving || deleting || !generatorPreview.length}>{generatingVariants ? "ĐANG TẠO…" : "TẠO BIẾN THỂ"}</button></div>
        </form>}
      </section>

      <section className="up-admin-table-wrap" style={{ marginBottom: 24 }}>
        <div style={{ padding: 20, borderBottom: "1px solid #e5e7eb" }}>
          <div className="up-admin-kicker">BIẾN THỂ & TỒN KHO</div>
          <h2 style={{ margin: "4px 0 0" }}>{editingVariant ? "Chỉnh sửa biến thể" : "Thêm biến thể"}</h2>
          <p style={{ margin: "6px 0 0", opacity: 0.65 }}>Mỗi biến thể là một tổ hợp size và màu. SKU dùng để định danh biến thể; tồn kho là số lượng có thể bán.</p>
        </div>

        <form onSubmit={handleVariantSubmit} className="up-variant-form">
          <label>KÍCH CỠ<select value={variantForm.size} onChange={(e) => setVariantForm((c) => ({ ...c, size: e.target.value }))} disabled={saving || deleting}><option value="">Chọn size</option>{sizes.map((size) => <option key={size}>{size}</option>)}</select></label>
          <label>MÀU SẮC
            <select value={colors.includes(variantForm.color) ? variantForm.color : (variantForm.color ? "__custom__" : "")} onChange={(e) => {
              const value = e.target.value;
              if (value === "__custom__") return;
              if (value) {
                const hex = colorValue(value).toUpperCase();
                setVariantForm((c) => ({ ...c, color: value }));
                setVariantColorHex(hex);
                setVariantColorHexInput(hex);
              } else setVariantForm((c) => ({ ...c, color: "" }));
            }} disabled={saving || deleting}>
              <option value="">Chọn màu có sẵn</option>
              {colors.map((color) => <option key={color} value={color}>{color}</option>)}
              {variantForm.color && !colors.includes(variantForm.color) && <option value="__custom__">Màu tùy chỉnh</option>}
            </select>
            <span className="up-variant-color-picker" style={{ display: "grid", gridTemplateColumns: "42px minmax(0,1fr)", gap: 10, alignItems: "center", marginTop: 10 }}>
              <input aria-label="Chọn màu bằng bảng màu" type="color" value={variantColorHex} onChange={(e) => {
                const hex = e.target.value.toUpperCase();
                setVariantColorHex(hex);
                setVariantColorHexInput(hex);
                setVariantForm((current) => ({ ...current, color: colorLabelFromHex(hex) }));
              }} disabled={saving || deleting} style={{ width: 42, height: 42, padding: 3, border: "1px solid #D1D5DB", borderRadius: 6, background: "#fff", cursor: "pointer" }} />
              <input aria-label="Mã màu HEX" value={variantColorHexInput} onChange={(e) => {
                const input = e.target.value.toUpperCase();
                setVariantColorHexInput(input);
                const hex = normalizeHex(input);
                if (hex) {
                  setVariantColorHex(hex);
                  setVariantForm((current) => ({ ...current, color: colorLabelFromHex(hex) }));
                }
              }} onBlur={() => {
                const hex = normalizeHex(variantColorHexInput);
                if (hex) setVariantColorHexInput(hex);
              }} placeholder="#2F7F57" disabled={saving || deleting || suggestingColorName} />
            </span>
            {variantForm.color && <span className="up-variant-color-preview" style={{ display: "block", marginTop: 8, background: colorValue(variantForm.color), color: ["#FFFFFF", "#FFFDD0", "#F5F5DC", "#FFFFF0"].includes(colorValue(variantForm.color).toUpperCase()) ? "#263238" : "#FFFFFF", padding: "12px 10px", borderRadius: 4, fontWeight: 700 }}>
              <small style={{ display: "block", fontSize: 10, letterSpacing: ".08em", opacity: .8 }}>YOUR MIX</small>
              <strong style={{ display: "block", fontSize: 16 }}>{variantColorHex}</strong>
              <span style={{ display: "block", fontSize: 12 }}>{colorNameFromHex(variantColorHex)}</span>
            </span>}
            <button type="button" className="up-row-action" onClick={() => void handleSuggestColorName()} disabled={saving || deleting || suggestingColorName || !normalizeHex(variantColorHexInput)} style={{ marginTop: 8 }}>
              {suggestingColorName ? "ĐANG TÌM TÊN MÀU…" : "GỢI Ý TÊN TỪ HEX"}
            </button>
            <small>Nhập mã HEX rồi gợi ý tên. WEARO ưu tiên tên đã dùng trong các biến thể hiện có, sau đó tra The Color API. Tên gợi ý vẫn có thể chỉnh sửa; mã HEX được giữ kèm tên.</small>
          </label>
          <label>MÃ SKU<input value={variantForm.sku} onChange={(e) => setVariantForm((c) => ({ ...c, sku: e.target.value }))} placeholder="FD-TEE-BLK-M" disabled={saving || deleting} /></label>
          <label>TỒN KHO<input type="number" min="0" step="1" value={variantForm.stock} onChange={(e) => setVariantForm((c) => ({ ...c, stock: e.target.value }))} disabled={saving || deleting} /></label>
          <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
            <button className="up-admin-primary" type="submit" disabled={saving || deleting}>{saving ? "ĐANG LƯU…" : editingVariant ? "LƯU" : "THÊM"}</button>
            {editingVariant && <button className="up-row-action" type="button" onClick={resetVariantForm} disabled={saving || deleting}>HỦY</button>}
          </div>
        </form>
      </section>

      <section className="up-admin-table-wrap">
        <table className="up-admin-table">
          <thead><tr><th>SIZE</th><th>COLOR</th><th>SKU</th><th>STOCK</th><th>TRẠNG THÁI</th><th></th></tr></thead>
          <tbody>
            {variants.length ? variants.map((variant) => {
              const meta = stockMeta(variant.stock);
              return <tr key={variant.id}>
                <td><strong>{variant.size}</strong></td>
                <td><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><i style={{ width: 16, height: 16, borderRadius: "50%", display: "inline-block", background: colorValue(variant.color), border: "1px solid #999" }} />{variant.color}</span></td>
                <td>{variant.sku || "—"}</td>
                <td><strong>{variant.stock}</strong></td>
                <td><span className={`up-status ${meta.className}`}>{meta.label}</span></td>
                <td><div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button className="up-row-action" onClick={() => startEditVariant(variant)} disabled={saving || deleting}>SỬA</button><button className="up-row-action up-row-action-danger" onClick={() => void handleVariantDelete(variant)} disabled={saving || deleting}>XÓA</button></div></td>
              </tr>;
            }) : <tr><td colSpan={6} className="up-admin-empty">Sản phẩm chưa có variant nào.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

