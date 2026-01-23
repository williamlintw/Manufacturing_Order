import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan, onError, onClose }) => {
    const scannerRef = useRef(null);
    // Use refs to store latest callbacks to avoid re-initializing scanner when they change
    const onScanRef = useRef(onScan);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onScanRef.current = onScan;
        onErrorRef.current = onError;
    }, [onScan, onError]);

    useEffect(() => {
        // Prevent double initialization if already exists
        if (scannerRef.current) return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                if (onScanRef.current) onScanRef.current(decodedText);
            },
            (errorMessage) => {
                if (onErrorRef.current) onErrorRef.current(errorMessage);
            }
        );

        return () => {
            if (scanner) {
                scanner.clear().catch(error => {
                    console.warn("Failed to clear html5-qrcode scanner. ", error);
                });
            }
            scannerRef.current = null;
        };
    }, []);

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
            </div>
        </div>
    );
};

export default QRScanner;
