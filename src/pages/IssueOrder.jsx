import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { api } from '../services/api';
import QRScanner from '../components/QRScanner';
import StatusMessage from '../components/StatusMessage';

const IssueOrder = () => {
    const [orderId, setOrderId] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleIssue = async (e) => {
        e?.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const result = await api.issueOrder(orderId);
            if (result.status === 'success') {
                setStatus({ type: 'success', message: result.message });
                setOrderId('');
            } else {
                setStatus({ type: 'error', message: result.message });
            }
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleScan = (decodedText) => {
        setOrderId(decodedText);
        setShowScanner(false);
        // Optional: Auto-submit on scan
        // handleIssue(); 
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">製令發出</h2>

            <div className="card p-8 shadow-2xl" style={{ width: '100%', maxWidth: '1024px', margin: '0 auto' }}>
                <form onSubmit={handleIssue}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-400">製令編號</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="輸入或掃描製令編號"
                                className="input-field mb-0 h-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="btn btn-secondary px-3 h-12 w-12"
                                title="開啟相機"
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? '處理中...' : '發出製令'}
                    </button>
                </form>
            </div>

            <StatusMessage
                type={status.type}
                message={status.message}
                onClose={() => setStatus({ type: '', message: '' })}
            />

            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                    onError={(err) => console.log(err)}
                />
            )}
        </div>
    );
};

export default IssueOrder;
