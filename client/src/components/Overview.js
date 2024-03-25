import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import backgroundImage from "../assets/background.png";

function Overview() {
  const [users, setUsers] = useState([]);
  const [hasGhostName, setHasGhostName] = useState(false);
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the current user has a ghost name
    if (isAuthenticated && currentUser?.ghostName !== null) {
      setHasGhostName(true);
    } else {
      setHasGhostName(false);
    }

    // Fetch users with ghost names
    fetch("/api/users-with-ghostnames", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error("Error fetching users:", error));
  }, [isAuthenticated, currentUser]);

  const handleLogoutClick = () => {
    logout();
  };

  const handleButtonClick = () => {
    if (!isAuthenticated) {
      navigate("/signin");
    } else {
      navigate("/form");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "absolute",
        top: 0,
        left: 0,
        backgroundImage: `url(${backgroundImage})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 1)",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "20px",
          width: "80%",
          maxHeight: "100vh",
          overflowY: "auto",
          borderRadius: "10px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h1>Welcome {currentUser?.email}!</h1>
          {currentUser?.isAuthenticated && (
            <button
              onClick={handleLogoutClick}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              Log Out
            </button>
          )}
        </div>
        <div
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            marginTop: "20px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ textAlign: "center", margin: "0 0 20px 0" }}>
            Ghost Names Picked by Other Users
          </h2>
          <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
            {users.map((user, index) => (
              <li
                key={index}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  background: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                  border: "1px solid #eee",
                  borderRadius: "5px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                <strong>{user.ghostName || "No Ghost Name"}</strong> - Picked by{" "}
                <em>{user.email}</em>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={handleButtonClick}
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "16px",
            display: "block",
            margin: "20px auto 0",
          }}
        >
          {hasGhostName
            ? "Change your current Phantom name"
            : "Get a Phantom name"}
        </button>
      </div>
    </div>
  );
}
export default Overview;
