import * as React from "react";
import EmailLayout from "./email-layout";

type WelcomeEmailProps = {
  userName: string;
  userEmail: string;
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "9999px",
  fontWeight: 600,
  marginTop: "24px",
};

const featureListStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "20px 0",
};

const featureItemStyle: React.CSSProperties = {
  padding: "8px 0",
  color: "#6b21a8",
  display: "flex",
  alignItems: "center",
};

const checkmarkStyle: React.CSSProperties = {
  color: "#10b981",
  marginRight: "12px",
  fontWeight: "bold",
};

export const WelcomeEmail = ({ userName, userEmail }: WelcomeEmailProps) => (
  <EmailLayout previewText={`Welcome to Tiny Box, ${userName}!`}>
    <h1 style={{ fontSize: "28px", margin: "0 0 20px", fontWeight: 600 }}>
      Welcome to Tiny Box! 🎉
    </h1>
    <p style={{ margin: "0 0 20px", color: "#6b21a8", fontSize: "16px" }}>
      Hi <strong>{userName}</strong>,
    </p>
    <p style={{ margin: "0 0 20px", color: "#6b21a8" }}>
      Thanks for signing up for Tiny Box! We're excited to help you store, manage, and share your files securely.
    </p>
    
    <h2 style={{ fontSize: "18px", margin: "32px 0 16px", color: "#4c1d95" }}>
      Here's what you can do with Tiny Box:
    </h2>
    
    <ul style={featureListStyle}>
      <li style={featureItemStyle}>
        <span style={checkmarkStyle}>✓</span>
        Upload and store files securely in the cloud
      </li>
      <li style={featureItemStyle}>
        <span style={checkmarkStyle}>✓</span>
        Share files with expiring links for enhanced security
      </li>
      <li style={featureItemStyle}>
        <span style={checkmarkStyle}>✓</span>
        Make files public or keep them private
      </li>
      <li style={featureItemStyle}>
        <span style={checkmarkStyle}>✓</span>
        Send files directly via email
      </li>
    </ul>

    <div style={{ textAlign: "center", margin: "32px 0" }}>
      <a 
        href={`${process.env.NEXT_PUBLIC_APP_URL || "https://tiny-box.com"}/dashboard`} 
        style={buttonStyle} 
        target="_blank" 
        rel="noreferrer"
      >
        Go to Dashboard
      </a>
    </div>
    
    <p style={{ margin: "32px 0 0", color: "#6b21a8", fontSize: "14px" }}>
      If you have any questions, feel free to reply to this email or contact our support team.
    </p>
  </EmailLayout>
);

export default WelcomeEmail;