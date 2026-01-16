import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const StatusMessage = ({ type, message, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    const isSuccess = type === 'success';

    return (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 w-11/12 max-w-md animate-fade-in border ${isSuccess ? 'bg-[#1a2e23] border-[#238636] text-white' : 'bg-[#3e1b1b] border-[#da3633] text-white'
            }`}>
            {isSuccess ? <CheckCircle className="text-[#3fb950]" /> : <AlertCircle className="text-[#f85149]" />}
            <p className="flex-1 font-medium">{message}</p>
            <button onClick={onClose} className="opacity-70 hover:opacity-100">
                <X size={18} />
            </button>
        </div>
    );
};

export default StatusMessage;
