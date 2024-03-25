import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserAuthentication();
  }, []);
  const checkUserAuthentication = () => {
    fetch("/api/check-session", {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Session check failed");
        return response.json();
      })
      .then((user) => {
        setCurrentUser({
          ...user,
          isAuthenticated: true,
        });
      })
      .catch(() => {
        setCurrentUser({ isAuthenticated: false }); // Mark user as not authenticated
      })
      .finally(() => setIsLoading(false));
  };

  const logout = () => {
    fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        setCurrentUser({ isAuthenticated: false });
      })
      .catch((error) => console.error("Logout failed", error));
  };

  const value = {
    currentUser,
    isAuthenticated: currentUser?.isAuthenticated,
    checkUserAuthentication,
    setIsLoading,
    setCurrentUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
