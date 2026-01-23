import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';

const CameraCapture = ({ onCapture, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
    const [devices, setDevices] = useState([]);

    useEffect(() => {
        // Get list of cameras
        const getDevices = async () => {
            try {
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);
            } catch (err) {
                console.warn('Error enumerating devices:', err);
            }
        };
        getDevices();
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [facingMode]);

    const startCamera = async () => {
        stopCamera();
        setError('');
        try {
            const constraints = {
                video: {
                    facingMode: facingMode
                },
                audio: false
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError('無法存取相機，請確認瀏覽器權限或使用 HTTPS 連線。');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Set max dimensions
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let width = video.videoWidth;
            let height = video.videoHeight;

            // Calculate new dimensions
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;

            // Draw video frame to canvas
            context.drawImage(video, 0, 0, width, height);

            // Get base64 data
            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            // Stop camera and pass data back
            stopCamera();
            onCapture(imageData);
        }
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
            {/* Header */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                <span className="text-white font-bold text-lg">拍攝照片</span>
                <button
                    onClick={() => { stopCamera(); onClose(); }}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Video Preview */}
            <div className="w-full h-full flex items-center justify-center bg-black">
                {error ? (
                    <div className="text-red-500 text-center px-4">
                        <p className="mb-4 text-xl">⚠️</p>
                        <p>{error}</p>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Hidden Canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* specific controls */}

            <div className="absolute bottom-10 w-full flex justify-center items-center gap-8 pb-4 px-4">
                {/* Switch Camera Button (only if not error) */}
                {!error && (
                    <button
                        onClick={switchCamera}
                        className="flex flex-col items-center justify-center gap-1 p-3 bg-white/20 rounded-xl text-white hover:bg-white/30 backdrop-blur-md min-w-[80px]"
                        title="切換鏡頭"
                    >
                        <RefreshCw size={24} />
                        <span className="text-xs font-medium">切換鏡頭</span>
                    </button>
                )}

                {/* Capture Button */}
                {!error && (
                    <button
                        onClick={capturePhoto}
                        className="flex flex-col items-center justify-center gap-1 p-3 bg-white/20 rounded-xl text-white hover:bg-white/30 backdrop-blur-md min-w-[80px]"
                        title="拍照"
                    >
                        <Camera size={24} />
                        <span className="text-xs font-medium">拍照</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default CameraCapture;
