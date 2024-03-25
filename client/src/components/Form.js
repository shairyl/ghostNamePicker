import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import backgroundImage from "../assets/background.png";

function Form() {
  const [rawGhostNames, setRawGhostNames] = useState([]);
  const [usedGhostNamesFull, setUsedGhostNamesFull] = useState([]);
  const [formattedGhostNames, setFormattedGhostNames] = useState([]);
  const [selectedGhostName, setSelectedGhostName] = useState("");
  const { isAuthenticated, currentUser, checkUserAuthentication } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchGhostNames();
      fetchUsedGhostNames();
    } else {
      navigate("/signin");
    }
  }, [isAuthenticated, currentUser, navigate]);

  const fetchGhostNames = () => {
    fetch("/api/ghostnames", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        setRawGhostNames(data);
      })
      .catch((error) => console.error("Error fetching ghost names:", error));
  };

  const fetchUsedGhostNames = () => {
    fetch("/api/users-with-ghostnames", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        const usedNamesFull = data.map((user) => user.ghostName);
        setUsedGhostNamesFull(usedNamesFull);
      })
      .catch((error) =>
        console.error("Error fetching used ghost names:", error)
      );
  };

  useEffect(() => {
    generateFormattedGhostNames();
  }, [rawGhostNames, usedGhostNamesFull, currentUser]);

  const generateFormattedGhostNames = () => {
    let attempts = 0;
    const maxAttempts = rawGhostNames.length * 2;
    const selectedNames = [];

    while (selectedNames.length < 3 && attempts < maxAttempts) {
      const randomIndex = Math.floor(Math.random() * rawGhostNames.length);
      const ghostName = rawGhostNames[randomIndex];
      const fullNameCombination = `${
        currentUser?.first_name || "User"
      } "${ghostName}" ${currentUser?.last_name || ""}`;

      if (
        !usedGhostNamesFull.includes(fullNameCombination) &&
        !selectedNames.includes(fullNameCombination)
      ) {
        selectedNames.push(fullNameCombination);
      }
      attempts++;
    }

    setFormattedGhostNames(selectedNames);
    if (selectedNames.length > 0) {
      setSelectedGhostName(selectedNames[0]); // Default to the first generated name
    }
  };

  const handleGenerateMore = () => {
    generateFormattedGhostNames(rawGhostNames);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("/api/update-ghostname", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ghostName: selectedGhostName,
      }),
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to update ghost name");
        return response.json();
      })
      .then(() => {
        checkUserAuthentication();
        navigate("/overview");
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <div
      style={{
        display: "flex",
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
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "40px",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "50%",
          maxWidth: "400px",
        }}
      >
        <h1 style={{ color: "#444", marginBottom: "20px" }}>
          What ghost name would you like to pick?
        </h1>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <select
            onChange={(e) => setSelectedGhostName(e.target.value)}
            value={selectedGhostName}
            style={{
              marginBottom: "20px",
              padding: "10px",
              width: "100%",
              borderRadius: "5px",
            }}
          >
            {formattedGhostNames.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            type="button"
            style={{
              cursor: "pointer",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "10px 20px",
              fontSize: "16px",
              marginBottom: "20px",
            }}
            onClick={handleGenerateMore}
          >
            Generate More
          </button>
          <button
            type="submit"
            style={{
              cursor: "pointer",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "10px 20px",
              fontSize: "16px",
              marginBottom: "20px",
            }}
          >
            Proceed
          </button>
        </form>
        <button
          onClick={() => navigate("/overview")}
          style={{
            cursor: "pointer",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "5px",
            padding: "10px 20px",
            fontSize: "16px",
          }}
        >
          Back to Overview
        </button>
      </div>
    </div>
  );
}
export default Form;
