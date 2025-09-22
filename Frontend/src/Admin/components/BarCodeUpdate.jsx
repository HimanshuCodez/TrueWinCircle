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
      <div className="bg-white rounded-lg shadow-sm mt-6">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Barcode History (Sample)</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Code</th>
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {barcodes.map(barcode => (
                <tr key={barcode.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono">{barcode.code}</td>
                  <td className="p-4">{barcode.product}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      barcode.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {barcode.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{barcode.created}</td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleBarcodeUpdate(barcode.id, barcode.status === 'active' ? 'inactive' : 'active')}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-gray-100">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BarCodeUpdate;
