import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { uploadAvatar } from "../../utils/cloudinary";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

import "./Profile.scss";

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [wishlist, setWishlist] = useState("");
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        setProfile({
          ...data,
          wishlist: data.wishlist || "",
          premiumUntil: data.premiumUntil
            ? data.premiumUntil.toDate()
            : null,
          lastAvatarChange: data.lastAvatarChange?.toDate
            ? data.lastAvatarChange.toDate()
            : data.lastAvatarChange || null,
        });

        setWishlist(data.wishlist || "");
      }
    };

    fetchProfile();
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="profile-loading">
        <div className="profile-loading__spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  const handleAvatarChange = async () => {
    if (!avatarFile) return toast.info("Select a file");

    const canChange =
      !profile.lastAvatarChange ||
      (Date.now() - profile.lastAvatarChange.getTime()) /
        (1000 * 60 * 60 * 24) >=
        7;

    if (!canChange)
      return toast.info(
        "You can change your avatar once every 7 days",
      );

    const url = await uploadAvatar(avatarFile);

    await updateDoc(doc(db, "users", user.uid), {
      photoURL: url,
      lastAvatarChange: serverTimestamp(),
    });

    setProfile({
      ...profile,
      photoURL: url,
      lastAvatarChange: new Date(),
    });

    setAvatarFile(null);

    refreshUser();

    toast.success("Avatar updated");
  };

  const handleWishlistSave = async () => {
    if (!user) return;

    try {
      setWishlistLoading(true);

      await updateDoc(doc(db, "users", user.uid), {
        wishlist: wishlist.trim(),
        wishlistUpdatedAt: serverTimestamp(),
      });

      setProfile((prev) => ({
        ...prev,
        wishlist: wishlist.trim(),
      }));

      toast.success("Wishlist updated");
    } catch (err) {
      console.error(err);
      toast.error("Error updating wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleClose = () => navigate("/");

  let premiumDaysLeft = null;

  if (profile.premiumUntil) {
    const diffTime =
      profile.premiumUntil.getTime() - Date.now();

    premiumDaysLeft = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24),
    );
  }

  return (
    <div className="profile-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="profile-card"
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="profile-card__close"
          aria-label="Close profile"
        >
          <FaTimes />
        </button>

        {/* <div className="profile-card__accent" /> */}

        {/* Header */}
        <div className="profile-header">
          <div className="profile-header__avatar-wrapper">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Avatar"
                className="profile-header__avatar"
              />
            ) : (
              <div className="profile-header__avatar profile-header__avatar--placeholder">
                {profile.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}

            <div className="profile-header__avatar-overlay">
              <span>Upload new</span>
            </div>
          </div>

          <p className="profile-header__subtitle">
            Manage your personal space
          </p>
        </div>

        {/* Main sections */}
        <div className="profile-grid">

          {/* Avatar */}
          <div className="profile-section">
            <div className="profile-section__header">
              <h3>Avatar</h3>
              <span>Profile photo</span>
            </div>

            <div className="profile-file">
              <input
                type="file"
                onChange={(e) =>
                  setAvatarFile(e.target.files[0])
                }
                className="profile-file__input"
              />

              <div className="profile-file__label">
                <span>
                  {avatarFile
                    ? avatarFile.name
                    : "Choose image"}
                </span>
              </div>
            </div>

            <button
              onClick={handleAvatarChange}
              className="profile-button profile-button--primary"
            >
              Upload Avatar
            </button>
          </div>

          {/* Wishlist */}
          {profile.taker && (
            <div className="profile-section">
              <div className="profile-section__header">
                <h3>Wishlist</h3>
                <span>What you're looking for</span>
              </div>

              <textarea
                value={wishlist}
                onChange={(e) =>
                  setWishlist(e.target.value)
                }
                rows={4}
                className="profile-textarea"
                placeholder="Write what books you are looking for..."
              />

              <button
                onClick={handleWishlistSave}
                disabled={wishlistLoading}
                className="profile-button profile-button--primary"
              >
                {wishlistLoading ? "Saving..." : "Save Wishlist"}
              </button>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="profile-status">

          {profile.taker &&
            profile.premiumUntil &&
            premiumDaysLeft > 0 && (
              <div className="profile-status-card profile-status-card--premium">
                <div className="profile-status-card__icon">
                  ✦
                </div>

                <div>
                  <strong>Premium active</strong>
                  <span>
                    {premiumDaysLeft} days left
                  </span>
                </div>
              </div>
            )}

          {profile.lastAvatarChange && (
            <div className="profile-status-card profile-status-card--neutral">
              <div className="profile-status-card__content">
                <span>
                  Last avatar change
                </span>

                <strong>
                  {profile.lastAvatarChange.toLocaleDateString()}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="profile-logout"
        >
          Logout
        </button>
      </motion.div>
    </div>
  );
};

export default Profile;