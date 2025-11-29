import React, { useEffect, useState } from 'react';
import { app, db, storage } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'react-toastify';
import { Plus, X } from 'lucide-react';

const SliderUpdate = () => {
  const [slideFile, setSlideFile] = useState(null);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);

  const slidesCollectionRef = collection(db, 'carousel_slides');

  // Fetch existing slides from Firestore
  const getSlides = async () => {
    setLoading(true);
    try {
      const data = await getDocs(slidesCollectionRef);
      setSlides(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      console.error("Error fetching slides:", error);
      toast.error('Failed to fetch slides.');
    }
    setLoading(false);
  };

  useEffect(() => {
    getSlides();
  }, []);

  const handleSlideUpload = async () => {
    if (!slideFile) {
      toast.error('Please select an image file to upload.');
      return;
    }

    setLoading(true);
    const fileName = `carousel/${Date.now()}-${slideFile.name}`;
    const slideRef = ref(storage, fileName);

    try {
      await uploadBytes(slideRef, slideFile);
      const imageUrl = await getDownloadURL(slideRef);

      await addDoc(slidesCollectionRef, { url: imageUrl, path: fileName });
      setSlideFile(null); // Clear the selected file
      toast.success('Slide uploaded successfully!');
      getSlides(); // Refresh the list of slides
    } catch (error) {
      console.error("Error uploading slide:", error);
      toast.error('Failed to upload slide.');
    }
    setLoading(false);
  };

  const handleDeleteSlide = async (id, path) => {
    setLoading(true);
    try {
      // Delete from Firestore
      const slideDoc = doc(db, 'carousel_slides', id);
      await deleteDoc(slideDoc);

      // Delete from Firebase Storage
      const slideImageRef = ref(storage, path);
      await deleteObject(slideImageRef);

      toast.success('Slide deleted successfully!');
      getSlides(); // Refresh the list of slides
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast.error('Failed to delete slide.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border-b">
        <h3 className="text-lg font-semibold">Carousel Slide Management</h3>

        <div className="mt-4">
          <h4 className="text-md font-semibold">Upload New Slide Image</h4>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSlideFile(e.target.files[0])}
            className="mt-2 block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
          />
          <button
            onClick={handleSlideUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mt-4"
            disabled={loading}
          >
            {loading ? 'Uploading...' : <><Plus className="h-4 w-4" /><span>Upload Slide</span></>}
          </button>
        </div>

        <div className="mt-8">
          <h4 className="text-md font-semibold mb-4">Current Slides</h4>
          {loading ? (
            <p>Loading slides...</p>
          ) : slides.length === 0 ? (
            <p className="text-gray-500">No slides uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {slides.map((slide) => (
                <div key={slide.id} className="relative group">
                  <img
                    src={slide.url}
                    alt="Carousel Slide"
                    className="w-full h-40 object-cover rounded-lg shadow-md"
                  />
                  <button
                    onClick={() => handleDeleteSlide(slide.id, slide.path)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    title="Delete Slide"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SliderUpdate;
