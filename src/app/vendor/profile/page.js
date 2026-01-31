'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function VendorProfilePage() {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        gstin: '',
        category: '',
        phone: '',
        bio: '',
        profilePhoto: '',
        companyLogo: ''
    });

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/profile', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFormData({
                    name: data.name || '',
                    companyName: data.companyName || '',
                    gstin: data.gstin || '',
                    category: data.category || '',
                    phone: data.phone || '',
                    bio: data.bio || '',
                    profilePhoto: data.profilePhoto || '',
                    companyLogo: data.companyLogo || ''
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setEditing(false);
            }
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'profile') setUploadingPhoto(true);
        else setUploadingLogo(true);

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
            const data = await res.json();
            if (data.url) {
                if (type === 'profile') {
                    setFormData({ ...formData, profilePhoto: data.url });
                } else {
                    setFormData({ ...formData, companyLogo: data.url });
                }
            }
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setUploadingPhoto(false);
            setUploadingLogo(false);
        }
    };

    const copyCouponCode = () => {
        if (profile?.ownCouponCode) {
            navigator.clipboard.writeText(profile.ownCouponCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess(false);
        setChangingPassword(true);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            setChangingPassword(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(passwordData)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            setPasswordSuccess(true);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                setShowPasswordChange(false);
                setPasswordSuccess(false);
            }, 2000);
        } catch (err) {
            setPasswordError(err.message);
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-xl">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                        Vendor Profile
                    </h1>
                    <Link href="/vendor/dashboard" className="text-sm text-gray-400 hover:text-white">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Personal Profile */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
                            <div className="relative inline-block mb-4">
                                {formData.profilePhoto || profile?.profilePhoto ? (
                                    <img 
                                        src={formData.profilePhoto || profile?.profilePhoto} 
                                        alt="Profile" 
                                        className="w-28 h-28 rounded-full object-cover border-4 border-purple-500"
                                    />
                                ) : (
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-4xl font-bold border-4 border-purple-500">
                                        {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                )}
                                {editing && (
                                    <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-500 transition-all">
                                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'profile')} />
                                        {uploadingPhoto ? '...' : '📷'}
                                    </label>
                                )}
                            </div>

                            <h2 className="text-xl font-bold">{profile?.name}</h2>
                            <p className="text-gray-400 text-sm">{profile?.email}</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold">
                                {profile?.role}
                            </span>
                        </div>

                        {/* Company Logo */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <h3 className="font-bold mb-4">Company Logo</h3>
                            <div className="flex items-center gap-4">
                                {formData.companyLogo || profile?.companyLogo ? (
                                    <img 
                                        src={formData.companyLogo || profile?.companyLogo} 
                                        alt="Company Logo" 
                                        className="w-20 h-20 object-contain bg-white rounded-xl p-2"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                                        No Logo
                                    </div>
                                )}
                                {editing && (
                                    <label className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer text-sm transition-all">
                                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'logo')} />
                                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Credits */}
                        <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-2xl p-6">
                            <p className="text-sm text-purple-300 mb-1">Your Credits</p>
                            <p className="text-4xl font-bold text-purple-400">{profile?.credits || 0}</p>
                        </div>

                        {/* Referral Code */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <p className="text-sm text-gray-400 mb-3">Your Referral Code</p>
                            {profile?.ownCouponCode ? (
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-lg font-mono font-bold text-green-400 bg-green-900/30 px-3 py-2 rounded text-center">
                                        {profile.ownCouponCode}
                                    </code>
                                    <button 
                                        onClick={copyCouponCode}
                                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
                                    >
                                        {copied ? '✓' : '📋'}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No referral code assigned</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">Share this code to earn credits when others sign up!</p>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Business Details</h3>
                                {!editing ? (
                                    <button 
                                        onClick={() => setEditing(true)}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setEditing(false)}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Contact Name</label>
                                    {editing ? (
                                        <input 
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                        />
                                    ) : (
                                        <p className="text-lg">{profile?.name}</p>
                                    )}
                                </div>

                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Company Name</label>
                                    {editing ? (
                                        <input 
                                            type="text"
                                            value={formData.companyName}
                                            onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                        />
                                    ) : (
                                        <p className="text-lg">{profile?.companyName || <span className="text-gray-500">Not provided</span>}</p>
                                    )}
                                </div>

                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                                    <p className="text-lg text-gray-300">{profile?.email}</p>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                                    {editing ? (
                                        <input 
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+91 XXXXX XXXXX"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                        />
                                    ) : (
                                        <p className="text-lg">{profile?.phone || <span className="text-gray-500">Not provided</span>}</p>
                                    )}
                                </div>

                                {/* GSTIN */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">GSTIN (Tax ID)</label>
                                    {editing ? (
                                        <input 
                                            type="text"
                                            value={formData.gstin}
                                            onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                                            placeholder="22AAAAA0000A1Z5"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                        />
                                    ) : (
                                        <p className="text-lg font-mono">{profile?.gstin || <span className="text-gray-500">Not provided</span>}</p>
                                    )}
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Business Category</label>
                                    {editing ? (
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Events">Events & Party Supplies</option>
                                            <option value="Electronics">Electronics</option>
                                            <option value="Furniture">Furniture</option>
                                            <option value="Decor">Decor & Props</option>
                                            <option value="Equipment">Equipment & Tools</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    ) : (
                                        <p className="text-lg">{profile?.category || <span className="text-gray-500">Not specified</span>}</p>
                                    )}
                                </div>

                                {/* Bio - Full Width */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-400 mb-2">About Your Business</label>
                                    {editing ? (
                                        <textarea 
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Describe your business, services, and what makes you unique..."
                                            rows={4}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 resize-none"
                                        />
                                    ) : (
                                        <p className="text-gray-300">{profile?.bio || <span className="text-gray-500">No description added</span>}</p>
                                    )}
                                </div>
                            </div>

                            {/* Member Since */}
                            <div className="mt-6 pt-6 border-t border-gray-800">
                                <p className="text-sm text-gray-500">
                                    Member since {new Date(profile?.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Change Password Section */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Security</h3>
                                <button 
                                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all"
                                >
                                    {showPasswordChange ? 'Cancel' : 'Change Password'}
                                </button>
                            </div>

                            {showPasswordChange && (
                                <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                                    {passwordError && (
                                        <div className="p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-400 text-sm">
                                            {passwordError}
                                        </div>
                                    )}
                                    {passwordSuccess && (
                                        <div className="p-3 bg-green-900/30 border border-green-500 rounded-lg text-green-400 text-sm">
                                            Password changed successfully!
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                                        <input 
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            required
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">New Password</label>
                                        <input 
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            required
                                            minLength={8}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                                        <input 
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            required
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={changingPassword}
                                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-all disabled:opacity-50"
                                    >
                                        {changingPassword ? 'Changing Password...' : 'Update Password'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
