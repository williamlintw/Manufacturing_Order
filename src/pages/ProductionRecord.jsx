import React, { useState } from 'react';
import { Camera, Play, CheckSquare } from 'lucide-react';
import { api } from '../services/api';
import QRScanner from '../components/QRScanner';
import StatusMessage from '../components/StatusMessage';

const ProductionRecord = () => {
    const [mode, setMode] = useState('start'); // 'start' or 'finish'

    // Form State
    const [orderId, setOrderId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // Reset status and success data when switching tabs logic is handled by 'mode' change in UI?
    // Actually the component re-uses state. If user switches Start<->Finish, we should probably clear status.
    // But sticking to minimal changes.

    const handleStart = async (e) => {
        e.preventDefault();
        if (!orderId.trim()) {
            setStatus({ type: 'error', message: '請輸入製令編號' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });
        setSuccessData(null);

        try {
            const result = await api.startWork(orderId);
            if (result.status === 'success') {
                setStatus({ type: 'success', message: result.message });
                setSuccessData({ ...result.data, type: 'start' });
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

    const handleFinish = async (e) => {
        e.preventDefault();
        if (!orderId.trim()) {
            setStatus({ type: 'error', message: '請輸入製令編號' });
            return;
        }
        if (!quantity || parseInt(quantity) < 0) {
            setStatus({ type: 'error', message: '請輸入有效的數量' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });
        setSuccessData(null);

        try {
            const result = await api.finishWork(orderId, parseInt(quantity));
            if (result.status === 'success') {
                setStatus({ type: 'success', message: result.message });
                setSuccessData({ ...result.data, type: 'finish' });
                setOrderId('');
                setQuantity('');
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
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">生產紀錄</h2>

            {/* Tabs */}
            <div className="flex mb-6 bg-[#21262d] p-1 rounded-lg border border-[#30363d] gap-4">
                <button
                    onClick={() => { setMode('start'); setStatus({ type: '', message: '' }); setSuccessData(null); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'start' ? 'bg-[#2f81f7] text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Play size={16} /> 開工
                </button>
                <button
                    onClick={() => { setMode('finish'); setStatus({ type: '', message: '' }); setSuccessData(null); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'finish' ? 'bg-[#238636] text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <CheckSquare size={16} /> 完工
                </button>
            </div>

            <div className="card p-8 shadow-2xl animate-fade-in" style={{ width: '100%', maxWidth: '1024px', margin: '0 auto' }}>
                {mode === 'start' ? (
                    <form onSubmit={handleStart}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-400">製令編號</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="輸入或掃描製令編號"
                                    className="input-field mb-0 h-12"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(true)}
                                    className="btn btn-secondary px-3 h-12 w-12"
                                    title="開啟相機"
                                    disabled={loading}
                                >
                                    <Camera size={20} />
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn w-full text-lg py-4 btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? '處理中...' : '紀錄開工'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleFinish}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-400">製令編號</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="輸入或掃描製令編號"
                                    className="input-field mb-0 h-12"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(true)}
                                    className="btn btn-secondary px-3 h-12 w-12"
                                    title="開啟相機"
                                    disabled={loading}
                                >
                                    <Camera size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="mb-6 animate-fade-in">
                            <label className="block text-sm font-medium mb-2 text-gray-400">完工數量</label>
                            <input
                                type="number"
                                min="0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="輸入數量"
                                className="input-field"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn w-full text-lg py-4 btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? '處理中...' : '紀錄完工'}
                        </button>
                    </form>
                )}
            </div>

            <StatusMessage
                type={status.type}
                message={status.message}
                onClose={() => setStatus({ type: '', message: '' })}
            />

            {/* Success Details & Image */}
            {successData && (
                <div className="card animate-fade-in p-6 mt-4" style={{ width: '100%', maxWidth: '1024px', margin: '0 auto' }}>
                    <h3 className={`text-lg font-bold mb-4 ${successData.type === 'start' ? 'text-green-400' : 'text-blue-400'}`}>
                        {successData.type === 'start' ? '開工紀錄明細' : '完工紀錄明細'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <table className="w-full text-sm text-left">
                                <tbody>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-2 text-gray-400">製令編號</th>
                                        <td className="py-2 font-mono">{successData.orderId}</td>
                                    </tr>
                                    {successData.type === 'start' && (
                                        <tr>
                                            <th className="py-2 text-gray-400">開工時間</th>
                                            <td className="py-2">{formatDate(successData.startTime)}</td>
                                        </tr>
                                    )}
                                    {successData.type === 'finish' && (
                                        <>
                                            <tr className="border-b border-gray-700">
                                                <th className="py-2 text-gray-400">開工時間</th>
                                                <td className="py-2">{formatDate(successData.startTime)}</td>
                                            </tr>
                                            <tr className="border-b border-gray-700">
                                                <th className="py-2 text-gray-400">完工時間</th>
                                                <td className="py-2">{formatDate(successData.finishTime)}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-2 text-gray-400">生產數量</th>
                                                <td className="py-2">{successData.quantity}</td>
                                            </tr>
                                        </>
                                    )}
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

export default ProductionRecord;
