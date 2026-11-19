import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, ShieldCheck, AlertCircle } from 'lucide-react';
import { Customer, CustomerInput } from '../types';
import { customerApi } from '../api/customerApi';
import { validateCustomer } from '../utils/validators';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  customerToEdit,
}) => {
  const isEditing = Boolean(customerToEdit);

  const [formData, setFormData] = useState<CustomerInput>({
    name: '',
    mobile: '',
    email: '',
    address: '',
    gstin: '',
    state: 'Tamil Nadu',
    state_code: '33',
    whatsapp_consent: 1,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        name: customerToEdit.name,
        mobile: customerToEdit.mobile,
        email: customerToEdit.email || '',
        address: customerToEdit.address || '',
        gstin: customerToEdit.gstin || '',
        state: customerToEdit.state || 'Tamil Nadu',
        state_code: customerToEdit.state_code || '33',
        whatsapp_consent: customerToEdit.whatsapp_consent !== undefined ? customerToEdit.whatsapp_consent : 1,
      });
    } else {
      setFormData({
        name: '',
        mobile: '',
        email: '',
        address: '',
        gstin: '',
        state: 'Tamil Nadu',
        state_code: '33',
        whatsapp_consent: 1,
      });
    }
    setError(null);
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const validation = validateCustomer({
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      gstin: formData.gstin,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError(Object.values(validation.errors)[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing && customerToEdit) {
        await customerApi.updateCustomer(customerToEdit.id, formData);
      } else {
        await customerApi.createCustomer(formData);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                {isEditing ? 'Edit Customer Details' : 'Register New Customer'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Customer profile, contact numbers & WhatsApp consent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Row 1: Name & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senthil Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="10-digit mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Used for deduplication & WhatsApp</p>
            </div>
          </div>

          {/* Row 2: Email & GSTIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer GSTIN <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 33AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          {/* Row 3: Address */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Billing Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Door No, Street name, City, Pincode"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Row 4: WhatsApp Marketing Consent Checkbox (Section 10 Requirement) */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="whatsapp_consent"
              checked={formData.whatsapp_consent === 1}
              onChange={(e) => setFormData({ ...formData, whatsapp_consent: e.target.checked ? 1 : 0 })}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="whatsapp_consent" className="cursor-pointer">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp Marketing & Invoice Consent
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Customer has agreed to receive digital invoice PDFs and exclusive promotional offers via WhatsApp.
              </p>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:from-red-800 text-white px-5 py-2 rounded-lg font-semibold shadow-md shadow-red-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Profile' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
