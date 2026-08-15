import './globals.css';

export const metadata = {
  title: 'Anurag LMS Portal',
  description: 'Learning Management System for Anurag University',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
