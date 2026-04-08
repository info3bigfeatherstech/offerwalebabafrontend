  import React, { useEffect, useState, useCallback, useRef } from "react";
  import { createPortal } from "react-dom";
  import { useDispatch, useSelector } from "react-redux";
  import { toast } from "react-toastify";
  import {
    MapPin, Plus, Home, Briefcase, Star,
    Pencil, Trash2, X, RefreshCw, AlertCircle,
    ChevronRight, ChevronLeft, Loader2,
  } from "lucide-react";

  import {
    fetchAddresses, addAddress, updateAddress, deleteAddress,
    clearAddressErrors, selectDefaultAddress, selectOtherAddresses,
    selectAddressLoading, selectAddressError,
  } from "../../../components/REDUX_FEATURES/REDUX_SLICES/Useraddressslice";
  import useAutoComplete from "../../../components/HOOKS/useAutoComplete";

  // ─────────────────────────────────────────────────────────────────────────────
  // Constants
  // ─────────────────────────────────────────────────────────────────────────────
  const ADDRESS_TYPE_ICON = {
    home:  <Home size={15} className="text-[#F7A221]" />,
    work:  <Briefcase size={15} className="text-blue-500" />,
    other: <MapPin size={15} className="text-gray-400" />,
  };

  const EMPTY_FORM = {
    fullName: "", phone: "", houseNumber: "", area: "",
    landmark: "", addressLine1: "", addressLine2: "",
    city: "", state: "", postalCode: "", country: "India",
    addressType: "home", isDefault: false,
    isGift: false, deliveryInstructions: "",
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Field — generic input with optional autocomplete dropdown
  // ─────────────────────────────────────────────────────────────────────────────
  const Field = ({
    label, name, value, onChange, required,
    type = "text", placeholder, maxLength,
    suggestions = [],
    onSuggestionSelect,
    loading = false,
  }) => (
    <div className="flex flex-col gap-1.5 w-full relative">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className="bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold outline-none transition-all w-full cursor-pointer focus:cursor-text"
        />
        {/* Loading spinner inside input */}
      {!loading && value?.length > 3 && suggestions?.length === 0 && (
    <div className="text-xs text-gray-400 px-2 mt-1">
      No results found
    </div>
  )}
      </div>

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {suggestions.slice(0, 6).map((item, i) => (
            <li
              key={i}
              onMouseDown={() => onSuggestionSelect?.(item)}
              className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 truncate"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Address Card
  // ─────────────────────────────────────────────────────────────────────────────
  const AddressCard = ({ address, isDefault, onEdit, onDelete, onSetDefault, isDeleting }) => (
    <div className={`p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] relative overflow-hidden transition-all duration-300 border-2 cursor-pointer hover:shadow-xl ${
      isDefault ? "border-black shadow-xl ring-4 ring-black/5" : "border-gray-100 hover:border-black"
    }`}>
      {isDefault && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
          <Star size={10} className="fill-[#F7A221] text-[#F7A221]" />
          <span>Default</span>
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gray-50 rounded-xl">
          {ADDRESS_TYPE_ICON[address.addressType] || ADDRESS_TYPE_ICON.other}
        </div>
        <span className="font-black uppercase text-[10px] tracking-widest text-gray-400">
          {address.addressType}
        </span>
      </div>
      <h4 className="font-black text-gray-900 text-base leading-tight pr-20">{address.fullName}</h4>
      <p className="text-xs text-gray-400 font-bold mt-0.5 mb-4">{address.phone}</p>
      <p className="text-sm font-medium text-gray-600 leading-relaxed">
        {[address.houseNumber, address.area, address.landmark, address.addressLine1, address.addressLine2]
          .filter(Boolean).join(", ")}
        <br />
        <span className="text-gray-900 font-bold">
          {address.city}, {address.state} — {address.postalCode}
        </span>
      </p>
      <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3">
        {!isDefault && (
          <button
            onClick={(e) => { e.stopPropagation(); onSetDefault(address); }}
            className="text-[10px] font-black uppercase tracking-widest text-[#F7A221] hover:underline cursor-pointer whitespace-nowrap"
          >
            Set Default
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(address); }}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black cursor-pointer transition-colors"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(address._id); }}
          disabled={isDeleting}
          className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 disabled:opacity-30 cursor-pointer transition-colors"
        >
          {isDeleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // AddressFormModal
  // ─────────────────────────────────────────────────────────────────────────────
  const AddressFormModal = ({ initial, onSubmit, onClose, isSaving, error }) => {
  const [form, setForm] = useState({
  ...EMPTY_FORM,
  ...initial,
});
    const [step, setStep]             = useState(1);
    const [formError, setFormError]   = useState(null);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const dropdownRef = useRef(null);
    const [isSelected1, setIsSelected1] = useState(false);
const [isSelected2, setIsSelected2] = useState(false);

    // ── Autocomplete for address line fields (NOT pincode) ──
    // Only fires when 3+ chars typed
    const searchQuery1 = form.addressLine1?.length >= 3 ? form.addressLine1 : "";
    const searchQuery2 = form.addressLine2?.length >= 3 ? form.addressLine2 : "";
    const { result: raw1 = [], setResult: setRaw1, Loading: Loading1 } = useAutoComplete(searchQuery1, form.city, 500, form.lat, form.lon);
  const { result: raw2 = [],setResult: setRaw2, Loading:Loading2 } = useAutoComplete(searchQuery2,form.city, 500,form.lat, form.lon);
  const isSameCity = (place) => {
  const city =
    place.address?.city ||
    place.address?.town ||
    place.address?.village ||
    "";

  return city.toLowerCase().includes(form.city.toLowerCase());
};

const suggestions1 =   searchQuery1 && !isSelected1
    ? raw1
    : [];
const suggestions2 =   searchQuery2 && !isSelected2
    ? raw2
    : [];

    // Lock body scroll
    useEffect(() => {
      const sw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow     = "hidden";
      document.body.style.paddingRight = `${sw}px`;
      return () => {
        document.body.style.overflow     = "unset";
        document.body.style.paddingRight = "0px";
      };
    }, []);
    useEffect(() => {
  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setRaw1([]);
      setRaw2([]);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

    // ── handleChange — generic field updater ──
    const handleChange = useCallback((e) => {
      const { name, value } = e.target;
     if (name === "addressLine1") {
  setIsSelected1(false);  // 🔥 allow suggestions again
}

if (name === "addressLine2") {
  setIsSelected2(false);
}
      if (name === "phone") {
        const v = value.replace(/\D/g, "");
        if (v.length <= 10) setForm((p) => ({ ...p, phone: v }));
        return;
      }
      setForm((p) => ({ ...p, [name]: value }));
    }, []);

    // ── handlePincodeChange — fetches city/state from postalpincode.in ──
    // Simple, free, India-specific — no lat/lon, no reverse geocode needed
    const handlePincodeChange = async (value) => {
      // only digits
      if (!/^\d*$/.test(value)) return;

      // update the input immediately so user sees what they typed
      setForm((p) => ({ ...p, postalCode: value }));

      // wait for 6 digits
      if (value.length !== 6) return;

      setPincodeLoading(true);
      try {
        const res  = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await res.json();

        if (data[0]?.Status === "Success") {
          const po = data[0].PostOffice[0];
          // auto-fill city, state, area from pincode
          setForm((p) => ({
            ...p,
            postalCode: value,
            city:  po.District || p.city,
            state: po.State    || p.state,
            area:  po.Name     || p.area,
          }));
          toast.success(`📍 ${po.District}, ${po.State} detected!`, { autoClose: 2000 });
        } else {
          toast.error("Invalid pincode — city/state not found");
        }
      } catch (err) {
        console.error("Pincode API error:", err);
        toast.error("Could not fetch pincode details");
      } finally {
        setPincodeLoading(false);
      }
    };

    // ── Suggestion select handlers ──
 const handleSuggestionSelect1 = (place) => {
  setForm(p => ({
    ...p,
    addressLine1: place.display_name,
  }));

  setIsSelected1(true);  // 🔥 IMPORTANT
  setRaw1([]);
};

  const handleSuggestionSelect2 = (place) => {
  setForm(p => ({
    ...p,
    addressLine2: place.display_name,
  }));

  setIsSelected2(true);  // 🔥 IMPORTANT
  setRaw2([]);
};

    const toggleBoolean = (key) => setForm((p) => ({ ...p, [key]: !p[key] }));
    const setType       = (type) => setForm((p) => ({ ...p, addressType: type }));

    // ── Validation ──
    const validateStep = (s) => {
      setFormError(null);
      if (s === 1) {
        if (!form.fullName.trim())            return "Full Name is required";
        if (form.phone.length !== 10)         return "Phone must be exactly 10 digits";
        if (!/^\d{6}$/.test(form.postalCode)) return "Postal code must be 6 digits";
      }
      if (s === 2) {
        for (const f of ["houseNumber", "area", "city", "state", "postalCode"]) {
          if (!form[f]?.trim())
            return `${f.replace(/([A-Z])/g, " $1")} is required`;
        }
        if (!/^\d{6}$/.test(form.postalCode)) return "Postal code must be 6 digits";
      }
      return null;
    };

    const handleNext = () => {
      const err = validateStep(step);
      if (err) { setFormError(err); return; }
      setFormError(null);
      setStep((s) => s + 1);
    };

    const handleFinalSubmit = (e) => {
      e.preventDefault();
      const err = validateStep(step);
      if (err) { setFormError(err); return; }
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
      onSubmit(payload);
    };

    return createPortal(
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-[40px] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

          {/* Step indicator */}
          <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= s ? "bg-black" : "bg-gray-100"}`} />
              ))}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              {step === 1 && "Personal Info"}
              {step === 2 && "Address Details"}
              {step === 3 && "Preferences"}
            </h2>

            {(formError || error) && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-xs font-bold text-red-700">
                  {formError || error?.message || "Something went wrong"}
                </p>
              </div>
            )}

            <div className="space-y-5">

              {/* ── Step 1: Personal Info ── */}
              {step === 1 && (
                <>
                  <Field
                    label="Full Name" name="fullName" value={form.fullName}
                    onChange={handleChange} required placeholder="Ravi Kumar"
                  />
                  <Field
                    label="Phone Number" name="phone" value={form.phone}
                    onChange={handleChange} required type="tel" placeholder="10-digit number"
                  />
                  {/* Pincode — auto-fills city/state on 6 digits */}
                  <Field
                    label="Pincode" name="postalCode" value={form.postalCode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    required placeholder="6-digit pincode" maxLength={6}
                    loading={pincodeLoading}
                  />
                  {/* Show auto-detected city/state as a preview */}
                  {form.city && form.state && (
                    <p className="text-xs text-green-600 font-bold ml-1">
                      📍 {form.city}, {form.state}
                    </p>
                  )}
                </>
              )}

              {/* ── Step 2: Address Details ── */}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="House No." name="houseNumber" value={form.houseNumber} onChange={handleChange} required placeholder="42B" />
                    <Field label="Area"       name="area"        value={form.area}        onChange={handleChange} required placeholder="Sector 12" />
                  </div>

                  <Field label="Landmark" name="landmark" value={form.landmark} onChange={handleChange} placeholder="Near City Mall" />

                  {/* Address Line 1 — with LocationIQ autocomplete */}
                  <div ref={dropdownRef}>
                      <Field
                    label="Address Line 1"
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    placeholder="Building name, Street etc."
                    suggestions={suggestions1}
                    loading={Loading1}
                    onSuggestionSelect={handleSuggestionSelect1}
                  />
                  </div>

                  {/* Address Line 2 — with LocationIQ autocomplete */}
                  <Field
                    label="Address Line 2"
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                    placeholder="Additional details"
                    suggestions={suggestions2}
                    loading={Loading2}
                    onSuggestionSelect={handleSuggestionSelect2}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* City — auto-filled from pincode, still editable */}
                    <Field label="City" name="city" value={form.city} onChange={handleChange} required placeholder="Mumbai" />
                    {/* Pincode — editable here too, re-triggers auto-fill */}
                    <Field
                      label="Pincode" name="postalCode" value={form.postalCode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      required placeholder="400001" maxLength={6}
                      loading={pincodeLoading}
                    />
                  </div>

                  {/* State — auto-filled from pincode, still editable */}
                  <Field label="State" name="state" value={form.state} onChange={handleChange} required placeholder="Maharashtra" />
                </>
              )}

              {/* ── Step 3: Preferences ── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Address Type
                    </label>
                    <div className="flex gap-2">
                      {["home", "work", "other"].map((t) => (
                        <button
                          key={t} type="button" onClick={() => setType(t)}
                          className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
                            form.addressType === t
                              ? "bg-black text-white border-black"
                              : "bg-gray-50 text-gray-400 border-transparent hover:border-gray-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field
                    label="Delivery Instructions" name="deliveryInstructions"
                    value={form.deliveryInstructions} onChange={handleChange}
                    placeholder="Ring bell / Call on arrival"
                  />

                  <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                    {[
                      { key: "isDefault", label: "Default Address",    color: "bg-black"     },
                      { key: "isGift",    label: "Is this a gift? 🎁", color: "bg-[#F7A221]" },
                    ].map(({ key, label, color }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleBoolean(key)}
                      >
                        <span className="text-xs font-black text-gray-600 uppercase tracking-widest">{label}</span>
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${form[key] ? color : "bg-gray-200"}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form[key] ? "translate-x-5" : "translate-x-1"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-6 py-4 rounded-2xl border-2 border-gray-200 font-black text-[10px] uppercase tracking-widest hover:border-black transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={isSaving}
                className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : initial ? "Update Address" : "Save Address"}
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // UserAddress — Main Component
  // ─────────────────────────────────────────────────────────────────────────────
  const UserAddress = () => {
    const dispatch       = useDispatch();
    const defaultAddress = useSelector(selectDefaultAddress);
    const otherAddresses = useSelector(selectOtherAddresses);
    const loading        = useSelector(selectAddressLoading);
    const error          = useSelector(selectAddressError);

    const [modalOpen,   setModalOpen]   = useState(false);
    const [editAddress, setEditAddress] = useState(null);
    const [deletingId,  setDeletingId]  = useState(null);

    useEffect(() => {
      dispatch(fetchAddresses());
      return () => dispatch(clearAddressErrors());
    }, [dispatch]);

    const openAdd    = () => { setEditAddress(null); setModalOpen(true); dispatch(clearAddressErrors()); };
    const openEdit   = (a) => { setEditAddress(a);   setModalOpen(true); dispatch(clearAddressErrors()); };
    const closeModal = () => { setModalOpen(false);  setEditAddress(null); };

    const handleSubmit = async (formData) => {
      try {
        if (editAddress) {
          await dispatch(updateAddress({ id: editAddress._id, ...formData })).unwrap();
          toast.success("Address updated!", { theme: "dark" });
        } else {          
          await dispatch(addAddress(formData)).unwrap();
          toast.success("Address added!", { theme: "dark" });
        }
        closeModal();
      } catch (e) {
        toast.error(e?.message || "Failed to save address", { theme: "dark" });
      }
    };

    const handleDelete = async (id) => {
      if (!window.confirm("Delete this address?")) return;
      setDeletingId(id);
      try {
        await dispatch(deleteAddress(id)).unwrap();
        toast.success("Address removed", { theme: "dark" });
      } catch (e) {
        toast.error(e?.message || "Failed to delete", { theme: "dark" });
      } finally {
        setDeletingId(null); }
    };

    const handleSetDefault = async (addr) => {
      try {
        await dispatch(updateAddress({ id: addr._id, isDefault: true })).unwrap();
        toast.success("Default address updated", { theme: "dark" });
      } catch (e) {
        toast.error(e?.message || "Failed to set default", { theme: "dark" });
      }
    };

    const allCount = (defaultAddress ? 1 : 0) + otherAddresses.length;

    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-10 pb-8 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Saved Addresses</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{allCount} Total</p>
          </div>
          <button
            onClick={openAdd}
            className="bg-black text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer hover:bg-[#F7A221] hover:text-black"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {error.fetch && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-xs font-bold text-red-700 flex-1">{error.fetch.message || "Failed to load"}</p>
            <button onClick={() => dispatch(fetchAddresses())} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 cursor-pointer">Retry</button>
          </div>
        )}

        {loading.fetch ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-gray-50 rounded-[40px] animate-pulse" />)}
          </div>
        ) : allCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
              <MapPin size={40} className="text-gray-300" />
            </div>
            <h3 className="font-black text-gray-900 text-xl">No addresses yet</h3>
            <button onClick={openAdd} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer">
              <Plus size={16} className="inline mr-2" /> Add Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultAddress && (
              <AddressCard address={defaultAddress} isDefault onEdit={openEdit} onDelete={handleDelete} onSetDefault={handleSetDefault} isDeleting={deletingId === defaultAddress._id} />
            )}
            {otherAddresses.map((addr) => (
              <AddressCard key={addr._id} address={addr} isDefault={false} onEdit={openEdit} onDelete={handleDelete} onSetDefault={handleSetDefault} isDeleting={deletingId === addr._id} />
            ))}
          </div>
        )}

        {modalOpen && (
          <AddressFormModal
            initial={editAddress}
            onSubmit={handleSubmit}
            onClose={closeModal}
            isSaving={loading.add || loading.update}
            error={error.add || error.update}
          />
        )}
      </div>
    );
  };

  export default UserAddress;
