import React, { useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { api } from '../services/api';
import QRScanner from '../components/QRScanner';
import CameraCapture from '../components/CameraCapture';
import StatusMessage from '../components/StatusMessage';

const IssueOrder = () => {
    const [orderId, setOrderId] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [showScanner, setShowScanner] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const fileInputRef = React.useRef(null);
    // cameraInputRef is no longer needed for the button, but we can keep it if we want a fallback or just remove usage. 
    // We will remove its usage for the camera button.

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!orderId.trim()) {
            setStatus({ type: 'error', message: '請輸入製令編號' });
            return;
        }

        if (!preview) {
            setStatus({ type: 'error', message: '請上傳料件照片 (必需)' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            let imageBase64 = null;
            if (preview) {
                // Use preview directly as it contains the base64 string (either from file reader or camera capture)
                imageBase64 = preview;
            }

            const result = await api.issueOrder(orderId, imageBase64);
            if (result.status === 'success') {
                setStatus({ type: 'success', message: `${result.message} (編號: ${orderId})` });
                setOrderId('');
                setImage(null);
                setPreview('');
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
        // handleSubmit(); 
    };

    const handleCapture = (base64Image) => {
        setPreview(base64Image);
        // We don't have a File object here, but handleSubmit now uses preview (base64) directly.
        // If other logic needs 'image' state to be truthy, we can set a dummy or rely on preview.
        setImage(true); // Set truthy to indicate image presence if needed, though handleSubmit checks preview
        setShowCamera(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">製令發出</h2>

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

                    {/* Image Capture Section */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm text-gray-400">料件圖</label>
                            {preview && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="btn btn-secondary text-xs px-3 py-1 bg-white/10 hover:bg-white/20"
                                        disabled={loading}
                                    >
                                        重新上傳
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCamera(true)}
                                        className="btn btn-secondary text-xs px-3 py-1 bg-white/10 hover:bg-white/20"
                                        disabled={loading}
                                    >
                                        <Camera size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Hidden Inputs */}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            ref={fileInputRef}
                            style={{ display: 'none' }} // Force hide
                        />
                        {/* Camera input removed in favor of custom component */}

                        {!preview ? (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="btn btn-secondary flex-1 py-3 flex items-center justify-center gap-2 border-dashed border-2 border-gray-600 hover:border-gray-400"
                                    disabled={loading}
                                >
                                    <Upload size={20} />
                                    <span>上傳照片</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCamera(true)}
                                    className="btn btn-secondary w-16 flex items-center justify-center border-dashed border-2 border-gray-600 hover:border-gray-400"
                                    title="拍攝照片"
                                    disabled={loading}
                                >
                                    <Camera size={24} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-lg border border-gray-600"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-3 text-lg"
                    >
                        {loading ? '處理中...' : '確認發出'}
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

            {showCamera && (
                <CameraCapture
                    onCapture={handleCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </div>
    );
};

export default IssueOrder;
