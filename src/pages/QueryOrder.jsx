import React, { useState } from 'react';
import { Camera, Search, Download, Calendar } from 'lucide-react';
import { api } from '../services/api';
import QRScanner from '../components/QRScanner';
import StatusMessage from '../components/StatusMessage';

const QueryOrder = () => {
    const [filters, setFilters] = useState({
        orderId: '',
        startTime: '',
        finishTime: ''
    });
    const [data, setData] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const formatDate = (isoString) => {
        if (!isoString) return '';
        try {
            return new Date(isoString).toLocaleString('zh-TW');
        } catch {
            return isoString;
        }
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return 0;
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        return s && e ? (e - s) : 0;
    };

    const formatDuration = (ms) => {
        if (!ms) return '-';
        const seconds = Math.floor(ms / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const handleQuery = async () => {
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            // 1. Fetch all data
            const response = await api.queryOrders();
            let resultData = [];

            if (response.status === 'success' && Array.isArray(response.data)) {
                resultData = response.data;
            } else {
                throw new Error('資料格式錯誤');
            }

            // 2. Filter logic
            // Box 1 (orderId): exact/partial match? Requirement says "If empty, query all". If set, filter.
            // Box 2 (startTime): If empty, query start time > 0. If set, match.
            // Box 3 (finishTime): If empty, query all. If set, match.

            const filtered = resultData.filter(item => {
                // ID Filter
                const matchId = !filters.orderId || String(item.orderId).includes(filters.orderId);

                // Start Time Filter
                // Note: GAS returns formatted date strings usually or ISO.
                // If empty input: item.startTime must be present (length > 0)
                // If has input: item.startTime must include input (simple string match for now)
                const matchStart = !filters.startTime
                    ? (item.startTime && item.startTime !== "")
                    : (String(item.startTime).includes(filters.startTime));

                // Finish Time Filter
                // If empty input: All allowed (so true)
                // If has input: item.finishTime must include input
                const matchFinish = !filters.finishTime
                    ? true
                    : (String(item.finishTime).includes(filters.finishTime));

                return matchId && matchStart && matchFinish;
            });

            // Sort by Order ID
            filtered.sort((a, b) => String(a.orderId).localeCompare(String(b.orderId)));

            setData(filtered);

            // 3. Generate Stats
            // Group by Order ID? Or just list stats for filtered items?
            // Requirement: "Statistics of conforming orders, Total Production Time, Total Qty"
            // "Produce table, sorted by Order ID"
            // It implies a summary table.
            // Let's aggregate by ID just in case duplicates exist (though ID usually unique per run? "Manufacturing Order" implies unique ID).
            // If IDs are unique per row in 'Data' sheet, then stats is just the row.
            // But user said "Same order ID multiple rows sum"? -> "同製令各筆...加總"
            // So yes, aggregate by OrderID.

            const agg = {};
            filtered.forEach(item => {
                if (!agg[item.orderId]) {
                    agg[item.orderId] = {
                        orderId: item.orderId,
                        count: 0,
                        totalTimeMs: 0,
                        totalQty: 0
                    };
                }

                // Only count finished for stats
                if (item.finishTime && item.startTime) {
                    const output = parseInt(item.quantity) || 0;
                    const duration = calculateDuration(item.startTime, item.finishTime);
                    agg[item.orderId].count += 1;
                    agg[item.orderId].totalTimeMs += duration;
                    agg[item.orderId].totalQty += output;
                }
            });

            setStats(Object.values(agg).sort((a, b) => a.orderId.localeCompare(b.orderId)));

        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: '查詢失敗，請檢查網路或設定。' });
            // Mock data for dev if desired, but better to fail gracefull.
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportStats = () => {
        const header = ['製令編號', '總生產時間', '總產量'];
        const rows = stats.map(s => [s.orderId, formatDuration(s.totalTimeMs), s.totalQty]);
        const csvContent = '\uFEFF' + [header, ...rows].map(e => e.join(',')).join('\n');
        downloadCSV(csvContent, 'stats.csv');
    };

    const handleExportDetails = () => {
        const header = ['ID', '製令編號', '開工時間', '完工時間', '數量'];
        const rows = data.map(d => [d.id, d.orderId, formatDate(d.startTime), formatDate(d.finishTime), d.quantity]);
        const csvContent = '\uFEFF' + [header, ...rows].map(e => e.join(',')).join('\n');
        downloadCSV(csvContent, 'details.csv');
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">查詢統計</h2>

            {/* Query Filters */}
            <div className="card w-full mb-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">製令編號</label>
                        <div className="flex gap-2">
                            <input
                                className="input-field mb-0 h-12"
                                placeholder="全部"
                                value={filters.orderId}
                                onChange={e => setFilters({ ...filters, orderId: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="btn btn-secondary px-2 h-12 w-12"
                            >
                                <Camera size={18} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">開工時間</label>
                        <div className="flex gap-2">
                            <input
                                className="input-field mb-0 h-12"
                                placeholder="輸入時間關鍵字"
                                value={filters.startTime}
                                onChange={e => setFilters({ ...filters, startTime: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        document.getElementById('picker-start').showPicker();
                                    } catch (err) {
                                        console.error('Picker not supported');
                                    }
                                }}
                                className="btn btn-secondary px-2 h-12 w-12"
                            >
                                <Calendar size={18} />
                            </button>
                            <input
                                id="picker-start"
                                type="datetime-local"
                                style={{ width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }}
                                onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">完工時間</label>
                        <div className="flex gap-2">
                            <input
                                className="input-field mb-0 h-12"
                                placeholder="輸入時間關鍵字"
                                value={filters.finishTime}
                                onChange={e => setFilters({ ...filters, finishTime: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        document.getElementById('picker-finish').showPicker();
                                    } catch (err) {
                                        console.error('Picker not supported');
                                    }
                                }}
                                className="btn btn-secondary px-2 h-12 w-12"
                            >
                                <Calendar size={18} />
                            </button>
                            <input
                                id="picker-finish"
                                type="datetime-local"
                                style={{ width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }}
                                onChange={(e) => setFilters({ ...filters, finishTime: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
                <button onClick={handleQuery} disabled={loading} className="btn btn-primary w-full">
                    {loading ? '查詢中...' : <><Search size={18} /> 查詢</>}
                </button>
            </div>

            <StatusMessage
                type={status.type}
                message={status.message}
                onClose={() => setStatus({ type: '', message: '' })}
            />

            {/* Results - Stats */}
            {stats.length > 0 && (
                <div className="card animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">統計結果 (已完工)</h3>
                        <button onClick={handleExportStats} className="btn btn-secondary text-sm py-1 px-3">
                            <Download size={16} /> 下載
                        </button>
                    </div>
                    <div className="overflow-x-auto max-h-60 overflow-y-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-gray-400 border-b border-[#30363d]">
                                <tr>
                                    <th className="py-2">製令編號</th>
                                    <th className="py-2">總生產時間</th>
                                    <th className="py-2">總產量</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((row, i) => (
                                    <tr key={i} className="border-b border-[#30363d] last:border-0 hover:bg-[#21262d]">
                                        <td className="py-2 font-mono">{row.orderId}</td>
                                        <td className="py-2">{formatDuration(row.totalTimeMs)}</td>
                                        <td className="py-2">{row.totalQty}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Results - Details */}
            {data.length > 0 && (
                <div className="card animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">詳細資料</h3>
                        <button onClick={handleExportDetails} className="btn btn-secondary text-sm py-1 px-3">
                            <Download size={16} /> 下載
                        </button>
                    </div>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                            <thead className="text-gray-400 border-b border-[#30363d]">
                                <tr>
                                    <th className="py-2 px-2">製令編號</th>
                                    <th className="py-2 px-2">開工時間</th>
                                    <th className="py-2 px-2">完工時間</th>
                                    <th className="py-2 px-2">數量</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => (
                                    <tr key={i} className="border-b border-[#30363d] last:border-0 hover:bg-[#21262d]">
                                        <td className="py-2 px-2 font-mono">{row.orderId}</td>
                                        <td className="py-2 px-2">{formatDate(row.startTime)}</td>
                                        <td className="py-2 px-2">{formatDate(row.finishTime)}</td>
                                        <td className="py-2 px-2">{row.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showScanner && (
                <QRScanner
                    onScan={(txt) => { setFilters({ ...filters, orderId: txt }); setShowScanner(false); }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
};

export default QueryOrder;
