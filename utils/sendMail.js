const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async (user, emailType) => {
  let msg;

  const url =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://app.scrinshot.xyz';

  if (emailType === 'email-confirmation') {
    msg = {
      to: user.email,
      from: { email: 'alin.rauta@alinrauta.com', name: 'Scrinshot' },
      subject: 'Please verify your email address',
      html: `<p>Hi ${user.name},</p>
             <p>Welcome to Scrinshot! Please click the link below to complete registration.</p>
             <p><a href="${url}/account/activate/${user.emailVerificationToken}">Activate your account</a></p>
             <p>Kind regards,</p>
             <p>The Scrinshot Team</p>
             <p>Is the link not working? Please copy the following URL in your address bar: <a href="${url}/account/activate/${user.emailVerificationToken}">${url}/account/activate/${user.emailVerificationToken}</a></p>`,
    };
  } else if (emailType === 'forgot-password') {
    msg = {
      to: user.email,
      from: { email: 'alin.rauta@alinrauta.com', name: 'Scrinshot' },
      subject: 'Reset Password',
      html: `<p>Hello,</p>
             <p>You are receiving this email because we received a password reset request for your account.</p>
             <p><a href="${url}/auth/forgot-password/${user.passwordResetToken}">Reset password</a></p>
             <p>If you did not request a password reset, no further action is required.</p>
             <p>Kind regards,</p>
             <p>The Scrinshot Team</p>
             <p>Is the link not working? Please copy the following URL in your address bar: <a href="${url}/auth/forgot-password/${user.passwordResetToken}">${url}/auth/forgot-password/${user.passwordResetToken}</a></p>`,
    };
  } else if (emailType === 'email-first-screenshot') {
    msg = {
      to: user.email,
      from: { email: 'alin.rauta@alinrauta.com', name: 'Scrinshot' },
      subject: 'Your First Screenshot is Live',
      html: `<p>Hello,</p>
             <p>You did it!</p>
             <p>You created your first automated screenshot.</p>
             <p>You can find the first screenshot image in <a href="${url}/screenshots/my-screenshots">My Screenshots</a>.
             <p>Kind regards,</p>
             <p>The Scrinshot Team</p>`,
    };
  } else if (emailType === 'email-cron-error') {
    msg = {
      to: 'alin.rauta@thebusinessclub.ro',
      from: { email: 'alin.rauta@alinrauta.com', name: 'Scrinshot' },
      subject: 'Screenshot Cron Error',
      html: `<p>Hello,</p>
             <p>Exista o eroare cu cronul de screenshot</p>`,
    };
  } else if (emailType === 'email-cron-image-update-error') {
    msg = {
      to: 'alin.rauta@thebusinessclub.ro',
      from: { email: 'alin.rauta@alinrauta.com', name: 'Scrinshot' },
      subject: 'Screenshot Db Image Update Cron Error',
      html: `<p>Hello,</p>
             <p>Exista o eroare la db image update in cronul de screenshot</p>`,
    };
  } else if (emailType === 'email-screenshot-is-ready') {
    msg = {
      to: user.email,
      from: { email: 'alin.rauta@alinrauta.com', name: 'Scrinshot' },
      subject: 'You Got A New Screenshot',
      html: `<p>Hello,</p>
             <p>A fresh screenshot has been captured for your screenshot automations</p>
             <p>You can find it in <a href="${url}/screenshots/my-screenshots">My Screenshots</a>.
             <p>Kind regards,</p>
             <p>The Scrinshot Team</p>`,
    };
  } else if (emailType === 'email-url-is-not-valid') {
    msg = {
      to: user.email,
      from: { email: 'alin.rauta@alinrauta.com', name: 'Scrinshot' },
      subject: 'Your screenshot URL is not valid',
      html: `<p>Hello,</p>
             <p>We tried to capture a screenshot to your URL, but unfortunately the URL you entered is not valid.</p>
             <p>You can go and change it in <a href="${url}/screenshots/my-screenshots">My Screenshots</a>.
             <p>Kind regards,</p>
             <p>The Scrinshot Team</p>`,
    };
  }

  sgMail
    .send(msg)
    .then(() => {
      console.log('mail sent');
    })
    .catch((error) => {
      console.log(error.response.body);
      // throw error;
    });
};

module.exports = sendMail;
