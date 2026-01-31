'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function EditProduct() {
    const router = useRouter();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sku: '',
        category: '',
        quantityOnHand: 1,
        costPrice: '',
        salePrice: '',
        isPublished: true,
    });

    const [attributes, setAttributes] = useState([]);
    const [pricing, setPricing] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);

    // Fetch Data
    useEffect(() => {
        if (!id) return;
        fetch(`/api/products/${id}`) // Using public GET as it returns everything needed. Or use /api/vendor/products/[id] if implemented GET there.
            .then(res => res.json())
            .then(data => {
                setFormData({
                    name: data.name,
                    description: data.description || '',
                    sku: data.sku,
                    category: data.attributes?.category || '',
                    quantityOnHand: data.quantityOnHand,
                    costPrice: data.costPrice,
                    salePrice: data.salePrice,
                    isPublished: data.isPublished
                });

                // Transform attributes obj to array
                const attrs = [];
                if (data.attributes) {
                    Object.entries(data.attributes).forEach(([key, value]) => {
                        if (key !== 'category') attrs.push({ key, value });
                    });
                }
                setAttributes(attrs);

                // Pricing
                setPricing(data.priceConfigs.map(p => ({
                    unit: p.periodUnit, // Map unit if needed
                    duration: p.duration,
                    price: p.price
                })));

                setImageUrls(data.imageUrls || []);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load product');
                setLoading(false);
            });
    }, [id]);

    // --- Handlers (Same as Add Page) ---

    const handleAttributeChange = (index, field, value) => {
        const newAttrs = [...attributes];
        newAttrs[index][field] = value;
        setAttributes(newAttrs);
    };
    const addAttributeRow = () => setAttributes([...attributes, { key: '', value: '' }]);
    const removeAttributeRow = (index) => setAttributes(attributes.filter((_, i) => i !== index));

    const handlePriceChange = (index, field, value) => {
        const newPricing = [...pricing];
        newPricing[index][field] = value;
        setPricing(newPricing);
    };
    const addPriceRow = () => setPricing([...pricing, { unit: 'DAY', duration: 1, price: '' }]);
    const removePriceRow = (index) => setPricing(pricing.filter((_, i) => i !== index));

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Upload failed');
            setImageUrls([...imageUrls, json.url]);
        } catch (err) {
            alert('Image upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const attributesObj = attributes.reduce((acc, curr) => {
            if (curr.key) acc[curr.key] = curr.value;
            return acc;
        }, {});
        if (formData.category) attributesObj['category'] = formData.category;

        try {
            const res = await fetch(`/api/vendor/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    attributes: attributesObj,
                    pricing,
                    imageUrls
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update product');

            router.push('/vendor/products');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-black p-8 text-white mb-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Edit Product
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">Status:</span>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${formData.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                        >
                            {formData.isPublished ? 'PUBLISHED' : 'DRAFT'}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Section 1: Basic Info */}
                    <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm text-gray-400 mb-1">Product Name</label>
                                <input required className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:border-purple-500 transition-colors placeholder-gray-600 outline-none"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Category</label>
                                <select required className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white outline-none"
                                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="">Select Category</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Furniture">Furniture</option>
                                    <option value="Fashion">Fashion</option>
                                    <option value="Outdoors">Outdoors</option>
                                    <option value="Tools">Tools</option>
                                    <option value="Events">Events</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea className="w-full bg-black border border-gray-700 rounded-lg p-3 h-24 outline-none"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Section: Images */}
                    <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <div className="flex flex-wrap gap-4">
                            {imageUrls.map((url, i) => (
                                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-700 group">
                                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                </div>
                            ))}
                            <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-gray-800/30 transition-all">
                                {uploading ? <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" /> : <span className="text-2xl text-gray-400">+</span>}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    {/* Section 2: Inventory & Value */}
                    <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Quantity</label>
                                <input type="number" required className="w-full bg-black border border-gray-700 rounded-lg p-3 outline-none"
                                    value={formData.quantityOnHand} onChange={e => setFormData({ ...formData, quantityOnHand: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Item Cost</label>
                                <input type="number" required className="w-full bg-black border border-gray-700 rounded-lg p-3 outline-none"
                                    value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Sale Price</label>
                                <input type="number" required className="w-full bg-black border border-gray-700 rounded-lg p-3 outline-none"
                                    value={formData.salePrice} onChange={e => setFormData({ ...formData, salePrice: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-purple-400">Rental Pricing</h2>
                            <button type="button" onClick={addPriceRow} className="text-sm text-purple-400 hover:text-white underline">+ Add Tier</button>
                        </div>
                        <div className="space-y-3">
                            {pricing.map((price, index) => (
                                <div key={index} className="flex gap-4 items-end bg-black/40 p-3 rounded-xl border border-gray-800/50">
                                    <div className="flex-1">
                                        <input type="number" className="w-full bg-transparent border-b border-gray-700 py-1 outline-none text-white"
                                            value={price.duration} onChange={e => handlePriceChange(index, 'duration', e.target.value)} />
                                    </div>
                                    <div className="flex-1">
                                        <select className="w-full bg-transparent border-b border-gray-700 py-1 text-gray-300 outline-none"
                                            value={price.unit} onChange={e => handlePriceChange(index, 'unit', e.target.value)}>
                                            <option value="HOUR">Hour(s)</option>
                                            <option value="DAY">Day(s)</option>
                                            <option value="WEEK">Week(s)</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <input type="number" className="w-full bg-transparent border-b border-gray-700 py-1 outline-none text-white"
                                            value={price.price} onChange={e => handlePriceChange(index, 'price', e.target.value)} />
                                    </div>
                                    {index > 0 && <button type="button" onClick={() => removePriceRow(index)} className="text-red-500 pb-1">×</button>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-center">{error}</p>}

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 font-bold transition-all flex-1">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-all flex-1">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
