import React, { useState, useContext } from 'react'
import { UserContext } from '../App'
import { useNavigate } from 'react-router-dom'

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const { userAuth } = useContext(UserContext)
    const navigate = useNavigate()

    if (userAuth && userAuth.google_auth) {
        return (
            <div className="change-password-page min-h-screen bg-gray-50 py-8">
                <div className="max-w-md mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Change Password</h1>
                        <p className="text-gray-600">Update your account password</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <h2 className="text-xl font-semibold text-yellow-500 mb-4">Google Account Detected</h2>
                        <p className="text-gray-700 mb-4">
                            You signed up or log in using Google authentication.<br/>
                            Password changes are not available for Google-authenticated accounts.<br/>
                            To manage your password, please visit your Google Account settings.
                        </p>
                        <a
                            href="https://myaccount.google.com/security"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-4 px-6 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition-colors"
                        >
                            Go to Google Account Security
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccess(false)

        // Validation
        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match')
            setSaving(false)
            return
        }

        if (formData.newPassword.length < 6) {
            setError('New password must be at least 6 characters long')
            setSaving(false)
            return
        }

        try {
            const response = await fetch(import.meta.env.VITE_SERVER_DOMAIN + '/api/change-password', {
                method: 'PATCH',
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess(true)
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                })
                setTimeout(() => {
                    navigate('/profile')
                }, 3000)
            } else {
                setError(data.message || 'Failed to change password')
            }
        } catch (error) {
            console.error('Error changing password:', error)
            setError('Failed to change password')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="change-password-page min-h-screen bg-gray-50 py-8">
            <div className="max-w-md mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Change Password</h1>
                    <p className="text-gray-600">Update your account password</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Password *
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
                            />
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password *
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                required
                                minLength="6"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Must be at least 6 characters long
                            </p>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password *
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
                            />
                        </div>

                        {/* Password Strength Indicator */}
                        {formData.newPassword && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-700 mb-2">Password Strength:</p>
                                <div className="flex space-x-1">
                                    {[1, 2, 3, 4].map(level => {
                                        const isActive = formData.newPassword.length >= level * 2
                                        return (
                                            <div
                                                key={level}
                                                className={`flex-1 h-2 rounded ${
                                                    isActive 
                                                        ? formData.newPassword.length >= 8 
                                                            ? 'bg-green-500' 
                                                            : 'bg-yellow-500'
                                                        : 'bg-gray-200'
                                                }`}
                                            />
                                        )
                                    })}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.newPassword.length >= 8 
                                        ? 'Strong password' 
                                        : formData.newPassword.length >= 6 
                                            ? 'Good password' 
                                            : 'Weak password'
                                    }
                                </p>
                            </div>
                        )}

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                Password changed successfully! Redirecting to profile...
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {saving ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Tips */}
                <div className="mt-6 bg-yellow-30 p-4 rounded-lg">
                    <h3 className="font-medium text-yellow-300 mb-2">💡 Security Tips</h3>
                    <ul className="text-sm text-yellow-300 space-y-1">
                        <li>• Use a mix of letters, numbers, and symbols</li>
                        <li>• Avoid using personal information</li>
                        <li>• Don't reuse passwords from other accounts</li>
                        <li>• Consider using a password manager</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default ChangePassword
