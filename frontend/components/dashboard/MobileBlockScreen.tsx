'use client';

import { ComputerDesktopIcon } from '@heroicons/react/24/outline';

export function MobileBlockScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ComputerDesktopIcon className="w-10 h-10 text-blue-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Dashboard Not Available</h1>

        <p className="text-gray-600 mb-6">
          The dashboard is designed for larger screens and is not available on mobile devices.
          Please use a laptop or desktop computer for the best experience.
        </p>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> You can still access basic features on mobile. Try visiting the{' '}
            <a href="/policies" className="underline font-medium">
              policies list
            </a>{' '}
            or
            <a href="/licenses" className="underline font-medium ml-1">
              licenses list
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
