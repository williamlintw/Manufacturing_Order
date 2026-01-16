import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan, onError, onClose }) => {
    const scannerRef = useRef(null);
    const [scanError, setScanError] = useState(null);

    useEffect(() => {
        // Render scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                onScan(decodedText);
                scanner.clear(); // Stop scanning after success
            },
            (errorMessage) => {
                // parse error, ignore or log
                // setScanError(errorMessage);
                if (onError) onError(errorMessage);
            }
        );

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
            }
        };
    }, [onScan, onError]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 rounded-lg w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl font-bold"
                >
                    &times;
                </button>
                <h3 className="text-lg font-bold mb-4 text-center text-black">掃描 QR Code</h3>
                <div id="reader" width="100%"></div>
                {scanError && <p className="text-red-500 text-xs mt-2">{scanError}</p>}
            </div>
        </div>
    );
};

export default QRScanner;
