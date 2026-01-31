'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
    const { id: quotationId } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Review, 2: Address, 3: Payment

    // Address state
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
    });

    useEffect(() => {
        if (!quotationId) return;
        fetchQuotation();
        fetchAddresses();
    }, [quotationId]);

    const fetchQuotation = () => {
        fetch(`/api/quotations/${quotationId}`)
            .then(res => {
                if (!res.ok) throw new Error('Quotation not found');
                return res.json();
            })
            .then(data => {
                setQuotation(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    const fetchAddresses = async () => {
        try {
            const res = await fetch('/api/auth/addresses');
            if (res.ok) {
                const data = await res.json();
                setAddresses(data);
                if (data.length > 0) {
                    const defaultAddr = data.find(a => a.isDefault) || data[0];
                    setSelectedAddressId(defaultAddr.id);
                }
            }
        } catch (err) {
            console.error('Error fetching addresses:', err);
        }
    };

    const handleAddNewAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAddress)
            });
            if (!res.ok) throw new Error('Failed to add address');
            const data = await res.json();
            setAddresses([...addresses, data]);
            setSelectedAddressId(data.id);
            setShowNewAddressForm(false);
            setNewAddress({ street: '', city: '', state: '', postalCode: '', country: 'India' });
        } catch (err) {
            setError(err.message);
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayAndConfirm = async () => {
        if (!selectedAddressId && addresses.length === 0) {
            setError('Please add a delivery address');
            return;
        }

        setConfirming(true);
        setError('');

        try {
            const loaded = await loadRazorpay();
            if (!loaded) throw new Error('Failed to load payment gateway');

            const paymentRes = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: quotation.totalAmount, quotationId: quotation.id })
            });
            
            if (!paymentRes.ok) {
                const data = await paymentRes.json();
                throw new Error(data.error || 'Failed to create payment order');
            }
            
            const paymentData = await paymentRes.json();

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: paymentData.amount,
                currency: paymentData.currency,
                name: 'RentEZ',
                description: `Order for Quotation ${quotation.quotationNumber}`,
                order_id: paymentData.razorpayOrderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await fetch('/api/payments', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });
                        if (!verifyRes.ok) throw new Error('Payment verification failed');

                        const confirmRes = await fetch('/api/orders/confirm', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                quotationId, 
                                paymentId: response.razorpay_payment_id,
                                razorpayOrderId: response.razorpay_order_id,
                                addressId: selectedAddressId
                            })
                        });
                        const confirmData = await confirmRes.json();
                        if (!confirmRes.ok) throw new Error(confirmData.error || 'Failed to confirm order');
                        router.push(`/orders/${confirmData.orderId}?payment=success`);
                    } catch (err) {
                        setError(err.message);
                        setConfirming(false);
                    }
                },
                prefill: { name: quotation.customer?.name || '', email: quotation.customer?.email || '' },
                theme: { color: '#7c3aed' },
                modal: { ondismiss: () => setConfirming(false) }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            setError(err.message);
            setConfirming(false);
        }
    };

    const handleConfirmOrder = async () => {
        setConfirming(true);
        setError('');
        try {
            const res = await fetch('/api/orders/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quotationId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to confirm order');

            // Success
            router.push(`/orders?success=true&orderId=${data.orderId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white p-20 pt-32 text-center">Loading Quotation...</div>;
    if (error && !quotation) return <div className="min-h-screen bg-black text-white p-20 pt-32 text-center text-red-500">{error}</div>;
    if (!quotation) return null;

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                    Checkout
                </h1>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    {[
                        { num: 1, label: 'Review Order' },
                        { num: 2, label: 'Delivery Address' },
                        { num: 3, label: 'Payment' }
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                                step >= s.num ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'
                            }`}>
                                {step > s.num ? '✓' : s.num}
                            </div>
                            <span className={`ml-2 text-sm ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
                            {i < 2 && <div className={`w-12 h-0.5 mx-4 ${step > s.num ? 'bg-purple-600' : 'bg-gray-700'}`} />}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Step 1: Order Review */}
                        <div className={`bg-gray-900/50 border border-gray-800 rounded-2xl p-6 ${step !== 1 && 'opacity-60'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">📦 Order Items</h2>
                                {step > 1 && (
                                    <button onClick={() => setStep(1)} className="text-sm text-purple-400 hover:text-purple-300">Edit</button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {quotation.lines.map((line) => (
                                    <div key={line.id} className="flex justify-between items-center bg-black/40 p-4 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            {line.product?.imageUrls?.[0] && (
                                                <img src={line.product.imageUrls[0]} alt={line.product.name} className="w-14 h-14 object-cover rounded-lg" />
                                            )}
                                            <div>
                                                <p className="font-medium">{line.product.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${line.type === 'SALE' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                        {line.type === 'SALE' ? '🛒 Purchase' : '📅 Rental'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">Qty: {line.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="font-bold">₹{Number(line.lineTotal).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-800">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Rental Period:</span>
                                    <span className="text-white">
                                        {new Date(quotation.rentalStart).toLocaleDateString()} → {new Date(quotation.rentalEnd).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {step === 1 && (
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full mt-6 py-3 rounded-xl bg-purple-600 font-bold hover:bg-purple-500 transition-all"
                                >
                                    Continue to Delivery Address →
                                </button>
                            )}
                        </div>

                        {/* Step 2: Delivery Address */}
                        {step >= 2 && (
                            <div className={`bg-gray-900/50 border border-gray-800 rounded-2xl p-6 ${step !== 2 && 'opacity-60'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">📍 Delivery Address</h2>
                                    {step > 2 && (
                                        <button onClick={() => setStep(2)} className="text-sm text-purple-400 hover:text-purple-300">Edit</button>
                                    )}
                                </div>

                                {step === 2 && (
                                    <>
                                        <div className="space-y-3 mb-4">
                                            {addresses.map(addr => (
                                                <div
                                                    key={addr.id}
                                                    onClick={() => setSelectedAddressId(addr.id)}
                                                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${
                                                        selectedAddressId === addr.id 
                                                            ? 'border-purple-500 bg-purple-500/10' 
                                                            : 'border-gray-700 bg-black/40 hover:border-gray-600'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="font-medium">{addr.street}</p>
                                                            <p className="text-sm text-gray-400">{addr.city}, {addr.state} {addr.postalCode}</p>
                                                            <p className="text-sm text-gray-500">{addr.country}</p>
                                                        </div>
                                                        {selectedAddressId === addr.id && <span className="text-purple-400">✓</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {!showNewAddressForm ? (
                                            <button
                                                onClick={() => setShowNewAddressForm(true)}
                                                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-all"
                                            >
                                                + Add New Address
                                            </button>
                                        ) : (
                                            <form onSubmit={handleAddNewAddress} className="bg-black/40 p-4 rounded-xl space-y-4">
                                                <input type="text" placeholder="Street Address" value={newAddress.street}
                                                    onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} required
                                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" placeholder="City" value={newAddress.city}
                                                        onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} required
                                                        className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                                                    <input type="text" placeholder="State" value={newAddress.state}
                                                        onChange={(e) => setNewAddress({...newAddress, state: e.target.value})} required
                                                        className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" placeholder="Postal Code" value={newAddress.postalCode}
                                                        onChange={(e) => setNewAddress({...newAddress, postalCode: e.target.value})} required
                                                        className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                                                    <input type="text" placeholder="Country" value={newAddress.country}
                                                        onChange={(e) => setNewAddress({...newAddress, country: e.target.value})}
                                                        className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button type="button" onClick={() => setShowNewAddressForm(false)}
                                                        className="flex-1 py-3 rounded-xl bg-gray-700 font-bold hover:bg-gray-600 transition-all">Cancel</button>
                                                    <button type="submit" className="flex-1 py-3 rounded-xl bg-purple-600 font-bold hover:bg-purple-500 transition-all">Save Address</button>
                                                </div>
                                            </form>
                                        )}

                                        <button
                                            onClick={() => selectedAddressId ? setStep(3) : setError('Please select or add an address')}
                                            className="w-full mt-6 py-3 rounded-xl bg-purple-600 font-bold hover:bg-purple-500 transition-all"
                                        >
                                            Continue to Payment →
                                        </button>
                                    </>
                                )}

                                {step > 2 && selectedAddressId && (
                                    <div className="text-sm text-gray-400">
                                        {addresses.find(a => a.id === selectedAddressId)?.street}, {addresses.find(a => a.id === selectedAddressId)?.city}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {step >= 3 && (
                            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4">💳 Payment</h2>
                                <div className="bg-black/40 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-2xl">💳</span>
                                        <span className="font-medium">Pay securely with Razorpay</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        You will be redirected to Razorpay's secure payment page. We accept UPI, Cards, Net Banking, and Wallets.
                                    </p>
                                </div>

                                <button
                                    onClick={handlePayAndConfirm}
                                    disabled={confirming}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 font-bold text-lg hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50"
                                >
                                    {confirming ? 'Processing...' : `Pay ₹${Number(quotation.totalAmount).toLocaleString()} & Confirm Order`}
                                </button>
                                <p className="text-xs text-center text-gray-500 mt-4">🔒 Your payment is secured by Razorpay</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>₹{Number(quotation.subtotal).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Tax (18%)</span>
                                    <span>₹{Number(quotation.taxAmount).toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-gray-700 my-2"></div>
                                <div className="flex justify-between text-2xl font-bold text-white">
                                    <span>Total</span>
                                    <span>₹{Number(quotation.totalAmount).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-800">
                                <p className="text-sm text-gray-400 mb-1">Ordering as</p>
                                <p className="font-medium">{quotation.customer?.name}</p>
                                <p className="text-sm text-gray-500">{quotation.customer?.email}</p>
                            </div>
                            <div className="pt-4 mt-4 border-t border-gray-800">
                                <p className="text-sm text-gray-400 mb-1">Quotation</p>
                                <p className="font-mono text-sm">{quotation.quotationNumber}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
