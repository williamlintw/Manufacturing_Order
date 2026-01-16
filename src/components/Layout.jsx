import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, CheckCircle, PlayCircle, Search, Settings } from 'lucide-react';

const Layout = ({ children }) => {
    const location = useLocation();

    return (
        <div className="min-h-screen flex flex-col" style={{ width: '100vw', overflowX: 'hidden' }}>
            <header className="bg-[#161b22] border-b border-[#30363d] p-4 sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
                <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        製令紀錄回報台
                    </h1>
                </div>
            </header>

            <main
                className="animate-fade-in relative"
                style={{
                    flexGrow: 1,
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}
            >
                <div
                    style={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '95%',
                        maxWidth: '1280px',
                        margin: '0 auto'
                    }}
                >
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
