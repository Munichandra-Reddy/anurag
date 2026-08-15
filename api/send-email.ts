import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Configure Nodemailer with provided credentials
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Assuming Gmail
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Anurag LMS" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
    
    console.log('Message sent: %s', info.messageId);
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
}
