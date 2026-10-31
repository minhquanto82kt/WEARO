import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import "@/styles/admin-new-product.scss";
import { MarkdownDescriptionEditor } from "@/components/markdown-description";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import {
  addProductImage,
  createProduct,
  updateProduct,
  uploadProductImage,
  type Product,
} from "@/lib/upthink-supabase";

export const Route = createFileRoute("/admin/products/new/")({
  component: NewProductPage,
  head: () => ({
    meta: [{ title: "Add Product — UpThink" }],
  }),
});

const categories = [
  "hoodies",
  "tees",
  "outerwear",
  "pants",
  "cap",
  "sunglass",
  "accessories",
  "dresses",
];

const emptyForm = {
  name: "",
  slug: "",
  category: "tees",
  price: "0",
  short_description: "",
  long_description: "",
  status: "draft" as Product["status"],
  featured: false,
  new_arrival: true,
  fashion_style: "Casual",
  gender: "Unisex" as Product["gender"],
  color_mode: "single" as "single" | "multi",
  color_name: "", color_hex: "#171717",
  secondary_color_name: "", secondary_color_hex: "#F4F4F4",
  tertiary_color_name: "", tertiary_color_hex: "#B51F2A",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function NewProductPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [activePreview, setActivePreview] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function chooseImages(files?: FileList | null) {
    if (!files?.length) return;
    const incoming = Array.from(files);
    const invalid = incoming.find((file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024);
    if (invalid) {
      setMessage(!invalid.type.startsWith("image/") ? "Có tệp không phải ảnh." : `Ảnh "${invalid.name}" vượt quá 10 MB.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setImageFiles((current) => [...current, ...incoming]);
    setPreviews((current) => [...current, ...incoming.map((file) => URL.createObjectURL(file))]);
    setActivePreview((current) => current === 0 && previews.length === 0 ? 0 : current);
    setMessage("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(index: number) {
    const previewUrl = previews[index];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFiles((current) => current.filter((_, i) => i !== index));
    setPreviews((current) => current.filter((_, i) => i !== index));
    setActivePreview((current) => Math.max(0, Math.min(current > index ? current - 1 : current, previews.length - 2)));
    setMessage("");
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    if (!form.name.trim()) {
      return setMessage("Vui lòng nhập tên sản phẩm.");
    }

    const slug = form.slug.trim() || slugify(form.name);
    const price = Number(form.price);

    if (!slug) {
      return setMessage("Vui lòng nhập slug.");
    }

    if (!Number.isFinite(price) || !Number.isInteger(price) || price < 1000) {
      return setMessage("Giá tối thiểu là 1.000 ₫. Vui lòng nhập giá từ 1000 trở lên.");
    }

    setMessage("");
    setConfirmOpen(true);
  }

  async function confirmCreateProduct() {
    if (saving) return;
    const slug = form.slug.trim() || slugify(form.name);
    const price = Number(form.price);
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        slug,
        category: form.category,
        price,
        short_description: form.short_description.trim() || null,
        long_description: form.long_description.trim() || null,
        description:
          form.long_description.trim() ||
          form.short_description.trim() ||
          null,
        image: null,
        status: form.status,
        active: form.status === "published",
        featured: form.featured,
        new_arrival: form.new_arrival,
        fashion_style: form.fashion_style,
        gender: form.gender,
        color_options: form.color_name.trim() ? {
          mode: form.color_mode,
          colors: (form.color_mode === "single"
            ? [{ name: form.color_name.trim(), hex: form.color_hex }]
            : [{ name: form.color_name.trim(), hex: form.color_hex },
               ...(form.secondary_color_name.trim() ? [{ name: form.secondary_color_name.trim(), hex: form.secondary_color_hex }] : []),
               ...(form.tertiary_color_name.trim() ? [{ name: form.tertiary_color_name.trim(), hex: form.tertiary_color_hex }] : [])])
            .filter((color) => /^#[0-9A-Fa-f]{6}$/.test(color.hex)),
        } : null,
      };

      const product = await createProduct(payload);

      if (imageFiles.length > 0) {
        try {
          const uploadedUrls: string[] = [];
          for (const [index, file] of imageFiles.entries()) {
            const url = await uploadProductImage(product.id, file);
            await addProductImage(product.id, url, index === 0, index);
            uploadedUrls.push(url);
          }
          await updateProduct(product.id, { image: uploadedUrls[0] });
        } catch (imageError) {
          setMessage(
            imageError instanceof Error
              ? `Đã tạo sản phẩm nhưng upload ảnh thất bại: ${imageError.message}`
              : "Đã tạo sản phẩm nhưng upload ảnh thất bại.",
          );
          return;
        }
      }

      setConfirmOpen(false);
      await navigate({
        to: "/admin/products",
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo sản phẩm.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <header className="up-admin-topbar">
        <div>
          <div className="up-admin-kicker">CATALOG / CMS</div>
          <h1>Thêm sản phẩm</h1>
          <p>Tạo sản phẩm mới cho cửa hàng</p>
        </div>

        <Link
          className="up-admin-secondary"
          to="/admin/products"
        >
          QUAY LẠI
        </Link>
      </header>

      {message && (
        <div className="up-admin-toast">
          {message}
        </div>
      )}

      <section className="up-admin-editor">
        <div className="up-editor-head">
          <div>
            <div className="up-admin-kicker">NEW PRODUCT</div>
            <h2>Thông tin sản phẩm</h2>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="up-editor-grid"
        >
          <div className="up-editor-left">
            <label>
              Tên sản phẩm

              <input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                onBlur={() =>
                  !form.slug &&
                  setForm((current) => ({
                    ...current,
                    slug: slugify(current.name),
                  }))
                }
              />
            </label>

            <label>
              Slug

              <input
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value,
                  })
                }
              />
            </label>

            <div className="up-two-col">
              <label>
                Phong cách thời trang
                <select value={form.fashion_style} onChange={(e) => setForm({ ...form, fashion_style: e.target.value })}>
                  <option value="Casual">Casual</option>
                  <option value="Basic">Basic</option>
                  <option value="Streetwear">Streetwear</option>
                  <option value="Outerwear">Outerwear</option>
                </select>
                <small className="up-style-helper">Phong cách này được lưu cùng sản phẩm và dùng để hiển thị thông tin trên trang sản phẩm.</small>
              </label>
              <label>
                Giới tính
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Product["gender"] })}>
                  <option value="Male">Nam (Male)</option>
                  <option value="Female">Nữ (Female)</option>
                  <option value="Unisex">Unisex</option>
                </select>
                <small className="up-style-helper">Thông tin giới tính sẽ hiển thị trên trang sản phẩm.</small>
              </label>
              <label>
                Danh mục

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                >
                  {categories.map((category) => (
                    <option key={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Giá (VND)

                <input
                  type="number"
                  min="1000"
                  step="1"
                  required
                  aria-describedby="new-product-price-minimum"
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: e.target.value,
                    })
                  }
                />
                <small id="new-product-price-minimum">Giá tối thiểu: 1.000 ₫.</small>
              </label>
            </div>

            <section className="up-color-options" aria-labelledby="product-colors-heading">
              <h3 id="product-colors-heading">Màu sắc tổng quan</h3>
              <p>Màu dùng để giới thiệu sản phẩm; màu và tồn kho bán thực tế được quản lý riêng theo biến thể.</p>
              <label>Cách khai báo màu
                <select value={form.color_mode} onChange={(e) => setForm({ ...form, color_mode: e.target.value as "single" | "multi" })}>
                  <option value="single">Màu đơn</option><option value="multi">Màu phối (2–3 màu)</option>
                </select>
              </label>
              <div className="up-two-col">
                <label>Tên màu chính<input value={form.color_name} placeholder="Ví dụ: Xanh pastel" onChange={(e) => setForm({ ...form, color_name: e.target.value })} /></label>
                <label>Mã HEX chính<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input aria-label="Chọn màu chính" type="color" value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} style={{ width: 48, minWidth: 48, padding: 3 }} />
                  <input aria-label="Mã HEX màu chính" value={form.color_hex} pattern="^#[0-9A-Fa-f]{6}$" onChange={(e) => setForm({ ...form, color_hex: e.target.value })} />
                </div></label>
                {form.color_mode === "multi" && <>
                  <label>Tên màu thứ hai<input value={form.secondary_color_name} placeholder="Ví dụ: Trắng" onChange={(e) => setForm({ ...form, secondary_color_name: e.target.value })} /></label>
                  <label>HEX màu thứ hai<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input aria-label="Chọn màu thứ hai" type="color" value={form.secondary_color_hex} onChange={(e) => setForm({ ...form, secondary_color_hex: e.target.value })} style={{ width: 48, minWidth: 48, padding: 3 }} />
                    <input aria-label="HEX màu thứ hai" value={form.secondary_color_hex} pattern="^#[0-9A-Fa-f]{6}$" onChange={(e) => setForm({ ...form, secondary_color_hex: e.target.value })} />
                  </div></label>
                  <label>Tên màu thứ ba (không bắt buộc)<input value={form.tertiary_color_name} placeholder="Ví dụ: Đỏ" onChange={(e) => setForm({ ...form, tertiary_color_name: e.target.value })} /></label>
                  <label>HEX màu thứ ba<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input aria-label="Chọn màu thứ ba" type="color" value={form.tertiary_color_hex} onChange={(e) => setForm({ ...form, tertiary_color_hex: e.target.value })} style={{ width: 48, minWidth: 48, padding: 3 }} />
                    <input aria-label="HEX màu thứ ba" value={form.tertiary_color_hex} pattern="^#[0-9A-Fa-f]{6}$" onChange={(e) => setForm({ ...form, tertiary_color_hex: e.target.value })} />
                  </div></label>
                </>}
              </div>
              <small>Nhập tên màu và mã HEX. Màu phối có thể khai báo 2–3 màu.</small>
            </section>

            <label>
              Mô tả ngắn

              <textarea
                rows={3}
                value={form.short_description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    short_description: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Mô tả chi tiết
              <MarkdownDescriptionEditor
                value={form.long_description}
                onChange={(value) => setForm((current) => ({ ...current, long_description: value }))}
                rows={7}
              />
            </label>
          </div>

          <div className="up-editor-right">
            <div className="up-product-image-manager">
              <div
                className="up-upload-card"
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileRef.current?.click();
                  }
                }}
                aria-label="Thêm ảnh sản phẩm"
              >
                {previews.length > 0 ? (
                  <img src={previews[activePreview] ?? previews[0]} alt={`Ảnh xem trước ${activePreview + 1}`} />
                ) : (
                  <div>
                    <b>＋</b>
                    <span>TẢI ẢNH SẢN PHẨM</span>
                    <small>PNG, JPG, WEBP · tối đa 10 MB/ảnh</small>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  hidden
                  onClick={(event) => event.stopPropagation()}
                  onChange={(e) => chooseImages(e.target.files)}
                />
              </div>
              {previews.length > 0 && (
                <>
                  <div className="up-new-product-gallery" role="list" aria-label="Băng chuyền ảnh xem trước">
                    {previews.map((image, index) => (
                      <div className={`up-new-product-gallery__item ${index === activePreview ? "is-active" : ""}`} key={`${image}-${index}`}>
                        <button type="button" onClick={() => setActivePreview(index)} aria-label={`Xem ảnh ${index + 1}`} aria-current={index === activePreview}>
                          <img src={image} alt="" />
                        </button>
                        <button type="button" className="up-new-product-gallery__remove" onClick={() => removeImage(index)} aria-label={`Xóa ảnh ${index + 1}`} title="Xóa ảnh">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="up-new-product-gallery__controls">
                    <button type="button" onClick={() => setActivePreview((current) => Math.max(0, current - 1))} disabled={activePreview === 0} aria-label="Ảnh trước"><ChevronLeft size={16} /> ẢNH TRƯỚC</button>
                    <span>{activePreview + 1} / {previews.length}</span>
                    <button type="button" onClick={() => setActivePreview((current) => Math.min(previews.length - 1, current + 1))} disabled={activePreview === previews.length - 1} aria-label="Ảnh tiếp theo">ẢNH TIẾP <ChevronRight size={16} /></button>
                  </div>
                  <p className="up-new-product-gallery__hint">Ảnh đầu tiên là ảnh đại diện. Dùng nút thùng rác để bỏ ảnh trước khi tạo sản phẩm.</p>
                </>
              )}
              <button type="button" className="up-new-product-gallery__add" onClick={() => fileRef.current?.click()}>＋ THÊM ẢNH</button>
            </div>

            <label>
              Trạng thái

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status:
                      e.target.value as Product["status"],
                  })
                }
              >
                <option value="draft">
                  Bản nháp
                </option>

                <option value="published">
                  Đang hoạt động
                </option>

                <option value="archived">
                  Đã ẩn
                </option>
              </select>
            </label>

            <label className="up-check up-new-arrival-check">
              <input
                type="checkbox"
                checked={form.new_arrival}
                onChange={(e) => setForm({ ...form, new_arrival: e.target.checked })}
              />
              <span><strong>NEW ARRIVAL</strong><small>Gắn nhãn nổi bật cho sản phẩm này trên cửa hàng.</small></span>
            </label>

            <label className="up-check">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm({
                    ...form,
                    featured: e.target.checked,
                  })
                }
              />

              Sản phẩm nổi bật
            </label>

            <div className="up-editor-actions">
              <Link
                className="up-secondary"
                to="/admin/products"
              >
                HỦY
              </Link>

              <button
                type="submit"
                className="up-admin-primary"
                disabled={saving}
              >
                {saving
                  ? "ĐANG TẠO…"
                  : "TẠO SẢN PHẨM"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {confirmOpen && (
        <div className="up-product-confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setConfirmOpen(false); }}>
          <section className="up-product-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="up-product-confirm-title">
            <p className="up-admin-kicker">CONFIRM PRODUCT</p>
            <h2 id="up-product-confirm-title">Xác nhận thêm sản phẩm?</h2>
            <p>WEARO sẽ lưu <strong>{form.name.trim() || "sản phẩm mới"}</strong> vào danh mục. Bạn có thể quay lại chỉnh sửa nếu cần.</p>
            <label className="up-check up-new-arrival-check up-confirm-new-arrival">
              <input type="checkbox" checked={form.new_arrival} onChange={(event) => setForm({ ...form, new_arrival: event.target.checked })} />
              <span><strong>Đánh dấu NEW ARRIVAL</strong><small>{form.new_arrival ? "Sản phẩm sẽ có nhãn NEW ARRIVAL nổi bật khi được hiển thị." : "Sản phẩm sẽ không mang nhãn NEW ARRIVAL."}</small></span>
            </label>
            <div className="up-product-confirm-actions">
              <button type="button" className="up-admin-secondary" disabled={saving} onClick={() => setConfirmOpen(false)}>QUAY LẠI</button>
              <button type="button" className="up-admin-primary" disabled={saving} onClick={() => void confirmCreateProduct()}>{saving ? "ĐANG LƯU…" : "XÁC NHẬN THÊM SẢN PHẨM"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
