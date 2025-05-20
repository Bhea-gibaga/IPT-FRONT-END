"use client";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Library System</h1>
          <p className="text-xl text-purple-100">Simple and Efficient</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-purple-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-purple-200">© {new Date().getFullYear()} Library Management System</p>
        </div>
      </footer>
    </div>
  );
} 