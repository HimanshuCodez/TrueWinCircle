import React, { useEffect, useState } from 'react';
import { app } from '../../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { Edit, Eye, Plus } from 'lucide-react';

const BarCodeUpdate = () => {
  const storage = getStorage(app);
  const [barcodeFile, setBarcodeFile] = useState(null);
  const [barcodeUrl, setBarcodeUrl] = useState('');
  const [barcodes, setBarcodes] = useState([
    { id: 1, code: 'BC001', product: 'Product A', status: 'active', created: '2024-01-15' },
    { id: 2, code: 'BC002', product: 'Product B', status: 'inactive', created: '2024-01-16' },
    { id: 3, code: 'BC003', product: 'Product C', status: 'active', created: '2024-01-17' }
  ]);

  const handleBarcodeUpload = async () => {
    if (!barcodeFile) {
      toast.error('Please select a file to upload.');
      return;
    }
    const barcodeRef = ref(storage, 'barcodes/qr.jpg');
    try {
      await uploadBytes(barcodeRef, barcodeFile);
      const url = await getDownloadURL(barcodeRef);
      setBarcodeUrl(url);
      toast.success('Barcode uploaded successfully!');
    } catch (error) {
      console.error("Error uploading barcode:", error);
      toast.error('Failed to upload barcode.');
    }
  };

  useEffect(() => {
    const fetchBarcodeUrl = async () => {
        try {
            const barcodeRef = ref(storage, 'barcodes/qr.jpg');
            const url = await getDownloadURL(barcodeRef);
            setBarcodeUrl(url);
        } catch (error) {
            console.log("QR code not found, admin needs to upload one.")
        }
    };

    fetchBarcodeUrl();
  }, []);

  const handleBarcodeUpdate = (id, status) => {
    setBarcodes(barcodes.map(barcode => 
      barcode.id === id ? { ...barcode, status } : barcode
    ));
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border-b">
        <h3 className="text-lg font-semibold">Barcode Management</h3>
        <div className="mt-4">
            <h4 className="text-md font-semibold">Current QR Code</h4>
            {barcodeUrl ? (
                <img src={barcodeUrl} alt="Current QR Code" className="w-48 h-48 mt-2" />
            ) : (
                <p className="text-gray-500 mt-2">No QR code uploaded yet.</p>
            )}
        </div>
        <div className="mt-4">
            <h4 className="text-md font-semibold">Upload New Barcode</h4>
            <input type="file" onChange={(e) => setBarcodeFile(e.target.files[0])} className="mt-2" />
            <button onClick={handleBarcodeUpload} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mt-2">
              <Plus className="h-4 w-4" />
              <span>Upload Barcode</span>
            </button>
        </div>
      </div>
      
    </div>
  );
};

export default BarCodeUpdate;
