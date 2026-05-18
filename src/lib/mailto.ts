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
  claimTicket: string;
}) {
  const subject = encodeURIComponent(
    `FoundPath — Re: ${itemTitle} (${itemRef} / ${claimTicket})`
  );
  const body = encodeURIComponent(
    `Hi,\\n\\nI am contacting you regarding:\\n` +
    `  Item: ${itemTitle}\\n` +
    `  Reference: ${itemRef}\\n` +
    `  Claim Ticket: ${claimTicket}\\n\\n` +
    `Please include these reference numbers in all correspondence.\\n\\n` +
    `Regards`
  );
  window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
}