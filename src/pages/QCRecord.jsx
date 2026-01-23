import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { api } from '../services/api';
import QRScanner from '../components/QRScanner';
import StatusMessage from '../components/StatusMessage';

const QCRecord = () => {
    const [orderId, setOrderId] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [successData, setSuccessData] = useState(null);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!orderId.trim()) {
            setStatus({ type: 'error', message: '請輸入製令編號' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });
        setSuccessData(null);

        try {
            const result = await api.qcRecord(orderId);
            if (result.status === 'success') {
                setStatus({ type: 'success', message: result.message });
                setSuccessData(result.data); // data has orderId, issueTime, qcTime, imageUrl
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
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleString('zh-TW');
        } catch {
            return dateStr;
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#34d399' }}>首件檢驗</h2>

            <div className="card w-full mb-6 p-6">
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="text-sm text-gray-400 mb-2 block">製令編號</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="input-field flex-1"
                                placeholder="輸入或掃描製令編號"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="btn btn-secondary px-3"
                                disabled={loading}
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-3 text-lg"
                    >
                        {loading ? '處理中...' : '確認檢驗'}
                    </button>
                </form>
            </div>

            <StatusMessage
                type={status.type}
                message={status.message}
                onClose={() => setStatus({ type: '', message: '' })}
            />

            {/* Success Details & Image */}
            {successData && (
                <div className="card animate-fade-in p-6 mt-4">
                    <h3 className="text-lg font-bold mb-4 text-emerald-400">檢驗完成明細</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <table className="w-full text-sm text-left">
                                <tbody>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-2 text-gray-400">製令編號</th>
                                        <td className="py-2 font-mono">{successData.orderId}</td>
                                    </tr>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-2 text-gray-400">發出時間</th>
                                        <td className="py-2">{formatDate(successData.issueTime)}</td>
                                    </tr>
                                    <tr>
                                        <th className="py-2 text-gray-400">檢驗時間</th>
                                        <td className="py-2">{formatDate(successData.qcTime)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {successData.imageUrl && (
                            <div className="flex flex-col items-center">
                                <span className="text-sm text-gray-400 mb-2">料件照片</span>
                                <img
                                    src={successData.imageUrl}
                                    alt="Product"
                                    className="w-full h-48 object-cover rounded-lg border border-gray-600 shadow-lg"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

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

export default QCRecord;
