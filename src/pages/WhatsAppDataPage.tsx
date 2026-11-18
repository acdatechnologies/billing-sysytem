import React from 'react';
import { MessageCircle, Send, Users, ShieldCheck } from 'lucide-react';

export const WhatsAppDataPage: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center max-w-2xl mx-auto my-12">
      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
        <MessageCircle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">WhatsApp Sharing & Offers</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
        Scheduled for Phase 4: Instant invoice sharing via WhatsApp Web / Desktop with custom templates, and compliant promotional messaging filtered by customer opt-in consent.
      </p>
    </div>
  );
};
