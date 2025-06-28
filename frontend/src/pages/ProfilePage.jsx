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
  ArrowLeft, // New: for the back button in the header
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const ProfilePage = () => {
  const { user, updateUser: updateAuthUser, isLoggedIn } = useAuth();
  const navigate = useNavigate(); // Initialize navigate

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Effect to load user data when component mounts or user changes in context
  useEffect(() => {
    if (user) {
      console.log("User data loaded:", user); // Log user data
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

  // Handle profile update (full name, and new optional fields)
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
        updateAuthUser(response.data); // Update user in AuthContext with new data
        // Re-set states based on returned data for consistency
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
        // Clear password fields
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

  if (loadingProfile && !profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <Loader className="w-12 h-12 animate-spin text-purple-400 mb-4" />
        <p className="text-xl">Loading profile...</p>
      </div>
    );
  }

  if (profileError && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <XCircle className="w-16 h-16 text-red-400 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Error Loading Profile</h2>
        <p className="text-lg text-red-300 text-center">{profileError}</p>
        <button
          onClick={() =>
            navigate(
              isLoggedIn
                ? user.role === "student"
                  ? "/student/home"
                  : "/teacher/home"
                : "/login"
            )
          }
          className="mt-8 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors duration-200 shadow-lg"
        >
          {isLoggedIn ? "Go to Home" : "Go to Login"}
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white group/design-root overflow-x-hidden"
      style={{ fontFamily: '"Inter", sans-serif' }}
    >
      {/* Main Content Area: Flex for mobile, Grid for medium+ screens */}
      <div className="flex flex-col md:grid md:grid-cols-3 gap-8 p-4 max-w-7xl mx-auto w-full">
        {/* Left Column: Profile Picture and Change Password */}
        <div className="md:col-span-1 flex flex-col items-center gap-8 w-full">
          {/* Profile Picture and Name/Role */}
          <div className="flex w-full flex-col gap-4 items-center">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32 border-4 border-purple-500 shadow-lg flex items-center justify-center text-6xl text-purple-200"
              style={{
                // Direct reference to the image in the public folder
                backgroundImage: `url('/Human Image.jpg')`, // Make sure the filename matches exactly, including case and extension
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
              // Fallback text/icon if image doesn't load or is missing
              onError={(e) => {
                e.target.style.backgroundImage = "none"; // Remove background image
                e.target.innerHTML = `<span class="text-purple-200 text-6xl">${(
                  user?.fullName || "P"
                )
                  .charAt(0)
                  .toUpperCase()}</span>`; // Display initial
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
              {/* This span will appear if the image fails to load or no fullName */}
              {user?.fullName ? null : (
                <span className="text-purple-200 text-6xl">P</span>
              )}
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">
                {user?.fullName || "Guest User"}
              </p>
              <p className="text-[#9daab8] text-base font-normal leading-normal text-center">
                {user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "Role Unknown"}
              </p>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="flex flex-col w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-pink-300 mb-4 flex items-center">
              <Lock className="w-6 h-6 mr-2" /> Change Password
            </h2>
            {passwordError && (
              <div className="bg-red-900/30 text-red-300 p-3 rounded-lg mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" /> {passwordError}
              </div>
            )}
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-gray-300 text-lg font-medium mb-2"
                >
                  Current Password:
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#293038] focus:border-none h-14 placeholder:text-[#9daab8] p-4 pl-12 text-base font-normal leading-normal" // Adjusted pl-12
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-gray-300 text-lg font-medium mb-2"
                >
                  New Password:
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#293038] focus:border-none h-14 placeholder:text-[#9daab8] p-4 pl-12 text-base font-normal leading-normal" // Adjusted pl-12
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirmNewPassword"
                  className="block text-gray-300 text-lg font-medium mb-2"
                >
                  Confirm New Password:
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    id="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#293038] focus:border-none h-14 placeholder:text-[#9daab8] p-4 pl-12 text-base font-normal leading-normal" // Adjusted pl-12
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-gradient-to-r from-red-600 to-orange-600 text-white text-base font-bold leading-normal tracking-[0.015em] hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                disabled={loadingPassword}
              >
                {loadingPassword ? (
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <KeyRound className="w-5 h-5 mr-2" />
                )}
                <span>
                  {loadingPassword ? "Changing..." : "Change Password"}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Profile Information Section */}
        <div className="md:col-span-2 flex flex-col w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center">
            <Edit className="w-6 h-6 mr-2" /> Edit Profile Information
          </h2>
          {profileError && (
            <div className="bg-red-900/30 text-red-300 p-3 rounded-lg mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" /> {profileError}
            </div>
          )}
          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="block text-gray-300 text-lg font-medium mb-2"
              >
                Full Name:
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#293038] focus:border-none h-14 placeholder:text-[#9daab8] p-4 pl-12 text-base font-normal leading-normal" // Adjusted pl-12
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-gray-300 text-lg font-medium mb-2"
              >
                Email:
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  // Removed onChange as it's not editable
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#293038] focus:border-none h-14 placeholder:text-[#9daab8] p-4 pl-12 text-base font-normal leading-normal opacity-70 cursor-not-allowed" // Added opacity and cursor styling
                  readOnly // Make the field read-only
                />
              </div>
            </div>

            {/* New Optional Fields */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-gray-300 text-lg font-medium mb-2"
              >
                Phone Number (Optional):
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#293038] focus:border-none h-14 placeholder:text-[#9daab8] p-4 pl-12 text-base font-normal leading-normal" // Adjusted pl-12
                  placeholder="e.g., +1234567890"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="dateOfBirth"
                className="block text-gray-300 text-lg font-medium mb-2"
              >
                Date of Birth (Optional):
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  id="dateOfBirth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#293038] focus:border-none h-14 placeholder:text-[#9daab8] p-4 pl-12 text-base font-normal leading-normal" // Adjusted pl-12
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="bio"
                className="block text-gray-300 text-lg font-medium mb-2"
              >
                Bio (Optional):
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-4 text-gray-400 w-5 h-5" />
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="4"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#293038] focus:border-none min-h-36 placeholder:text-[#9daab8] p-4 pl-12 text-base font-normal leading-normal" // Adjusted pl-12
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>
            </div>
            <div>
              <label
                htmlFor="interests"
                className="block text-gray-300 text-lg font-medium mb-2"
              >
                Interests (Optional, comma-separated):
              </label>
              <div className="relative">
                <Tags className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#293038] focus:border-none h-14 placeholder:text-[#9daab8] p-4 pl-12 text-base font-normal leading-normal" // Adjusted pl-12
                  placeholder="e.g., AI, Coding, History, Science"
                />
              </div>
            </div>
            {/* End New Optional Fields */}

            <button
              type="submit"
              className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-base font-bold leading-normal tracking-[0.015em] hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg transform hover:scale-105"
              disabled={loadingProfile}
            >
              {loadingProfile ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              <span>{loadingProfile ? "Saving..." : "Save Changes"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Spacer div from your HTML for bottom spacing */}
      <div className="h-5 bg-transparent"></div>
    </div>
  );
};

export default ProfilePage;
