import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../../components/ImageUploader';
import { Image as ImageIcon, ShieldCheck, AlertCircle, Info, ArrowLeft } from 'lucide-react';

export default function ImageGallery() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-sm flex items-center justify-center shrink-0"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-7 h-7 text-brand-600" />
            <span>Document Images Manager</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload and manage your official Company Logo and Authorized Signatory stamp for invoices.
          </p>
        </div>
      </div>

      {/* Rules Notice Card */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Image Upload Guidelines & Limit</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 text-[11.5px]">
          <li><strong>Single Image Limit (Company Logo):</strong> Exactly 1 official logo image is stored per account.</li>
          <li><strong>Instant Synchronization:</strong> Uploaded logo will automatically appear on all invoices, preview screens, and generated PDFs.</li>
          <li><strong>Supported Formats:</strong> PNG, JPG, WEBP, SVG (up to 5MB).</li>
          <li><strong>Replace or Remove:</strong> You can replace or delete the logo anytime.</li>
        </ul>
      </div>

      {/* Main 2-Image Slot Manager */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <ImageUploader />
      </div>
    </div>
  );
}
