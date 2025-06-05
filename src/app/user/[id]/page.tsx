"use client";

import { useEffect, useState, useRef, use } from "react";
import Image from "next/image";
import { updateUserProfile } from "@/lib/actions/user";
import { requestFriend, getFriendCount, getFriendStatus } from "@/lib/actions/friend";
import { getPublicUserProfile } from '@/lib/actions/user';
import { getUser } from '@/lib/actions/auth';
import { useRouter } from "next/navigation";
import { getRecipesByUserId } from '@/lib/actions/recipe';
import Link from "next/link";

const DEFAULT_PROFILE_PIC = "/images/IconForWebsite.png";

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const userId = Number(use(params).id);
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCard, setShowCard] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setShowCard(false);
    async function fetchData() {
      const userData = await getPublicUserProfile(userId);
      if (!userData) {
        setLoading(false);
        return;
      }
      setUser(userData);
      setBio(userData.bio || "");
      setProfilePic(userData.profile_picture || null);
      setFriendCount(await getFriendCount(userId));
      const me = await getUser();
      setCurrentUser(me);
      if (me && userData && me.id !== userData.id) {
        const statusResult = await getFriendStatus(userId);
        if ('status' in statusResult) setFriendStatus(statusResult.status);
      }

      // Fetch user's recipes
      const recipesResult = await getRecipesByUserId(userId);
      if (!('error' in recipesResult)) {
        setRecipes(recipesResult.recipes);
      }

      setLoading(false);
      setTimeout(() => setShowCard(true), 10); // allow for transition
    }
    fetchData();
    // eslint-disable-next-line
  }, [userId]);

  const isOwnProfile = currentUser && user && currentUser.id === user.id;

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
      const result = await updateUserProfile({ profilePicture: base64 });
      if (result === 'success') {
        setProfilePic(base64);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Friend request
  const handleAddFriend = async () => {
    setFriendStatus("sent");
    await requestFriend(userId);
  };

  // Back button
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <span className="text-indigo-700 font-semibold text-lg">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-xl border border-neutral-200 text-center">
        <h2 className="text-2xl font-bold mb-2 text-neutral-900">User Not Found</h2>
        <p className="text-neutral-500">This user does not exist.</p>
        <button
          onClick={handleBack}
          className="mt-6 px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-semibold shadow"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-center items-center mb-8">
          <div
            className={`max-w-xl w-full mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-indigo-100 relative transition-all duration-500 ease-in-out
            ${showCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
            style={{ boxShadow: '0 8px 32px 0 rgba(60, 72, 180, 0.10)' }}
          >
            <button
              onClick={handleBack}
              className="absolute left-6 top-6 px-3 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-semibold shadow-sm text-base flex items-center gap-1"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <div className="flex flex-col items-center mt-4">
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
                      <p className="text-neutral-700 min-h-[48px] text-lg">{bio || <span className="italic text-neutral-400">No bio yet.</span>}</p>
                      <div className="flex justify-center">
                        <button
                          className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 font-semibold shadow-sm transition-colors text-base border border-indigo-200"
                          onClick={() => setEditingBio(true)}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit Bio
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-neutral-700 min-h-[48px] text-lg">{bio || <span className="italic text-neutral-400">No bio yet.</span>}</p>
                )}
              </div>
              {/* Friend count below bio */}
              <div className="mb-4 flex justify-center">
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
        </div>

        {/* Recipes Section */}
        <div className="mt-8 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-indigo-800">
            {isOwnProfile ? 'My Recipes' : `${user.username}'s Recipes`}
          </h2>
          
          {recipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map(recipe => (
                <div key={recipe.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  
                  <div className="p-4 ml-2">
                    <Link 
                      href={`/recipe/${recipe.id}`}
                      className="block mb-2"
                    >
                      <h2 className="text-xl font-bold text-gray-800 hover:text-indigo-600 transition-colors">
                        {recipe.name}
                      </h2>
                    </Link>
                    
                    <p className="text-gray-600 mb-3 text-sm">{recipe.description}</p>
                    
                    {/* Ingredients preview */}
                    {Object.keys(recipe.ingredients).length > 0 && (
                      <div className="mb-3">
                        <button 
                          className="text-amber-600 font-medium text-sm flex items-center mb-2 hover:text-amber-700"
                        >
                          Ingredients
                        </button>
                        
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(recipe.ingredients).slice(0, 3).map(ingredient => (
                            <span key={ingredient} className="bg-blue-50 text-indigo-700 text-xs px-2 py-1 rounded">
                              {ingredient}
                            </span>
                          ))}
                          {Object.keys(recipe.ingredients).length > 3 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{Object.keys(recipe.ingredients).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Difficulty Badge */}
                    {recipe.difficulty && (
                      <div className="absolute bottom-4 right-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${recipe.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                            recipe.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}
                        >
                          {recipe.difficulty}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-600 font-medium">
                {!isOwnProfile && !user.ispublic && friendStatus !== 'friends' 
                  ? 'Account is private' 
                  : isOwnProfile 
                    ? 'You haven\'t created any recipes yet' 
                    : `${user.username} hasn't created any recipes yet`
                }
              </p>
              {isOwnProfile && (
                <Link
                  href="/myrecipies"
                  className="inline-flex items-center px-4 py-2 mt-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Your First Recipe
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 