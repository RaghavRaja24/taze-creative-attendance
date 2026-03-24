import nodemailer from "nodemailer";

type LeaveApplicationEmailInput = {
  applicantName: string;
  applicantEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  recipients: string[];
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });
}

export async function sendLeaveApplicationEmail(input: LeaveApplicationEmailInput) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM;

  if (!transporter || !from || input.recipients.length === 0) {
    return;
  }

  await transporter.sendMail({
    from,
    to: input.recipients.join(","),
    subject: `New leave request from ${input.applicantName}`,
    text: [
      `Employee: ${input.applicantName}`,
      `Email: ${input.applicantEmail}`,
      `Leave type: ${input.leaveType}`,
      `Date range: ${input.startDate} to ${input.endDate}`,
      `Reason: ${input.reason}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Leave Request</h2>
        <p><strong>Employee:</strong> ${input.applicantName}</p>
        <p><strong>Email:</strong> ${input.applicantEmail}</p>
        <p><strong>Leave type:</strong> ${input.leaveType}</p>
        <p><strong>Date range:</strong> ${input.startDate} to ${input.endDate}</p>
        <p><strong>Reason:</strong> ${input.reason}</p>
      </div>
    `,
  });
}
