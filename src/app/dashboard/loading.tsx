'use client'

import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5" style={{ minHeight: '300px' }}>
      <div className="position-relative d-flex align-items-center justify-content-center">
        {/* Glowing outer rotating ring */}
        <div className="spinner-ring"></div>
        {/* Pulsating center dot */}
        <div className="spinner-core bg-primary"></div>
      </div>
      <p className="mt-3 text-secondary small fw-medium tracking-wide animate-pulse">Memuat data...</p>

      <style jsx>{`
        .spinner-ring {
          width: 54px;
          height: 54px;
          border: 3px solid rgba(227, 27, 35, 0.08);
          border-top: 3px solid #E31B23;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .spinner-core {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          animation: pulse 1.2s ease-in-out infinite alternate;
        }
        .animate-pulse {
          animation: textPulse 1.2s ease-in-out infinite alternate;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(0.85); opacity: 0.5; }
          100% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes textPulse {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
