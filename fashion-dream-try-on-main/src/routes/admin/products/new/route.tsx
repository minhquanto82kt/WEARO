import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
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

    if (!Number.isFinite(price) || price < 0) {
      return setMessage("Giá không hợp lệ.");
    }

    setMessage("");
    setConfirmOpen(true);
  }

  async function confirmCreateProduct() {
    if (saving) return;
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
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: e.target.value,
                    })
                  }
                />
              </label>
            </div>

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

              <textarea
                rows={7}
                value={form.long_description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    long_description: e.target.value,
                  })
                }
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
