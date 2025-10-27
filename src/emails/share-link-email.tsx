import * as React from "react";

type ShareLinkEmailProps = {
  ownerName: string;
  ownerEmail: string;
  fileName: string;
  shareUrl: string;
};

const containerStyle: React.CSSProperties = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  backgroundColor: "#f9f5ff",
  padding: "32px 24px",
  color: "#4c1d95",
  lineHeight: 1.5,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "24px",
  border: "1px solid #e2d9ff",
  maxWidth: "520px",
  margin: "0 auto",
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  textDecoration: "none",
  padding: "12px 20px",
  borderRadius: "9999px",
  fontWeight: 600,
  marginTop: "20px",
};

export const ShareLinkEmail = ({ ownerName, ownerEmail, fileName, shareUrl }: ShareLinkEmailProps) => (
  <div style={containerStyle}>
    <div style={cardStyle}>
      <h1 style={{ fontSize: "20px", margin: "0 0 16px" }}>You have a new file to view</h1>
      <p style={{ margin: "0 0 12px", color: "#6b21a8" }}>
        {ownerName} ({ownerEmail}) just shared <strong>{fileName}</strong> with you.
      </p>
      <p style={{ margin: "0 0 24px", color: "#6b21a8" }}>
        Click the button below to open the download page in Tiny Box. The link may expire, so make sure to save the file soon.
      </p>
      <a href={shareUrl} style={buttonStyle} target="_blank" rel="noreferrer">
        View and download file
      </a>
      <p style={{ marginTop: "32px", fontSize: "12px", color: "#A855F7" }}>
        If the button does not work, copy and paste this link into your browser: <br />
        <span style={{ wordBreak: "break-all" }}>{shareUrl}</span>
      </p>
    </div>
  </div>
);

export default ShareLinkEmail;
