import React, { useState } from "react";
import {
  ChevronRight,
  BookOpen,
  Users,
  Brain,
  BarChart3,
  Video,
  FileText,
  Trophy,
  Sparkles,
  ArrowRight,
  Check,
  Play,
  PenTool,
  Eye,
} from "lucide-react";

const LandingPage = () => {
  const [activeRole, setActiveRole] = useState("teacher");

  const teacherFeatures = [
    {
      icon: <Video className="w-6 h-6" />,
      title: "Manage Video Playlists",
      description:
        "Create and organize your video lecture collections with ease",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Upload & Parse PDFs",
      description: "Automatically extract content from your lecture notes",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Generated MCQs",
      description:
        "Let Gemini AI create intelligent quiz questions from your content",
    },
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "Review & Edit Quizzes",
      description: "Fine-tune AI-generated questions before publishing",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description:
        "Monitor student performance with detailed AI-driven insights",
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Real-time Monitoring",
      description: "Track student progress and quiz results as they happen",
    },
  ];

  const studentFeatures = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Personalized Dashboard",
      description:
        "Access enrolled videos, notes, and available quizzes in one place",
    },
    {
      icon: <Play className="w-6 h-6" />,
      title: "Interactive Video Learning",
      description:
        "Watch lectures and access downloadable PDF notes seamlessly",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Quizzes",
      description: "Take intelligent MCQ assessments tailored to each lecture",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Instant Feedback",
      description: "Get immediate grading with AI-driven deep analytics",
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Performance Tracking",
      description: "Visualize your progress with detailed charts and metrics",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Learning Insights",
      description: "Understand your strengths and areas for improvement",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 text-purple-300 text-sm mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Advanced AI Technology
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Transform Education with
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                AI Assessment
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionize learning with our intelligent platform that
              automatically generates quizzes, provides deep analytics, and
              creates personalized learning experiences for both teachers and
              students.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button className="border border-gray-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
              Watch Demo
              <Play className="w-5 h-5 ml-2" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">10k+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">50k+</div>
              <div className="text-gray-400">Quizzes Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">95%</div>
              <div className="text-gray-400">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Toggle Section */}
      <section id="features" className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Built for Every Learning Role
            </h2>
            <p className="text-gray-300 text-lg">
              Discover how our platform serves both educators and learners
            </p>
          </div>

          {/* Role Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-800/50 rounded-full p-1 backdrop-blur-sm border border-gray-700">
              <button
                onClick={() => setActiveRole("teacher")}
                className={`px-8 py-3 rounded-full transition-all duration-300 flex items-center ${
                  activeRole === "teacher"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Users className="w-5 h-5 mr-2" />
                For Teachers
              </button>
              <button
                onClick={() => setActiveRole("student")}
                className={`px-8 py-3 rounded-full transition-all duration-300 flex items-center ${
                  activeRole === "student"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                For Students
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeRole === "teacher" ? teacherFeatures : studentFeatures).map(
              (feature, index) => (
                <div
                  key={index}
                  className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/50 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/30">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-300 text-lg">
              Simple steps to transform your educational experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Upload Content",
                desc: "Add your video lectures and PDF notes",
              },
              {
                step: "2",
                title: "AI Processing",
                desc: "Our AI analyzes and generates intelligent quizzes",
              },
              {
                step: "3",
                title: "Review & Publish",
                desc: "Fine-tune questions and make them available",
              },
              {
                step: "4",
                title: "Track Progress",
                desc: "Monitor performance with detailed analytics",
              },
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4 mx-auto">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400">{item.desc}</p>
                {index < 3 && (
                  <ChevronRight className="w-8 h-8 text-purple-400 absolute top-8 -right-4 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-12 border border-purple-500/30 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Teaching?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Join thousands of educators already using AI to enhance their
              teaching and student outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
                Start Free Trial
              </button>
              <button className="border border-gray-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">EduForce</span>
          </div>
          <p className="text-gray-400">© 2025 EduForce. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
