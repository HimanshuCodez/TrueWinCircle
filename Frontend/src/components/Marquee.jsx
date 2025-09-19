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
        setText('Welcome to True Win Circle! Results are declared every 15 minutes.');
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div className="marquee-container">
        <Volume2 className="absolute left-3 z-10 h-6 w-6"/>
        <div className="marquee-text">
            <span className="mx-12">{text}</span>
            <span className="mx-12">{text}</span>
            <span className="mx-12">{text}</span>
        </div>
    </div>
  );
};

export default Marquee;
