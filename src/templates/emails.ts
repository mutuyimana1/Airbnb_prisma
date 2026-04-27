// Each function takes the dynamic data and returns a complete HTML string
// In a real app you might use a templating engine like Handlebars or MJML
// for more complex designs

export function welcomeEmail(name: string,role:string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF5A5F;">Welcome to Airbnb, ${name}!</h1>
      <p>Your account has been created successfully.</p>
      ${role==="HOST" ?`<p>Please start creating listing now.</p>
      <a href="http://localhost:3000" style="background: #FF5A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
        Explore more
      </a>`:""}
      ${role==="GUEST"? ` <p>Start exploring listings and book your next stay.</p>
      <a href="http://localhost:3000" style="background: #FF5A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
        Explore Listings
      </a>`:""}
     
    </div>
  `;
}

export function passwordResetEmail(name: string, resetLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Password Reset Request</h1>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <p>Click the button below. This link expires in 1 hour.</p>
      <a href="${resetLink}" style="background: #FF5A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
        Reset Password
      </a>
      <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
    </div>
  `;
}

export const bookingConfirmationTemplate = (
  guestName: string, 
  listingTitle: string, 
  location: string, 
  checkIn: string, 
  checkOut: string, 
  totalPrice: number
) => `
  <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
    <h2 style="color: #4CAF50;">Booking Confirmed!</h2>
    <p>Hi ${guestName}, your stay at <strong>${listingTitle}</strong> is locked in.</p>
    <hr />
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Check-in:</strong> ${checkIn}</p>
    <p><strong>Check-out:</strong> ${checkOut}</p>
    <p><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
    <hr />
    <p style="font-size: 0.9em; color: #666;">
      <strong>Cancellation Policy:</strong> Please note that cancellations must be made 48 hours in advance for a full refund.
    </p>
  </div>
`;

export const bookingCancellationTemplate = (
  guestName: string, 
  listingTitle: string, 
  checkIn: string, 
  checkOut: string
) => `
  <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
    <h2 style="color: #FF5A5F;">Booking Cancelled</h2>
    <p>Hi ${guestName}, your booking for <strong>${listingTitle}</strong> (${checkIn} to ${checkOut}) has been cancelled.</p>
    <p>We're sorry it didn't work out this time! We hope to see you again soon.</p>
    <a href="http://localhost:3000/listings" style="background: #FF5A5F; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Find another listing</a>
  </div>
`;
