import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './Marquee.css'; // Import the CSS for the animation
import { Volume2 } from 'lucide-react';

const Marquee = () => {
  const [text, setText] = useState('');

  useEffect(() => {
    const marqueeRef = doc(db, 'settings', 'marquee');
    const unsubscribe = onSnapshot(marqueeRef, (doc) => {
      if (doc.exists()) {
        setText(doc.data().text);
      } else {
        // Set a default message if not configured in admin
        setText('Auto fund lene ke liye Auto Qr ka use kre.');
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div className="marquee-container">
        <div className="absolute left-0 z-20 h-full w-12 flex items-center justify-center bg-[#042346] px-2">
          <Volume2 className="h-6 w-6"/>
        </div>
        <div className="marquee-text">
            <span className="pr-12">{text}</span>
            <span className="pr-12">{text}</span>
        </div>
    </div>
  );
};

export default Marquee;
