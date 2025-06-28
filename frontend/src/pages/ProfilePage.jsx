// frontend/src/pages/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "../axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Lock,
  Loader,
  Save,
  KeyRound,
  XCircle,
  AlertCircle,
  Edit,
  Phone,
  Calendar,
  BookOpen,
  Tags,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
  UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, updateUser: updateAuthUser, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Profile states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // UI states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    const length = password.length >= 8;

    let strength = 0;
    if (hasLower) strength++;
    if (hasUpper) strength++;
    if (hasNumbers) strength++;
    if (hasNonalphas) strength++;
    if (length) strength++;

    return {
      score: strength,
      text: strength < 2 ? "Weak" : strength < 4 ? "Medium" : "Strong",
      color:
        strength < 2
          ? "text-red-400"
          : strength < 4
          ? "text-yellow-400"
          : "text-green-400",
    };
  };

  // Effect to load user data
  useEffect(() => {
    if (user) {
      console.log("User data loaded:", user);
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhoneNumber(user.phoneNumber || "");
      setDateOfBirth(
        user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : ""
      );
      setBio(user.bio || "");
      setInterests(
        Array.isArray(user.interests) ? user.interests.join(", ") : ""
      );
      setLoadingProfile(false);
    } else if (!isLoggedIn && !loadingProfile) {
      setProfileError("Please log in to view your profile.");
      setLoadingProfile(false);
    }
  }, [user, isLoggedIn, loadingProfile]);

  // Handle profile update
  const handleProfileUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      setLoadingProfile(true);
      setProfileError(null);

      if (!fullName.trim()) {
        setProfileError("Full name cannot be empty.");
        setLoadingProfile(false);
        return;
      }

      try {
        const payload = {
          fullName,
          phoneNumber: phoneNumber.trim() === "" ? null : phoneNumber.trim(),
          dateOfBirth: dateOfBirth === "" ? null : dateOfBirth,
          bio: bio.trim() === "" ? null : bio.trim(),
          interests:
            interests.trim() === ""
              ? []
              : interests
                  .split(",")
                  .map((i) => i.trim())
                  .filter((i) => i !== ""),
        };

        const response = await axios.put("/api/auth/profile", payload);
        toast.success("Profile updated successfully!");
        updateAuthUser(response.data);

        // Update states with returned data
        setPhoneNumber(response.data.phoneNumber || "");
        setDateOfBirth(
          response.data.dateOfBirth
            ? new Date(response.data.dateOfBirth).toISOString().split("T")[0]
            : ""
        );
        setBio(response.data.bio || "");
        setInterests(
          Array.isArray(response.data.interests)
            ? response.data.interests.join(", ")
            : ""
        );
      } catch (error) {
        console.error("Error updating profile:", error);
        setProfileError(
          error.response?.data?.message || "Failed to update profile."
        );
        toast.error("Failed to update profile.");
      } finally {
        setLoadingProfile(false);
      }
    },
    [fullName, phoneNumber, dateOfBirth, bio, interests, updateAuthUser]
  );

  // Handle password change
  const handlePasswordChange = useCallback(
    async (e) => {
      e.preventDefault();
      setLoadingPassword(true);
      setPasswordError(null);

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setPasswordError("All password fields are required.");
        setLoadingPassword(false);
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setPasswordError("New passwords do not match.");
        setLoadingPassword(false);
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters long.");
        setLoadingPassword(false);
        return;
      }

      try {
        await axios.put("/api/auth/profile/password", {
          currentPassword,
          newPassword,
        });
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } catch (error) {
        console.error("Error changing password:", error);
        setPasswordError(
          error.response?.data?.message || "Failed to change password."
        );
        toast.error("Failed to change password.");
      } finally {
        setLoadingPassword(false);
      }
    },
    [currentPassword, newPassword, confirmNewPassword]
  );

  // Loading state
  if (loadingProfile && !profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-400 mb-4 mx-auto" />
          <p className="text-xl">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mb-6 mx-auto" />
          <h2 className="text-2xl font-bold mb-4">Error Loading Profile</h2>
          <p className="text-lg text-red-300 mb-6">{profileError}</p>
          <button
            onClick={() =>
              navigate(
                isLoggedIn
                  ? user?.role === "student"
                    ? "/student/home"
                    : "/teacher/home"
                  : "/login"
              )
            }
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors duration-200 shadow-lg"
          >
            {isLoggedIn ? "Go to Home" : "Go to Login"}
          </button>
        </div>
      </div>
    );
  }

  const passwordStrength = newPassword
    ? checkPasswordStrength(newPassword)
    : null;

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
      style={{ fontFamily: '"Inter", sans-serif' }}
    >
      {/* Header */}
      <div className="bg-gray-800/30 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Profile Settings
                </h1>
                <p className="text-gray-300 mt-1">
                  Manage your account information and security
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-white font-semibold">
                  {user?.fullName || "User"}
                </p>
                <p className="text-gray-300 text-sm capitalize">
                  {user?.role || "User"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800/20 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === "profile"
                  ? "border-purple-500 text-purple-300"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserCircle className="w-4 h-4" />
                <span>Profile Information</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === "security"
                  ? "border-purple-500 text-purple-300"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Security Settings</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4">
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Picture Section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Picture
                </h3>
                <div className="flex flex-col items-center space-y-4">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-32 h-32 border-4 border-purple-500 shadow-lg flex items-center justify-center text-6xl text-purple-200"
                    style={{
                      backgroundImage: `url('/Human Image.jpg')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                    onError={(e) => {
                      e.target.style.backgroundImage = "none";
                      e.target.innerHTML = `<span class="text-purple-200 text-6xl">${(
                        user?.fullName || "P"
                      )
                        .charAt(0)
                        .toUpperCase()}</span>`;
                      e.target.classList.remove(
                        "bg-cover",
                        "bg-center",
                        "bg-no-repeat"
                      );
                      e.target.classList.add(
                        "flex",
                        "items-center",
                        "justify-center"
                      );
                    }}
                  >
                    {user?.fullName ? null : (
                      <span className="text-purple-200 text-6xl">P</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-white text-xl font-bold">
                      {user?.fullName || "Guest User"}
                    </p>
                    <p className="text-gray-400 text-sm capitalize">
                      {user?.role
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : "Role Unknown"}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {user?.email || "No email"}
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors duration-200"
                    onClick={() =>
                      toast.info("Profile picture change feature coming soon!")
                    }
                  >
                    Change Picture
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-6 flex items-center">
                  <Edit className="w-5 h-5 mr-2" />
                  Personal Information
                </h3>

                {profileError && (
                  <div className="bg-red-900/30 text-red-300 p-4 rounded-lg mb-6 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-gray-300 text-sm font-medium mb-2"
                      >
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-gray-300 text-sm font-medium mb-2"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          id="email"
                          value={email}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="block text-gray-300 text-sm font-medium mb-2"
                      >
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label
                        htmlFor="dateOfBirth"
                        className="block text-gray-300 text-sm font-medium mb-2"
                      >
                        Date of Birth
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          id="dateOfBirth"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-gray-300 text-sm font-medium mb-2"
                    >
                      Bio
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-4 text-gray-400 w-5 h-5" />
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows="4"
                        className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label
                      htmlFor="interests"
                      className="block text-gray-300 text-sm font-medium mb-2"
                    >
                      Interests
                    </label>
                    <div className="relative">
                      <Tags className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="interests"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., AI, Coding, History, Science"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple interests with commas
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg text-white font-semibold transition-all duration-300 shadow-lg transform hover:scale-[1.02]"
                    disabled={loadingProfile}
                  >
                    {loadingProfile ? (
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    <span>
                      {loadingProfile ? "Saving Changes..." : "Save Changes"}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-purple-300 mb-6 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Change Password
              </h3>

              {passwordError && (
                <div className="bg-red-900/30 text-red-300 p-4 rounded-lg mb-6 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-gray-300 text-sm font-medium mb-2"
                  >
                    Current Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-gray-300 text-sm font-medium mb-2"
                  >
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordStrength && newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.score < 2
                                ? "bg-red-500"
                                : passwordStrength.score < 4
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${(passwordStrength.score / 5) * 100}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium ${passwordStrength.color}`}
                        >
                          {passwordStrength.text}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="confirmNewPassword"
                    className="block text-gray-300 text-sm font-medium mb-2"
                  >
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmNewPassword"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    {confirmNewPassword && newPassword && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        {confirmNewPassword === newPassword ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg text-white font-semibold transition-all duration-300 shadow-lg transform hover:scale-[1.02]"
                  disabled={loadingPassword}
                >
                  {loadingPassword ? (
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <KeyRound className="w-5 h-5 mr-2" />
                  )}
                  <span>
                    {loadingPassword
                      ? "Changing Password..."
                      : "Change Password"}
                  </span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer Spacer */}
      <div className="h-8 bg-transparent"></div>
    </div>
  );
};

export default ProfilePage;
