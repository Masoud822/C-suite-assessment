const nodemailer = require('nodemailer');

let transporter = null;

// Initialize Ethereal email transporter for testing
const initEmail = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Ethereal Email ready for testing.');
  } catch (err) {
    console.error('Failed to initialize Ethereal Email', err);
  }
};

initEmail();

const sendAdminReport = async (candidateData, assessmentData) => {
  if (!transporter) return;
  
  const mailOptions = {
    from: '"C-Suite English System" <system@c-suite-english.com>',
    to: 'admin@c-suite-english.com',
    subject: `Assessment Completed: ${candidateData.name}`,
    html: `
      <h2>Assessment Report</h2>
      <p><strong>Candidate:</strong> ${candidateData.name} (${candidateData.email})</p>
      <hr />
      <h3>Results</h3>
      <ul>
        <li><strong>Score:</strong> ${assessmentData.score}</li>
        <li><strong>Estimated CEFR Level:</strong> ${assessmentData.cefr_level}</li>
        <li><strong>C-Suite Level:</strong> ${assessmentData.c_suite_level}</li>
        <li><strong>Cheat Infractions Logged:</strong> ${assessmentData.infractions_count}</li>
      </ul>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin Report Email Sent!');
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error('Failed to send admin report email', err);
  }
};

module.exports = { sendAdminReport };
