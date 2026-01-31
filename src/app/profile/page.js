'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ProfilePage() {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bio: '',
        profilePhoto: ''
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
                    phone: data.phone || '',
                    bio: data.bio || '',
                    profilePhoto: data.profilePhoto || ''
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

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();
            if (data.url) {
                setFormData({ ...formData, profilePhoto: data.url });
            }
        } catch (err) {
            console.error('Upload error:', err);
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
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                        My Profile
                    </h1>
                    <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
                            {/* Profile Photo */}
                            <div className="relative inline-block mb-4">
                                {formData.profilePhoto || profile?.profilePhoto ? (
                                    <img 
                                        src={formData.profilePhoto || profile?.profilePhoto} 
                                        alt="Profile" 
                                        className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-5xl font-bold border-4 border-purple-500">
                                        {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                )}
                                {editing && (
                                    <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-500 transition-all">
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </label>
                                )}
                            </div>

                            <h2 className="text-xl font-bold">{profile?.name}</h2>
                            <p className="text-gray-400 text-sm">{profile?.email}</p>

                            {/* Credits */}
                            <div className="mt-6 p-4 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl border border-purple-500/30">
                                <p className="text-sm text-purple-300 mb-1">Your Credits</p>
                                <p className="text-3xl font-bold text-purple-400">{profile?.credits || 0}</p>
                            </div>

                            {/* Coupon Code */}
                            <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
                                <p className="text-sm text-gray-400 mb-2">Your Referral Code</p>
                                {profile?.ownCouponCode ? (
                                    <div className="flex items-center gap-2 justify-center">
                                        <code className="text-lg font-mono font-bold text-green-400 bg-green-900/30 px-3 py-1 rounded">
                                            {profile.ownCouponCode}
                                        </code>
                                        <button 
                                            onClick={copyCouponCode}
                                            className="p-2 hover:bg-gray-700 rounded-lg transition-all"
                                            title="Copy code"
                                        >
                                            {copied ? (
                                                <span className="text-green-400 text-sm">✓ Copied!</span>
                                            ) : (
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No referral code assigned</p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">Share this code with friends to earn credits!</p>
                            </div>

                            {/* Stats */}
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-800/50 rounded-xl">
                                    <p className="text-2xl font-bold">{profile?._count?.orders || 0}</p>
                                    <p className="text-xs text-gray-400">Orders</p>
                                </div>
                                <div className="p-3 bg-gray-800/50 rounded-xl">
                                    <p className="text-2xl font-bold">{profile?._count?.quotations || 0}</p>
                                    <p className="text-xs text-gray-400">Quotations</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Profile Details</h3>
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

                            <div className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Full Name</label>
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

                                {/* Bio */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Bio</label>
                                    {editing ? (
                                        <textarea 
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Tell us about yourself..."
                                            rows={3}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 resize-none"
                                        />
                                    ) : (
                                        <p className="text-gray-300">{profile?.bio || <span className="text-gray-500">No bio added</span>}</p>
                                    )}
                                </div>

                                {/* Member Since */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Member Since</label>
                                    <p className="text-lg">{new Date(profile?.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
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
