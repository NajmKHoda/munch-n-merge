"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { updateUserProfile } from "@/lib/actions/user";
import { requestFriend } from "@/lib/actions/friend";

const DEFAULT_PROFILE_PIC = "/images/IconForWebsite.png";

export default function UserProfileClient({ user, isOwnProfile, friendCount, friendStatus: initialFriendStatus, userId }: {
  user: any;
  isOwnProfile: boolean;
  friendCount: number;
  friendStatus: string | null;
  userId: number;
}) {
  const [bio, setBio] = useState(user?.bio || "");
  const [editingBio, setEditingBio] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(user?.profile_picture || null);
  const [uploading, setUploading] = useState(false);
  const [friendStatus, setFriendStatus] = useState(initialFriendStatus);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If the profile is private and the viewer is not a friend and not the owner
  const isPrivateAndNotFriend = !isOwnProfile && !user.ispublic && friendStatus !== 'friends';

  // Editable bio save
  const handleBioSave = async () => {
    await updateUserProfile({ bio });
    setEditingBio(false);
  };

  // Editable profile picture
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await updateUserProfile({ profilePicture: base64 });
      setProfilePic(base64);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Friend request
  const handleAddFriend = async () => {
    setFriendStatus("sent");
    await requestFriend(userId);
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-xl border border-neutral-200 text-center">
        <h2 className="text-2xl font-bold mb-2 text-neutral-900">User Not Found</h2>
        <p className="text-neutral-500">This user does not exist.</p>
      </div>
    );
  }

  if (isPrivateAndNotFriend) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-xl border border-neutral-200">
        <div className="text-center mb-6">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <Image
              src={DEFAULT_PROFILE_PIC}
              alt={user.username + ' profile picture'}
              fill
              className="rounded-full object-cover border-4 border-indigo-400 bg-white shadow-lg opacity-50"
            />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-neutral-900">{user.username}</h2>
          <p className="text-neutral-500 mb-4">This profile is private</p>
          {friendStatus === 'none' && (
            <button
              onClick={handleAddFriend}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow transition-colors text-base"
            >
              Add Friend to View Profile
            </button>
          )}
          {friendStatus === 'sent' && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              </svg>
              Friend Request Sent
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-3xl shadow-2xl border border-indigo-100 relative">
      <div className="flex flex-col items-center">
        <div className="relative w-36 h-36 mb-4">
          <Image
            src={profilePic || DEFAULT_PROFILE_PIC}
            alt={user.username + ' profile picture'}
            fill
            className="rounded-full object-cover border-4 border-indigo-400 bg-white shadow-lg"
          />
          {isOwnProfile && (
            <button
              className="absolute bottom-2 right-2 bg-indigo-600 text-white rounded-full p-1 hover:bg-indigo-700 shadow-md border-2 border-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Change profile picture"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              edit
            </button>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleProfilePicChange}
            disabled={uploading}
          />
        </div>
        <h2 className="text-3xl font-extrabold mb-1 text-neutral-900 tracking-tight">{user.username}</h2>
        <div className="w-full text-center mt-2 mb-2">
          {isOwnProfile ? (
            editingBio ? (
              <div>
                <textarea
                  className="w-full p-2 border border-neutral-300 rounded mb-2 bg-white text-neutral-900"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <div className="flex justify-center gap-2">
                  <button
                    className="px-4 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold shadow"
                    onClick={handleBioSave}
                  >Save</button>
                  <button
                    className="px-4 py-1 bg-neutral-200 text-neutral-800 rounded hover:bg-neutral-300 font-semibold"
                    onClick={() => { setEditingBio(false); setBio(user.bio || ""); }}
                  >Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-neutral-700 min-h-[48px] text-lg">{bio || <span className="italic text-neutral-400">No bio yet.</span>}</p>
                <button
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-semibold shadow"
                  onClick={() => setEditingBio(true)}
                >Edit Bio</button>
              </div>
            )
          ) : (
            <p className="mb-2 text-neutral-700 min-h-[48px] text-lg">{bio || <span className="italic text-neutral-400">No bio yet.</span>}</p>
          )}
        </div>
        {/* Friend count below bio */}
        <div className="mb-4">
          <span className="inline-flex items-center px-4 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-base border border-indigo-200">
            <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            {friendCount} Friend{friendCount === 1 ? '' : 's'}
          </span>
        </div>
        {/* Friend status and actions for other users */}
        {!isOwnProfile && (
          <div className="flex flex-col items-center gap-2 mt-2 mb-2">
            {friendStatus === 'friends' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Friends
              </span>
            )}
            {friendStatus === 'sent' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Friend Request Sent
              </span>
            )}
            {friendStatus === 'received' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                Friend Request Received
              </span>
            )}
            {friendStatus === 'none' && (
              <button
                onClick={handleAddFriend}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow transition-colors text-base"
              >
                Add Friend
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 