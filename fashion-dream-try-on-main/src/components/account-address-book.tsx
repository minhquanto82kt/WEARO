import { useCallback, useEffect, useState, type FormEvent } from "react";
import { MapPin, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  listCustomerAddresses,
  setDefaultCustomerAddress,
  updateCustomerAddress,
  type CustomerAddress,
  type CustomerAddressInput,
} from "@/lib/customer-addresses";

type Props = { userId: string; preview?: boolean };

const EMPTY_FORM: CustomerAddressInput = {
  recipient_name: "",
  phone: "",
  address_line: "",
  ward: "",
  district: "",
  city: "",
  is_default: false,
};

export function AccountAddressBook({ userId, preview = false }: Props) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [form, setForm] = useState<CustomerAddressInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    if (preview) { setAddresses([]); setLoading(false); return; }
    setLoading(true);
    try {
      const rows = await listCustomerAddresses(userId);
      setAddresses(rows);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải sổ địa chỉ.");
    } finally { setLoading(false); }
  }, [userId, preview]);

  useEffect(() => { void refresh(); }, [refresh]);

  const beginEdit = (address?: CustomerAddress) => {
    setEditingId(address?.id ?? null);
    setFormOpen(true);
    setForm(address ? {
      recipient_name: address.recipient_name,
      phone: address.phone,
      address_line: address.address_line,
      ward: address.ward,
      district: address.district,
      city: address.city,
      is_default: address.is_default,
    } : EMPTY_FORM);
    setError("");
    setNotice("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview) return;
    setSaving(true); setError(""); setNotice("");
    try {
      if (editingId) {
        await updateCustomerAddress(userId, editingId, form);
      } else {
        await createCustomerAddress(userId, form);
      }
      setEditingId(null); setFormOpen(false); setForm(EMPTY_FORM);
      setNotice(editingId ? "Đã cập nhật địa chỉ." : "Đã thêm địa chỉ mới.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu địa chỉ.");
    } finally { setSaving(false); }
  };

  const makeDefault = async (id: string) => {
    setError(""); setNotice("");
    try {
      await setDefaultCustomerAddress(userId, id);
      setNotice("Đã đặt địa chỉ mặc định.");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể đặt địa chỉ mặc định."); }
  };

  const remove = async (address: CustomerAddress) => {
    if (!window.confirm(`Xóa địa chỉ của ${address.recipient_name}? Thao tác này không thể hoàn tác.`)) return;
    setError(""); setNotice("");
    try {
      await deleteCustomerAddress(userId, address.id);
      setNotice("Đã xóa địa chỉ.");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể xóa địa chỉ."); }
  };

  const setField = (key: keyof CustomerAddressInput, value: string | boolean) =>
    setForm(current => ({ ...current, [key]: value }));

  return (
    <section className="account-address-book" aria-labelledby="account-address-title">
      <div className="account-address-heading">
        <div><span className="account-hub-eyebrow">Giao hàng</span><h2 id="account-address-title">Sổ địa chỉ</h2></div>
        {!editingId && <button type="button" className="account-profile-save" onClick={() => beginEdit()} disabled={preview}><Plus size={15}/> Thêm địa chỉ</button>}
      </div>
      {preview && <p className="account-profile-feedback">Preview chỉ xem giao diện, không kết nối dữ liệu địa chỉ thật.</p>}
      {error && <p className="account-profile-feedback account-profile-feedback--error" role="alert">{error}</p>}
      {notice && <p className="account-profile-feedback account-profile-feedback--success" role="status">{notice}</p>}
      {formOpen ? (
        <form className="account-address-form" onSubmit={submit}>
          <label>Tên người nhận<input required maxLength={120} autoComplete="name" value={form.recipient_name} onChange={e => setField("recipient_name", e.target.value)} /></label>
          <label>Số điện thoại<input required type="tel" maxLength={30} autoComplete="tel" value={form.phone} onChange={e => setField("phone", e.target.value)} /></label>
          <label className="account-address-form__wide">Địa chỉ cụ thể<input required maxLength={300} autoComplete="street-address" value={form.address_line} onChange={e => setField("address_line", e.target.value)} placeholder="Số nhà, tên đường, tòa nhà..." /></label>
          <label>Phường / xã<input required maxLength={120} value={form.ward} onChange={e => setField("ward", e.target.value)} /></label>
          <label>Quận / huyện<input required maxLength={120} value={form.district} onChange={e => setField("district", e.target.value)} /></label>
          <label className="account-address-form__wide">Tỉnh / thành phố<input required maxLength={120} autoComplete="address-level1" value={form.city} onChange={e => setField("city", e.target.value)} /></label>
          <label className="account-address-default"><input type="checkbox" checked={Boolean(form.is_default)} onChange={e => setField("is_default", e.target.checked)} /> Đặt làm địa chỉ mặc định</label>
          <div className="account-address-form__actions"><button className="account-profile-save" type="submit" disabled={saving}>{saving ? "Đang lưu…" : editingId ? "Lưu thay đổi" : "Thêm địa chỉ"}</button><button type="button" className="account-address-cancel" onClick={() => { setEditingId(null); setFormOpen(false); setForm(EMPTY_FORM); }} disabled={saving}><X size={14}/> Hủy</button></div>
        </form>
      ) : null}
      {loading ? <p className="account-profile-feedback" role="status">Đang tải địa chỉ…</p> : addresses.length === 0 ? (
        <div className="account-address-empty"><MapPin size={22}/><p>Bạn chưa lưu địa chỉ giao hàng nào.</p><span>Thêm địa chỉ để sử dụng nhanh khi đặt hàng.</span></div>
      ) : (
        <div className="account-address-list">
          {addresses.map(address => <article className="account-address-item" key={address.id}>
            <div className="account-address-item__top"><strong>{address.recipient_name}</strong>{address.is_default && <span><Star size={12} fill="currentColor"/> Mặc định</span>}</div>
            <p>{address.phone}</p>
            <p>{[address.address_line, address.ward, address.district, address.city].filter(Boolean).join(", ")}</p>
            <div className="account-address-item__actions">
              {!address.is_default && <button type="button" onClick={() => void makeDefault(address.id)}>Đặt mặc định</button>}
              <button type="button" onClick={() => beginEdit(address)}><Pencil size={13}/> Sửa</button>
              <button type="button" onClick={() => void remove(address)}><Trash2 size={13}/> Xóa</button>
            </div>
          </article>)}
        </div>
      )}
    </section>
  );
}
