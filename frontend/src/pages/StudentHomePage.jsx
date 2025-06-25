// src/pages/StudentHomePage.jsx
import React from "react";

const StudentHomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-4">Welcome, Student!</h1>
      <p className="text-xl text-gray-200">
        This is your personalized learning dashboard.
      </p>
      {/* Add student-specific content here */}
    </div>
  );
};

export default StudentHomePage;
