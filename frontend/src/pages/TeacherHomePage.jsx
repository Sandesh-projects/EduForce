// src/pages/TeacherHomePage.jsx
import React from "react";

const TeacherHomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-teal-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-4">Welcome, Teacher!</h1>
      <p className="text-xl text-gray-200">
        Manage your classes and assessments here.
      </p>
      {/* Add teacher-specific content here */}
    </div>
  );
};

export default TeacherHomePage;
