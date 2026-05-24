// src/components/ui/DidYouKnow.tsx
import { useState, useEffect } from 'react';

const tips = [
  {
    icon: 'star',
    title: 'Reputation Matters',
    message: 'You gain +10 reputation when you successfully return a found item. Build trust in the community!',
  },
  {
    icon: 'psychology',
    title: 'Smart Matching',
    message: 'Items with the same category and nearby location are automatically matched. You will receive a notification.',
  },
  {
    icon: 'edit_note',
    title: 'Edit Your Claim',
    message: 'You can edit your claim answer while it is pending – make sure to provide accurate details.',
  },
  {
    icon: 'handshake',
    title: 'Handshake Confirmation',
    message: 'After accepting a claim, a handshake modal lets you email the claimant and finalise the return.',
  },
  {
    icon: 'lock',
    title: 'Private Notes',
    message: 'Samaritans can store private notes about the item – only they can see them.',
  },
  {
    icon: 'qr_code_scanner',
    title: 'Scan the QR Code',
    message: 'Look for FoundPath posters on campus! Scan the QR code to quickly report a found item.',
  },
  {
    icon: 'groups',
    title: 'Community Driven',
    message: 'FoundPath is built by and for the VSU community. Help keep our campus belongings safe.',
  },
];

export default function DidYouKnow() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % tips.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const tip = tips[index];

  return (
    <div className="mt-12 bg-gradient-to-r from-primary/5 via-surface-container-low to-primary/5 rounded-2xl p-6 md:p-8 border border-primary/10 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {tip.icon}
          </span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold font-headline text-primary mb-1">{tip.title}</h3>
          <p className={`text-on-surface-variant transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            {tip.message}
          </p>
        </div>
      </div>
    </div>
  );
}