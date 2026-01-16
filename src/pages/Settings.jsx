import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { getGasUrl, setGasUrl } from '../services/api';
import StatusMessage from '../components/StatusMessage';

const Settings = () => {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        setUrl(getGasUrl());
    }, []);

    const handleSave = (e) => {
        e.preventDefault();
        setGasUrl(url.trim());
        setStatus({ type: 'success', message: '設定已儲存！' });
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">系統設定</h2>

            <div className="card p-8 shadow-2xl" style={{ width: '100%', maxWidth: '1024px', margin: '0 auto' }}>
                <form onSubmit={handleSave}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-400">Google Apps Script Web App URL</label>
                        <textarea
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/..."
                            className="input-field h-32 break-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            請輸入部署後的 GAS Web App 網址。
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                    >
                        <Save size={18} /> 儲存設定
                    </button>
                </form>
            </div>

            <StatusMessage
                type={status.type}
                message={status.message}
                onClose={() => setStatus({ type: '', message: '' })}
            />
        </div>
    );
};

export default Settings;
