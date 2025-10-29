import * as React from "react";
import EmailLayout from "./email-layout";

type ShareLinkEmailProps = {
  ownerName: string;
  ownerEmail: string;
  fileName: string;
  shareUrl: string;
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

const fallbackLinkStyle: React.CSSProperties = {
  marginTop: "32px",
  fontSize: "12px",
  color: "#A855F7",
};

export const ShareLinkEmail = ({ ownerName, ownerEmail, fileName, shareUrl }: ShareLinkEmailProps) => (
  <EmailLayout previewText={`${ownerName} shared "${fileName}" with you`}>
    <h1 style={{ fontSize: "24px", margin: "0 0 20px", fontWeight: 600 }}>
      You have a new file to view
    </h1>
    <p style={{ margin: "0 0 16px", color: "#6b21a8", fontSize: "16px" }}>
      <strong>{ownerName}</strong> ({ownerEmail}) just shared <strong>"{fileName}"</strong> with you.
    </p>
    <p style={{ margin: "0 0 28px", color: "#6b21a8" }}>
      Click the button below to open the download page in Tiny Box. The link may expire, so make sure to save the file soon.
    </p>
    <div style={{ textAlign: "center", margin: "28px 0" }}>
      <a href={shareUrl} style={buttonStyle} target="_blank" rel="noreferrer">
        View and download file
      </a>
    </div>
    <p style={fallbackLinkStyle}>
      If the button does not work, copy and paste this link into your browser: <br />
      <span style={{ wordBreak: "break-all", fontFamily: "monospace" }}>{shareUrl}</span>
    </p>
  </EmailLayout>
);

export default ShareLinkEmail;
