import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <Image
              src="/logo.png"
              alt="AutoSecure Logo"
              width={60}
              height={60}
              className="rounded-full"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AutoSecure</h1>
          <p className="text-gray-600 mt-2">Insurance Management System</p>
        </div>

        {/* Auth Form Card */}
        <div className="card card-hover">{children}</div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 AutoSecure. All rights reserved.
        </p>
      </div>
    </div>
  );
}
