import React, { useState } from 'react';
import { Camera, Play, CheckSquare } from 'lucide-react';
import { api } from '../services/api';
import QRScanner from '../components/QRScanner';
import StatusMessage from '../components/StatusMessage';

const ProductionRecord = () => {
    const [activeTab, setActiveTab] = useState('start'); // 'start' or 'finish'

    // Form State
    const [orderId, setOrderId] = useState('');
    const [quantity, setQuantity] = useState('');

    // UI State
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            let result;
            if (activeTab === 'start') {
                result = await api.startWork(orderId);
            } else {
                // Validation for quantity
                if (quantity === '' || parseInt(quantity) < 0) {
                    throw new Error('請輸入有效的數量');
                }
                result = await api.finishWork(orderId, parseInt(quantity));
            }

            if (result.status === 'success') {
                setStatus({ type: 'success', message: result.message });
                setOrderId('');
                if (activeTab === 'finish') setQuantity('');
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

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">生產紀錄</h2>

            {/* Tabs */}
            <div className="flex mb-6 bg-[#161b22] p-1 rounded-lg border border-[#30363d] gap-4">
                <button
                    onClick={() => setActiveTab('start')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'start' ? 'bg-[#2f81f7] text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Play size={16} /> 開工
                </button>
                <button
                    onClick={() => setActiveTab('finish')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'finish' ? 'bg-[#238636] text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <CheckSquare size={16} /> 完工
                </button>
            </div>

            <div className="card p-8 shadow-2xl animate-fade-in" style={{ width: '100%', maxWidth: '1024px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
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

                    {activeTab === 'finish' && (
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
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn w-full text-lg py-4 ${activeTab === 'start' ? 'btn-primary' : 'bg-[#238636] hover:bg-[#2ea043] text-white'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? '處理中...' : (activeTab === 'start' ? '紀錄開工' : '紀錄完工')}
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

export default ProductionRecord;
