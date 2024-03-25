import React, { useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import backgroundImage from "../assets/background.png";

function SignIn() {
  const { isAuthenticated, checkUserAuthentication } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/form");
    }
  }, [isAuthenticated, navigate]);

  const handleSuccess = (tokenResponse) => {
    console.log("tokenResponse: ", tokenResponse);
    fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: tokenResponse.credential,
      }),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data: ", data);
        checkUserAuthentication();
        navigate("/form");
      })
      .catch((error) => {
        console.error("Authentication error:", error);
      });
  };

  const handleError = (error) => {
    console.error("Google Login Error:", error);
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
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "40px",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "50%",
          maxWidth: "400px",
        }}
      >
        <h1 style={{ color: "#444", marginBottom: "20px" }}>Sign In</h1>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          style={{
            cursor: "pointer",
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: "5px",
            padding: "10px 20px",
            fontSize: "16px",
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}

export default SignIn;
