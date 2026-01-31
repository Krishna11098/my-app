'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function OrderDetailsPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingReturn, setProcessingReturn] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnItems, setReturnItems] = useState([]);

    const paymentSuccess = searchParams.get('payment') === 'success';

    useEffect(() => {
        if (!id) return;
        fetchOrder();
    }, [id]);

    const fetchOrder = () => {
        fetch(`/api/orders/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Order not found');
                return res.json();
            })
            .then(data => {
                setOrder(data);
                if (data.lines) {
                    setReturnItems(data.lines.filter(l => l.type !== 'SALE').map(l => ({
                        productId: l.productId,
                        productName: l.product?.name,
                        quantity: l.quantity,
                        condition: 'GOOD'
                    })));
                }
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    const handleDownloadInvoice = () => {
        window.open(`/api/orders/${id}/invoice`, '_blank');
    };

    const handleProcessReturn = async () => {
        setProcessingReturn(true);
        try {
            const res = await fetch('/api/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: id, items: returnItems })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowReturnModal(false);
            fetchOrder();
            alert(`Return processed! ${data.lateDays > 0 ? `Late fee: ₹${data.lateFee.toFixed(2)}` : 'No late fees.'}`);
        } catch (err) {
            alert(err.message);
        } finally {
            setProcessingReturn(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white p-20 pt-32 text-center">Loading Order...</div>;
    if (error) return <div className="min-h-screen bg-black text-white p-20 pt-32 text-center text-red-500">{error}</div>;
    if (!order) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'PICKED_UP': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'RETURNED': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'OVERDUE': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        }
    };

    const canReturn = ['CONFIRMED', 'PICKED_UP', 'OVERDUE'].includes(order.status) && !order.return && returnItems.length > 0;
    const isOverdue = new Date() > new Date(order.rentalEnd) && !order.return;

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-5xl mx-auto">
                {/* Payment Success Banner */}
                {paymentSuccess && (
                    <div className="mb-6 bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                            <p className="font-bold text-green-400">Payment Successful!</p>
                            <p className="text-sm text-green-300/70">Your payment has been processed. Thank you!</p>
                        </div>
                    </div>
                )}

                {/* Overdue Warning Banner */}
                {isOverdue && (
                    <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-bold text-red-400">Rental Period Overdue!</p>
                            <p className="text-sm text-red-300/70">
                                Your rental was due on {new Date(order.rentalEnd).toLocaleDateString()}. 
                                Please return the items as soon as possible to avoid additional late fees.
                            </p>
                        </div>
                        {canReturn && (
                            <button
                                onClick={() => setShowReturnModal(true)}
                                className="ml-auto px-4 py-2 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition-all"
                            >
                                Return Now
                            </button>
                        )}
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <Link href="/orders" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">&larr; Back to Orders</Link>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                            Order {order.orderNumber}
                        </h1>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(order.status)}`}>
                        {order.status}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4">Order Items</h2>
                            <div className="space-y-3">
                                {order.lines?.map((line) => {
                                    const lineStart = line.rentalStart || order.rentalStart;
                                    const lineEnd = line.rentalEnd || order.rentalEnd;
                                    const lineDays = Math.ceil((new Date(lineEnd) - new Date(lineStart)) / (1000 * 60 * 60 * 24));
                                    
                                    return (
                                        <div key={line.id} className="bg-black/40 p-4 rounded-xl">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    {line.product?.imageUrls?.[0] && (
                                                        <img src={line.product.imageUrls[0]} alt={line.product.name} className="w-16 h-16 object-cover rounded-lg" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{line.product?.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${line.type === 'SALE' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                                {line.type === 'SALE' ? '🛒 Purchase' : '📅 Rental'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">Qty: {line.quantity}</span>
                                                        </div>
                                                        {line.type !== 'SALE' && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {new Date(lineStart).toLocaleDateString('en-IN')} - {new Date(lineEnd).toLocaleDateString('en-IN')} ({lineDays} days)
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-bold">₹{Number(line.lineTotal).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rental Period */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4">Rental Period</h2>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-400">Start Date</p>
                                    <p className="text-lg font-medium">{new Date(order.rentalStart).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div className="text-3xl text-gray-600">&rarr;</div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">End Date</p>
                                    <p className="text-lg font-medium">{new Date(order.rentalEnd).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Pickup & Return Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {order.pickup && (
                                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                                    <h3 className="font-bold mb-3 flex items-center gap-2">
                                        <span className="text-xl">📦</span> Pickup Details
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-gray-400">Pickup #:</span> {order.pickup.pickupNumber}</p>
                                        <p><span className="text-gray-400">Date:</span> {new Date(order.pickup.pickupDate).toLocaleDateString()}</p>
                                        <p><span className="text-gray-400">Status:</span> 
                                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${order.pickup.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {order.pickup.status}
                                            </span>
                                        </p>
                                        {order.pickup.instructions && <p className="text-gray-400 text-xs mt-2">{order.pickup.instructions}</p>}
                                    </div>
                                </div>
                            )}

                            {order.return && (
                                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                                    <h3 className="font-bold mb-3 flex items-center gap-2">
                                        <span className="text-xl">🔄</span> Return Details
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-gray-400">Return #:</span> {order.return.returnNumber}</p>
                                        <p><span className="text-gray-400">Date:</span> {new Date(order.return.returnDate).toLocaleDateString()}</p>
                                        <p><span className="text-gray-400">Status:</span> 
                                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${order.return.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {order.return.status}
                                            </span>
                                        </p>
                                        {order.return.lateDays > 0 && (
                                            <p className="text-red-400">Late by {order.return.lateDays} days - Fee: ₹{Number(order.return.lateFee).toLocaleString()}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Shipping / Delivery Info */}
                        {(order.pickupAddress || order.returnAddress) && (
                            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4">📍 Delivery Information</h2>
                                
                                {/* Delivery Method */}
                                <div className="mb-6 p-4 bg-black/40 rounded-xl">
                                    <p className="text-sm text-gray-400 mb-2">Delivery Method</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{order.deliveryMethod === 'PICKUP_FROM_STORE' ? '🏪' : '🚚'}</span>
                                        <p className="font-medium">{order.deliveryMethod === 'PICKUP_FROM_STORE' ? 'Pick up from Store' : 'Standard Delivery'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {order.pickupAddress && (
                                        <div>
                                            <p className="text-sm text-gray-400 mb-2">Delivery Address</p>
                                            <div className="text-sm space-y-1">
                                                {order.pickupAddress.label && <p className="text-purple-400 text-xs">{order.pickupAddress.label}</p>}
                                                <p className="font-medium">{order.customer?.name}</p>
                                                <p>{order.pickupAddress.street}</p>
                                                <p>{order.pickupAddress.city}, {order.pickupAddress.state} {order.pickupAddress.postalCode}</p>
                                                <p>{order.pickupAddress.country}</p>
                                            </div>
                                        </div>
                                    )}
                                    {order.billingAddress && !order.billingIsSame && (
                                        <div>
                                            <p className="text-sm text-gray-400 mb-2">Billing Address</p>
                                            <div className="text-sm space-y-1">
                                                {order.billingAddress.label && <p className="text-blue-400 text-xs">{order.billingAddress.label}</p>}
                                                <p className="font-medium">{order.customer?.name}</p>
                                                <p>{order.billingAddress.street}</p>
                                                <p>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}</p>
                                                <p>{order.billingAddress.country}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Payment Summary */}
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Payment Summary</h2>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>₹{Number(order.subtotal).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Tax (18%)</span>
                                    <span>₹{Number(order.taxAmount).toLocaleString()}</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                                        <span>-₹{Number(order.discountAmount).toLocaleString()}</span>
                                    </div>
                                )}
                                {order.securityDeposit > 0 && (
                                    <div className="flex justify-between text-gray-400">
                                        <span>Security Deposit</span>
                                        <span>₹{Number(order.securityDeposit).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="h-px bg-gray-700 my-2" />
                                <div className="flex justify-between text-xl font-bold">
                                    <span>Total</span>
                                    <span>₹{Number(order.totalAmount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-green-400">
                                    <span>Paid</span>
                                    <span>₹{Number(order.amountPaid).toLocaleString()}</span>
                                </div>
                                {(order.totalAmount - order.amountPaid) > 0 && (
                                    <div className="flex justify-between text-red-400 font-medium">
                                        <span>Balance Due</span>
                                        <span>₹{Number(order.totalAmount - order.amountPaid).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleDownloadInvoice}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                                >
                                    📄 View Invoice
                                </button>
                                
                                {order.invoice?.status !== 'PAID' && (order.totalAmount - order.amountPaid) > 0 && (
                                    <button
                                        onClick={() => router.push(`/orders/${id}/pay`)}
                                        className="w-full py-3 rounded-xl bg-green-600 font-bold hover:bg-green-500 transition-all"
                                    >
                                        💳 Pay Balance
                                    </button>
                                )}

                                {canReturn && (
                                    <button
                                        onClick={() => setShowReturnModal(true)}
                                        className="w-full py-3 rounded-xl bg-orange-600 font-bold hover:bg-orange-500 transition-all"
                                    >
                                        🔄 Initiate Return
                                    </button>
                                )}
                            </div>

                            {/* Invoice Status */}
                            {order.invoice && (
                                <div className="mt-6 pt-6 border-t border-gray-800">
                                    <p className="text-sm text-gray-400 mb-2">Invoice Status</p>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-sm">{order.invoice.invoiceNumber}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            order.invoice.status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                                            order.invoice.status === 'PARTIAL' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                            {order.invoice.status}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Return Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">🔄 Initiate Return</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Please select the condition of each item. Damaged items may incur additional fees.
                        </p>

                        <div className="space-y-4 mb-6">
                            {returnItems.map((item, index) => (
                                <div key={item.productId} className="bg-black/40 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{item.productName}</span>
                                        <span className="text-sm text-gray-400">Qty: {item.quantity}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const newItems = [...returnItems];
                                                newItems[index].condition = 'GOOD';
                                                setReturnItems(newItems);
                                            }}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                                item.condition === 'GOOD' 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                        >
                                            ✓ Good Condition
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newItems = [...returnItems];
                                                newItems[index].condition = 'DAMAGED';
                                                setReturnItems(newItems);
                                            }}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                                item.condition === 'DAMAGED' 
                                                    ? 'bg-red-600 text-white' 
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                        >
                                            ⚠ Damaged
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {isOverdue && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                                <p className="text-red-400 text-sm">
                                    ⚠️ <strong>Late Return:</strong> Your rental ended on {new Date(order.rentalEnd).toLocaleDateString()}. 
                                    Late fees will be calculated at 10% of the rental amount per day overdue.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReturnModal(false)}
                                className="flex-1 py-3 rounded-xl bg-gray-700 font-bold hover:bg-gray-600 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessReturn}
                                disabled={processingReturn}
                                className="flex-1 py-3 rounded-xl bg-orange-600 font-bold hover:bg-orange-500 transition-all disabled:opacity-50"
                            >
                                {processingReturn ? 'Processing...' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
