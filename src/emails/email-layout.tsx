import * as React from "react";

type EmailLayoutProps = {
  children: React.ReactNode;
  previewText?: string;
};

const containerStyle: React.CSSProperties = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  backgroundColor: "#f9f5ff",
  padding: "32px 24px",
  color: "#4c1d95",
  lineHeight: 1.5,
  minHeight: "600px",
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "32px",
};

const logoStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#4c1d95",
  textDecoration: "none",
  margin: 0,
};

const taglineStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b21a8",
  margin: "8px 0 0 0",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "32px",
  border: "1px solid #e2d9ff",
  maxWidth: "520px",
  margin: "0 auto 32px auto",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  maxWidth: "520px",
  margin: "0 auto",
  padding: "24px 0",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#a855f7",
  margin: "0 0 8px 0",
};

const footerLinkStyle: React.CSSProperties = {
  color: "#7c3aed",
  textDecoration: "none",
};

const dividerStyle: React.CSSProperties = {
  height: "1px",
  backgroundColor: "#e2d9ff",
  border: "none",
  margin: "16px 0",
};

export const EmailLayout = ({ children, previewText }: EmailLayoutProps) => (
  <>
    {previewText && (
      <div
        style={{
          display: "none",
          overflow: "hidden",
          lineHeight: "1px",
          opacity: 0,
          maxHeight: 0,
          maxWidth: 0,
        }}
        dangerouslySetInnerHTML={{ __html: previewText }}
      />
    )}
    <div style={containerStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <h1 style={logoStyle}>Tiny FS</h1>
        <p style={taglineStyle}>Secure file storage and sharing</p>
      </header>

      {/* Main Content */}
      <div style={cardStyle}>
        {children}
      </div>

      {/* Footer */}
      <footer style={footerStyle}>
        <hr style={dividerStyle} />
        <p style={footerTextStyle}>
          This email was sent by{" "}
          <a href={process.env.NEXT_PUBLIC_APP_URL || "https://tiny-box.com"} style={footerLinkStyle}>
            Tiny FS
          </a>
        </p>
        <p style={footerTextStyle}>
          Secure file storage and sharing built with Supabase
        </p>
        <p style={{ ...footerTextStyle, marginTop: "16px" }}>
          Need help?{" "}
          <a href="mailto:support@tiny-box.com" style={footerLinkStyle}>
            Contact Support
          </a>
        </p>
      </footer>
    </div>
  </>
);

export default EmailLayout;