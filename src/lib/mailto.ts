// src/lib/mailto.ts
export function openEmailThread({
  toEmail,
  itemTitle,
  itemRef,
  claimTicket,
}: {
  toEmail: string;
  itemTitle: string;
  itemRef: string;
  claimTicket?: string;
}) {
  // Use regular hyphen instead of em dash for better compatibility
  let subject = `FoundPath - Re: ${itemTitle} (${itemRef}`;
  if (claimTicket) {
    subject += ` / ${claimTicket}`;
  }
  subject += `)`;

  let body = `Hi,\n\nI am contacting you regarding:\n`;
  body += `  Item: ${itemTitle}\n`;
  body += `  Reference: ${itemRef}\n`;
  if (claimTicket) {
    body += `  Claim Ticket: ${claimTicket}\n`;
  }
  body += `\nPlease include these reference numbers in all correspondence.\n\nRegards`;

  const mailtoUrl = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Try native mailto
  window.location.href = mailtoUrl;
}