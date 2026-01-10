import { FaWhatsapp, FaTelegram } from "react-icons/fa";
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function SocialButtons() {
  const [links, setLinks] = useState({ whatsapp: '', telegram: '' });

  useEffect(() => {
    const fetchLinks = async () => {
      const docRef = doc(db, 'social_links', 'links');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setLinks(docSnap.data());
      }
    };

    fetchLinks();
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center">
     

      {/* Buttons */}
      <div className="flex w-full bg-[#042346] p-3 rounded-b-lg gap-3 justify-center">
        {/* WhatsApp */}
        <a href={links.whatsapp || '#'} target="_blank" rel="noopener noreferrer">
          <button className="flex items-center gap-2 bg-white text-green-600 font-medium px-4 py-2 rounded-lg shadow-md">
            <FaWhatsapp className="text-xl" />
            <span>Whatsapp</span>
          </button>
        </a>

        {/* Telegram */}
        <a href={links.telegram || '#'} target="_blank" rel="noopener noreferrer">
          <button className="flex items-center gap-2 bg-white text-blue-600 font-medium px-4 py-2 rounded-lg shadow-md">
            <FaTelegram className="text-xl" />
            <span>Telegram</span>
          </button>
        </a>
      </div>
    </div>
  );
}
