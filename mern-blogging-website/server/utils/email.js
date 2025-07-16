// Email utility functions for sending various types of emails

import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
  // Check if required environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email configuration missing: EMAIL_USER and EMAIL_PASS must be set');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    secure: true,
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email configuration missing' };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send test to self
      subject: 'Email Configuration Test - Islamic Stories',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">Email Configuration Test</h2>
          <p>If you receive this email, your email configuration is working correctly!</p>
          <p><strong>Server:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email configuration test successful' };
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return { success: false, error: error.message };
  }
};

// Send verification email to new users
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email configuration missing' };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Islamic Stories',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">Welcome to Islamic Stories!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
          <a href="${process.env.FRONTEND_URL}/verify-user?token=${verificationToken}" 
             style="background-color: #2c5530; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${process.env.FRONTEND_URL}/verify-user?token=${verificationToken}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send newsletter verification email
export const sendNewsletterVerificationEmail = async (email, verificationToken) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email configuration missing' };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Newsletter Subscription - Islamic Stories',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">Newsletter Subscription</h2>
          <p>Thank you for subscribing to our newsletter! Please verify your email address by clicking the link below:</p>
          <a href="${process.env.FRONTEND_URL}/verify-newsletter?token=${verificationToken}" 
             style="background-color: #2c5530; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Subscription
          </a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${process.env.FRONTEND_URL}/verify-newsletter?token=${verificationToken}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending newsletter verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send contact form notification to admin
export const sendContactNotification = async (contactData) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email configuration missing' };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: 'New Contact Form Submission - Islamic Stories',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${contactData.name}</p>
          <p><strong>Email:</strong> ${contactData.email}</p>
          <p><strong>Subject:</strong> ${contactData.subject}</p>
          <p><strong>Message:</strong></p>
          <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${contactData.message}</p>
          <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending contact notification:', error);
    return { success: false, error: error.message };
  }
}; 

// Send newsletter to all active subscribers
export const sendNewsletterToSubscribers = async (subject, content, newsletterId = null) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email configuration missing' };
    }

    // Get all active newsletter subscribers
    const Newsletter = (await import('../Schema/Newsletter.js')).default;
    const subscribers = await Newsletter.find({ isActive: true });
    
    if (subscribers.length === 0) {
      return { success: false, error: 'No active subscribers found' };
    }

    const BATCH_SIZE = 50;
    const DELAY_BETWEEN_BATCHES_MS = 2000;
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Helper to delay between batches
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (subscriber) => {
        let attempts = 0;
        let sent = false;
        let lastError = null;
        while (attempts < 3 && !sent) {
          try {
            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: subscriber.email,
              subject: subject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2c5530;">Islamic Stories Newsletter</h2>
                  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                    ${content}
                  </div>
                  <hr style="margin: 20px 0;">
                  <p style="font-size: 12px; color: #666;">
                    You're receiving this email because you subscribed to our newsletter.
                    <br>
                    <a href="${process.env.FRONTEND_URL}/unsubscribe?token=${subscriber.unsubscribeToken}" 
                       style="color: #2c5530;">Unsubscribe</a>
                  </p>
                </div>
              `
            };
            await transporter.sendMail(mailOptions);
            sent = true;
            successCount++;
            return null;
          } catch (error) {
            attempts++;
            lastError = error;
            if (attempts >= 3) {
              failureCount++;
              errors.push({ email: subscriber.email, error: error.message });
              console.error(`Failed to send newsletter to ${subscriber.email} after 3 attempts:`, error);
              // Increment bounceCount and auto-deactivate if needed
              try {
                const updated = await Newsletter.findByIdAndUpdate(
                  subscriber._id,
                  { $inc: { bounceCount: 1 } },
                  { new: true }
                );
                if (updated && updated.bounceCount >= 3) {
                  await Newsletter.findByIdAndUpdate(subscriber._id, { isActive: false });
                  console.warn(`Auto-deactivated subscriber ${subscriber.email} due to repeated bounces.`);
                }
              } catch (dbErr) {
                console.error('Error updating bounceCount or deactivating:', dbErr);
              }
              return { email: subscriber.email, error: error.message };
            }
          }
        }
      }));
      // Wait between batches if not the last batch
      if (i + BATCH_SIZE < subscribers.length) {
        await delay(DELAY_BETWEEN_BATCHES_MS);
      }
    }

    return {
      success: true,
      totalSubscribers: subscribers.length,
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return { success: false, error: error.message };
  }
};

// Send newsletter to a single subscriber (for testing)
export const sendNewsletterToSubscriber = async (email, subject, content) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email configuration missing' };
    }

    // Find the subscriber to get their unsubscribeToken
    const Newsletter = (await import('../Schema/Newsletter.js')).default;
    const subscriber = await Newsletter.findOne({ email });
    const unsubscribeToken = subscriber?.unsubscribeToken || '';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">Islamic Stories Newsletter</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            ${content}
          </div>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            You're receiving this email because you subscribed to our newsletter.
            <br>
            <a href="${process.env.FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}" 
               style="color: #2c5530;">Unsubscribe</a>
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return { success: false, error: error.message };
  }
}; 