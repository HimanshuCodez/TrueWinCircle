import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const Links = () => {
  const [whatsappLink, setWhatsappLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const docRef = doc(db, 'social_links', 'links');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWhatsappLink(data.whatsapp || '');
          setTelegramLink(data.telegram || '');
        }
      } catch (error) {
        toast.error('Failed to fetch links.');
        console.error('Error fetching links:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'social_links', 'links');
      await setDoc(docRef, {
        whatsapp: whatsappLink,
        telegram: telegramLink,
      });
      toast.success('Links updated successfully!');
    } catch (error) {
      toast.error('Failed to update links.');
      console.error('Error updating links:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Update Social Links</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="whatsappLink" className="block text-sm font-medium text-gray-700">
            WhatsApp Link
          </label>
          <input
            type="text"
            id="whatsappLink"
            value={whatsappLink}
            onChange={(e) => setWhatsappLink(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="https://wa.me/..."
          />
        </div>
        <div>
          <label htmlFor="telegramLink" className="block text-sm font-medium text-gray-700">
            Telegram Link
          </label>
          <input
            type="text"
            id="telegramLink"
            value={telegramLink}
            onChange={(e) => setTelegramLink(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="https://t.me/..."
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Links
        </button>
      </div>
    </div>
  );
};

export default Links;
