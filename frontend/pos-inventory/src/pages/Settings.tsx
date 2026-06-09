import React, { useState } from 'react';

const Settings: React.FC = () => {
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage('');
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSaveMessage('Settings saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleExport = () => {
        alert('Export functionality will be implemented soon. This will allow you to backup your store data.');
    };

    const handleImport = () => {
        alert('Import functionality will be implemented soon. This will allow you to restore or add data to your store.');
    };

    const handleClearData = () => {
        const confirm = window.confirm('⚠️ WARNING: This will permanently delete ALL store data. This action cannot be undone.\n\nAre you absolutely sure?');
        if (confirm) {
            alert('Data clear functionality is currently disabled for safety. Contact system administrator for data management.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Store Settings</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                    Manage your grocery store system configuration and data
                </p>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div className={`mb-6 p-4 rounded-xl text-sm sm:text-base flex items-center ${
                    saveMessage.includes('Error') 
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-green-50 border border-green-200 text-green-700'
                }`}>
                    <span className={`mr-3 text-lg ${saveMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                        {saveMessage.includes('Error') ? '⚠️' : '✅'}
                    </span>
                    {saveMessage}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 mb-0">
                <nav className="flex overflow-x-auto">
                    <button className="flex items-center space-x-2 px-6 py-4 font-medium text-green-700 border-b-2 border-green-700 bg-green-50 whitespace-nowrap text-sm sm:text-base">
                        <span className="text-lg">📊</span>
                        <span>Data Management</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-b-xl rounded-r-xl shadow-sm border border-t-0 border-gray-200 p-6 lg:p-8">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Data Management</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            Backup and manage your store data
                        </p>
                    </div>
                    
                    {/* Action Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Export Card */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 hover:border-green-400 transition-all hover:shadow-md">
                            <div className="flex items-center mb-5">
                                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm mr-4">
                                    <span className="text-2xl text-white">📤</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Export Store Data</h3>
                                    <p className="text-sm text-gray-600">Backup your sales and inventory data</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-700">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Export all sales history
                                </div>
                                <div className="flex items-center text-sm text-gray-700">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Backup product inventory
                                </div>
                                <div className="flex items-center text-sm text-gray-700">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Save as JSON file
                                </div>
                            </div>
                            <button 
                                onClick={handleExport}
                                className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm font-medium"
                            >
                                Export Data
                            </button>
                        </div>

                        {/* Import Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-all hover:shadow-md">
                            <div className="flex items-center mb-5">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm mr-4">
                                    <span className="text-2xl text-white">📥</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Import Data</h3>
                                    <p className="text-sm text-gray-600">Restore or add data to your store</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-700">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Import product catalog
                                </div>
                                <div className="flex items-center text-sm text-gray-700">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Restore from backup
                                </div>
                                <div className="flex items-center text-sm text-gray-700">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Supports JSON format
                                </div>
                            </div>
                            <button 
                                onClick={handleImport}
                                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm font-medium"
                            >
                                Import Data
                            </button>
                        </div>
                    </div>

                    {/* Backup Notice */}
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mr-4">
                                <span className="text-2xl text-yellow-600">💡</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">Backup Recommendation</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    It's recommended to export your data regularly to prevent data loss. 
                                    Store your backup files in a safe location.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                                <span className="text-2xl text-red-600">⚠️</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-red-800 text-lg">Danger Zone</h4>
                                <p className="text-sm text-red-700">
                                    Permanent actions that cannot be undone. Proceed with extreme caution.
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleClearData}
                            className="w-full bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 transition-all font-medium flex items-center justify-center space-x-2"
                        >
                            <span>🗑️</span>
                            <span>Clear All Store Data</span>
                        </button>
                        
                        <p className="text-xs text-red-600 mt-4 text-center">
                            ⚠️ This will permanently delete ALL store data and cannot be recovered.
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-8 mt-8 border-t border-gray-200">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 min-w-[180px]"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span>💾</span>
                                <span>Save Settings</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;