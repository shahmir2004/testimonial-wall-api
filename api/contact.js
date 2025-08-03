// portfolio-project/api/contact.js
import nodemailer from 'nodemailer';
import cors from 'cors';

// Helper to initialize and run CORS middleware
const corsMiddleware = cors({
  methods: ['POST', 'OPTIONS'], // Allow POST and OPTIONS for preflight
  // For production, you might want to restrict origin:
  // origin: process.env.VERCEL_ENV === 'production' ? 'https://your-deployed-domain.com' : '*',
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Nodemailer Transporter Setup
// Environment variables will be set in Vercel Project Settings
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your email provider
  auth: {
    user: process.env.EMAIL_USER_SENDER, // Your sending email (e.g., your Gmail)
    pass: process.env.EMAIL_PASS_SENDER, // Your Gmail App Password
  },
});

// Verify transporter (optional, good for local dev with `vercel dev`)
if (process.env.NODE_ENV !== 'production') { // Only verify in non-production to avoid issues on cold starts
    transporter.verify((error, success) => {
        if (error) {
            console.error('Error with email transporter config:', error.message);
        } else {
            console.log('Email transporter ready.');
        }
    });
}


export default async function handler(req, res) {
  // Run CORS middleware for every request to this function
  await runMiddleware(req, res, corsMiddleware);

  // Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const mailToOwnerOptions = {
      from: `"Shahmir - Portfolio <${process.env.EMAIL_USER_SENDER}>"`,
      to: process.env.EMAIL_RECEIVER, // Email where you receive contact messages
      replyTo: email, // Client's email for easy reply
      subject: `Testimonial wall Feedback ${name} (${email})`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email (Reply-To):</strong> ${email}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    const mailToUserOptions = {
      from: `"Testimonial Wall Feedback <${process.env.EMAIL_USER_SENDER}>"`,
      to: email,
      subject: "Thank you for contacting Shahmir Ahmed!",
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for reaching out through my Feedback form! I've received your message and will get back to you as soon as possible (typically within 24-48 hours).</p>
        <p>For your records, here's a copy of the message you sent:</p>
        <blockquote style="border-left: 2px solid #ccc; padding-left: 1em; margin-left: 0.5em; font-style: italic;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </blockquote>
        <p>Best regards,</p>
        <p>Shahmir Ahmed</p>
        ${process.env.VITE_SITE_URL ? `<p><a href="${process.env.VITE_SITE_URL}">${process.env.VITE_SITE_URL.replace(/^https?:\/\//, '')}</a></p>` : ''}
      `,
    };

    try {
      await transporter.sendMail(mailToOwnerOptions);
      console.log(`Notification email sent to ${process.env.EMAIL_RECEIVER} from ${email}`);

      try {
        await transporter.sendMail(mailToUserOptions);
        console.log(`Confirmation email sent to user: ${email}`);
      } catch (userEmailError) {
        console.error(`Failed to send confirmation email to ${email}:`, userEmailError.message);
        // Log this but don't fail the primary success response
      }

      return res.status(200).json({ success: true, message: 'Message sent successfully! You should receive a confirmation email shortly.' });
    } catch (error) {
      console.error('Error sending main notification email:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}