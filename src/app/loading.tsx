'use client'

import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
      <div className="position-relative d-flex align-items-center justify-content-center mb-4">
        {/* Glowing outer rotating ring */}
        <div className="spinner-ring"></div>
        {/* Pulsating center logo icon */}
        <div className="position-absolute spinner-logo">
          <svg viewBox="0 0 115 100" width="36" height="32" xmlns="http://www.w3.org/2000/svg">
            <path d="M 40 10 C 15 10, 5 25, 5 45 C 5 65, 15 80, 40 80 C 55 80, 65 72, 65 60 L 52 60 C 50 67, 45 70, 40 70 C 25 70, 17 58, 17 45 C 17 32, 25 20, 40 20 C 47 20, 52 25, 54 32 L 66 32 C 63 20, 52 10, 40 10 Z" fill="#E31B23" />
            <rect x="17" y="40" width="28" height="10" rx="3" fill="#E31B23" />
            <path d="M 80 10 C 55 10, 45 25, 45 45 C 45 65, 55 80, 80 80 C 105 80, 115 65, 115 45 C 115 25, 105 10, 80 10 Z M 80 20 C 93 20, 103 30, 103 45 C 103 60, 93 70, 80 70 C 67 70, 57 60, 57 45 C 57 30, 67 20, 80 20 Z" fill="#E31B23" />
            <path d="M 80 65 Q 81 48, 87 35 L 85 35 Q 79 48, 78 65 Z" fill="#E31B23" />
            <path d="M 86 35 Q 70 34, 62 44 Q 72 38, 86 35 Z" fill="#E31B23" />
            <path d="M 86 35 Q 75 22, 67 18 Q 78 24, 86 35 Z" fill="#E31B23" />
            <path d="M 86 35 Q 89 18, 93 14 Q 91 25, 86 35 Z" fill="#E31B23" />
            <path d="M 86 35 Q 102 24, 106 31 Q 95 31, 86 35 Z" fill="#E31B23" />
            <path d="M 86 35 Q 101 39, 103 48 Q 93 42, 86 35 Z" fill="#E31B23" />
          </svg>
        </div>
      </div>
      <h5 className="fw-bold text-dark tracking-wide mb-1">E-Organization UNSRAT</h5>
      <p className="text-secondary small fw-medium tracking-wide animate-pulse">Menghubungkan Portal...</p>

      <style jsx>{`
        .spinner-ring {
          width: 72px;
          height: 72px;
          border: 3.5px solid rgba(227, 27, 35, 0.08);
          border-top: 3.5px solid #E31B23;
          border-radius: 50%;
          animation: spin 1.2s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite;
        }
        .spinner-logo {
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
          0% { transform: scale(0.88); opacity: 0.6; }
          100% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes textPulse {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
