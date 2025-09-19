import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Edit } from 'lucide-react';

const MarqueeUpdate = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMarqueeText = async () => {
      const marqueeRef = doc(db, 'settings', 'marquee');
      const docSnap = await getDoc(marqueeRef);
      if (docSnap.exists()) {
        setText(docSnap.data().text);
      }
    };
    fetchMarqueeText();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const marqueeRef = doc(db, 'settings', 'marquee');
      await setDoc(marqueeRef, { text: text });
      toast.success('Marquee text updated successfully!');
    } catch (error) {
      console.error("Error updating marquee text:", error);
      toast.error('Failed to update marquee text.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Edit className="w-5 h-5 mr-2" />
          Update Scrolling Marquee Text
        </h3>
        <div className="space-y-4">
          <textarea
            rows="3"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the text you want to scroll across the screen..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Updating...' : 'Save Marquee Text'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarqueeUpdate;
