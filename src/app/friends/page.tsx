"use client";

import { useState, useEffect, FormEvent } from 'react';
import { 
  getFriends, 
  getFriendRequests, 
  searchUsers, 
  requestFriend, 
  acceptFriendRequest, 
  deleteFriendRequest, 
  removeFriend 
} from '@/lib/actions/friend';
import { getUser } from '@/lib/actions/auth';
export default function FriendsPage() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: number; username: string }>>([]);
  const [friends, setFriends] = useState<Array<{ id: number; username: string }>>([]);
  const [friendRequests, setFriendRequests] = useState<Array<{
    id: number;
    from: { id: number; username: string };
    to: { id: number; username: string };
  }>>([]);
  const [loading, setLoading] = useState({
    search: false,
    requests: false,
    friends: false
  });
  const [error, setError] = useState<string | null>(null);

  // Load user, friends and friend requests on page load
  useEffect(() => {
    async function fetchUser() {
      const userData = await getUser();
      if (userData && typeof userData.id === "number" && typeof userData.username === "string") {
        setUser({ id: userData.id, username: userData.username });
      } else {
        setUser(null);
      }
    }
    fetchUser();
    loadFriends();
    loadFriendRequests();
  }, []);
  console.log(user)
  async function loadFriends() {
    setLoading(prev => ({ ...prev, friends: true }));
    const result = await getFriends();
    setLoading(prev => ({ ...prev, friends: false }));
    
    if ('error' in result) {
      setError(`Error loading friends: ${result.error}`);
    } else {
      setFriends(result.friends);
    }
  }

  async function loadFriendRequests() {
    setLoading(prev => ({ ...prev, requests: true }));
    const result = await getFriendRequests();
    setLoading(prev => ({ ...prev, requests: false }));
    console.log(result)
    if ('error' in result) {
      setError(`Error loading friend requests: ${result.error}`);
    } else {
      setFriendRequests(result.requests);
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, search: true }));
    const result = await searchUsers(searchQuery);
    console.log(result)
    setLoading(prev => ({ ...prev, search: false }));
    
    if ('error' in result) {
      setError(`Error searching users: ${result.error}`);
    } else {
      setSearchResults(result.users);
    }
  }

  async function handleSendRequest(userId: number) {
    const result = await requestFriend(userId);
    if ('error' in result) {
      setError(`Failed to send friend request: ${result.error}`);
    } else {
      // Remove user from search results to show the action was successful
      setSearchResults(prev => prev.filter(user => user.id !== userId));
      loadFriendRequests();
    }
  }

  async function handleAcceptRequest(requestId: number) {
    const result = await acceptFriendRequest(requestId);
    if (result !== 'success') {
      setError(`Failed to accept friend request: ${result}`);
    } else {
      loadFriendRequests();
      loadFriends();
    }
  }

  async function handleDeclineRequest(requestId: number) {
    const result = await deleteFriendRequest(requestId);
    if (result !== 'success') {
      setError(`Failed to decline friend request: ${result}`);
    } else {
      loadFriendRequests();
    }
  }

  async function handleRemoveFriend(friendId: number) {
    const result = await removeFriend(friendId);
    if (result !== 'success') {
      setError(`Failed to remove friend: ${result}`);
    } else {
      loadFriends();
    }
  }

  // Helper to check if a request is incoming
  const isIncomingRequest = (request: typeof friendRequests[0]) => {
    return user && request.to.id === user.id;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-indigo-800">Friends</h1>
      
      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-current opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search for users */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">Find Friends</h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username"
            className="flex-grow p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            minLength={2}
          />
          <button 
            type="submit" 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
            disabled={loading.search}
          >
            {loading.search ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Search
              </>
            )}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="bg-gray-50 rounded-md border border-gray-200 p-4">
            <h3 className="font-medium mb-2 text-gray-700">Search Results</h3>
            <ul className="divide-y divide-gray-200">
              {searchResults.map(user => (
                <li key={user.id} className="py-3 flex justify-between items-center">
                  <span className="font-medium text-gray-800">{user.username}</span>
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    className="bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 transition-colors flex items-center gap-1 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Friend
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && !loading.search && (
          <p className="text-gray-500 p-4 text-center bg-gray-50 rounded-md">No users found</p>
        )}
      </div>

      {/* Friend Requests */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">Friend Requests</h2>
        {loading.requests ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : friendRequests.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {friendRequests.map(request => (
              <li key={request.id} className="py-3">
                <div className="flex justify-between items-center">
                  <div>
                    {isIncomingRequest(request) ? (
                      <p className="text-gray-800"><strong className="font-medium">{request.from.username}</strong> wants to be your friend</p>
                    ) : (
                      <p className="text-gray-800">Friend request sent to <strong className="font-medium">{request.to.username}</strong></p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isIncomingRequest(request) && (
                      <>
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors flex items-center gap-1 text-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.id)}
                          className="bg-white text-red-500 border border-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition-colors flex items-center gap-1 text-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Decline
                        </button>
                      </>
                    )}
                    {!isIncomingRequest(request) && (
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 transition-colors flex items-center gap-1 text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 p-4 text-center bg-gray-50 rounded-md">No pending friend requests</p>
        )}
      </div>

      {/* Friends List */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">Your Friends</h2>
        {loading.friends ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : friends.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {friends.map(friend => (
              <li key={friend.id} className="py-3 flex justify-between items-center">
                <span className="font-medium text-gray-800">{friend.username}</span>
                <button
                  onClick={() => handleRemoveFriend(friend.id)}
                  className="bg-white text-red-500 border border-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition-colors flex items-center gap-1 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Friends Yet</h3>
            <p className="text-gray-500 mb-4">You haven't added any friends yet.</p>
            <p className="text-gray-600">Search for users to find friends.</p>
          </div>
        )}
      </div>
    </div>
  );
}
