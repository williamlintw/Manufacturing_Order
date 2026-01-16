import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import IssueOrder from './pages/IssueOrder';
import QCRecord from './pages/QCRecord';
import ProductionRecord from './pages/ProductionRecord';
import QueryOrder from './pages/QueryOrder';
import Settings from './pages/Settings';
import './styles/index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/query" replace />} />
          <Route path="/issue" element={<IssueOrder />} />
          <Route path="/qc" element={<QCRecord />} />
          <Route path="/production" element={<ProductionRecord />} />
          <Route path="/query" element={<QueryOrder />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
