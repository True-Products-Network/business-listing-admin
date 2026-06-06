'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface CSVRow {
  business_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  plan?: string;
  [key: string]: string | undefined;
}

interface UploadProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

export default function BulkUploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [images, setImages] = useState<Map<string, File>>(new Map());
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        setCsvData(rows);
        setPreviewMode(true);
        setError('');
      } catch (err) {
        setError('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: CSVRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: CSVRow = { business_name: '' };
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      if (row.business_name) {
        rows.push(row);
      }
    }
    
    return rows;
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values.map(v => v.replace(/^"|"$/g, ''));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = new Map(images);
    Array.from(files).forEach(file => {
      // Match image to business by filename (e.g., "Business Name.jpg")
      const businessName = file.name.replace(/\.[^/.]+$/, '').trim();
      newImages.set(businessName.toLowerCase(), file);
    });
    
    setImages(newImages);
  };

  const getImageForBusiness = (businessName: string): File | undefined => {
    return images.get(businessName.toLowerCase());
  };

  const removeImage = (businessName: string) => {
    const newImages = new Map(images);
    newImages.delete(businessName.toLowerCase());
    setImages(newImages);
  };

  const processUpload = async () => {
    if (csvData.length === 0) return;
    
    setUploading(true);
    setProgress({
      total: csvData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    });

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      try {
        // 1. Create business
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .insert({
            business_name: row.business_name,
            description_short: row.description?.substring(0, 200) || null,
            description_long: row.description || null,
            phone: row.phone || null,
            email: row.email || null,
            website_url: row.website || null,
            status: 'pending'
          })
          .select()
          .single();

        if (businessError) throw businessError;

        // 2. Create location
        if (row.city || row.address) {
          await supabase.from('business_locations').insert({
            business_id: business.id,
            address_line_1: row.address || null,
            city: row.city || null,
            state: row.state || 'MO',
            zip_code: row.zip || null,
            is_primary: true
          });
        }

        // 3. Create listing with plan
        const planKey = (row.plan || 'free').toLowerCase();
        const { data: plan } = await supabase
          .from('listing_plans')
          .select('id')
          .eq('plan_key', planKey)
          .single();

        await supabase.from('business_listings').insert({
          business_id: business.id,
          plan_id: plan?.id || null,
          listing_status: 'pending',
          is_featured: planKey === 'vip'
        });

        // 4. Upload image if exists
        const imageFile = getImageForBusiness(row.business_name);
        if (imageFile) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${business.id}/logo.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('business-images')
            .upload(fileName, imageFile);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('business-images')
              .getPublicUrl(fileName);

            await supabase
              .from('businesses')
              .update({ logo_url: publicUrl })
              .eq('id', business.id);
          }
        }

        // 5. Create submission record
        await supabase.from('listing_submissions').insert({
          business_id: business.id,
          submission_status: 'submitted',
          requested_plan_key: planKey,
          submitted_at: new Date().toISOString()
        });

        setProgress(prev => prev ? {
          ...prev,
          processed: prev.processed + 1,
          successful: prev.successful + 1
        } : null);

      } catch (err: any) {
        setProgress(prev => prev ? {
          ...prev,
          processed: prev.processed + 1,
          failed: prev.failed + 1,
          errors: [...prev.errors, `${row.business_name}: ${err.message}`]
        } : null);
      }
    }

    setUploading(false);
    setSuccess(`Upload complete! ${progress?.successful || 0} successful, ${progress?.failed || 0} failed.`);
  };

  const downloadTemplate = () => {
    const template = `business_name,contact_name,email,phone,website,description,category,address,city,state,zip,plan
"ABC Company","John Doe","john@abc.com","555-1234","https://abc.com","Great company description","Contractors","123 Main St","St. Louis","MO","63101","free"
"XYZ Services","Jane Smith","jane@xyz.com","555-5678","https://xyz.com","Another great business","Professional Services","456 Oak Ave","Chesterfield","MO","63017","premium"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-upload-template.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Listings</h1>
              <p className="text-gray-500 mt-1">
                Import multiple business listings from CSV with images
              </p>
            </div>
            <Link href="/admin" className="inline-flex">
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white rounded-lg hover:opacity-90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {!previewMode ? (
          /* Upload Section */
          <div className="grid md:grid-cols-2 gap-8">
            {/* CSV Upload */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Step 1: Upload CSV</h2>
                  <p className="text-gray-500 text-sm">Business listing data</p>
                </div>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Click to upload CSV file</p>
                <p className="text-gray-400 text-sm mt-2">or drag and drop</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />

              <button
                onClick={downloadTemplate}
                className="mt-4 flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </button>

              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-2">Required Columns:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>business_name</strong> - Company name</li>
                  <li>• <strong>plan</strong> - free, premium, or vip</li>
                </ul>
                <h3 className="font-medium text-gray-700 mb-2 mt-4">Optional Columns:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• contact_name, email, phone, website</li>
                  <li>• description, category</li>
                  <li>• address, city, state, zip</li>
                </ul>
              </div>
            </div>

            {/* Images Upload */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <ImageIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Step 2: Upload Images</h2>
                  <p className="text-gray-500 text-sm">Optional - Logo images</p>
                </div>
              </div>

              <div 
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition"
              >
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Click to upload images</p>
                <p className="text-gray-400 text-sm mt-2">JPG, PNG files</p>
              </div>
              
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-2">Image Naming:</h3>
                <p className="text-sm text-gray-600">
                  Name images to match business names exactly:<br/>
                  <code className="bg-gray-200 px-1 rounded">ABC Company.jpg</code> matches <code className="bg-gray-200 px-1 rounded">ABC Company</code> in CSV
                </p>
              </div>

              {images.size > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    {images.size} image(s) ready for upload
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Preview Section */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Preview ({csvData.length} listings)
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Review before uploading. Images matched: {csvData.filter(r => getImageForBusiness(r.business_name)).length}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Back
                  </button>
                  <button
                    onClick={processUpload}
                    disabled={uploading}
                    className="flex items-center px-6 py-2 bg-gradient-to-r from-[#371a5b] to-[#bb7ce4] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {uploading && progress && (
              <div className="p-6 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Processing {progress.processed} of {progress.total}
                  </span>
                  <span className="text-sm text-blue-700">
                    {progress.successful} successful, {progress.failed} failed
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {csvData.map((row, index) => {
                    const imageFile = getImageForBusiness(row.business_name);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{row.business_name}</div>
                          {row.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {row.description.substring(0, 60)}...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{row.contact_name}</div>
                          <div className="text-sm text-gray-500">{row.email}</div>
                          <div className="text-sm text-gray-500">{row.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{row.city}</div>
                          <div className="text-sm text-gray-500">{row.address}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            row.plan?.toLowerCase() === 'vip' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : row.plan?.toLowerCase() === 'premium'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {row.plan || 'Free'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {imageFile ? (
                            <div className="flex items-center">
                              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                              <span className="text-sm text-gray-600">{imageFile.name}</span>
                              <button
                                onClick={() => removeImage(row.business_name)}
                                className="ml-2 text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No image</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error Log */}
        {progress && progress.errors.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-red-800 font-semibold mb-4 flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              Errors ({progress.errors.length})
            </h3>
            <ul className="space-y-2 text-sm text-red-700">
              {progress.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
