import React, { useState } from 'react';
import { Mail, MessageCircle, Send, ChevronDown, Phone } from 'lucide-react';

const FaqItem = ({ q_en, a_en, q_hi, a_hi, isOpen, onClick }) => (
  <div className="border-b border-gray-700 last:border-b-0">
    <button 
      onClick={onClick} 
      className="w-full flex justify-between items-center text-left py-5 px-2 hover:bg-white/5 transition-colors"
    >
      <div>
        <p className="font-semibold text-lg text-gray-100">{q_en}</p>
        <p className="font-normal text-md text-gray-400 mt-1">{q_hi}</p>
      </div>
      <ChevronDown className={`transform transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="pb-5 px-2 text-gray-300 bg-black/10">
        <p className="mb-2">{a_en}</p>
        <p>{a_hi}</p>
      </div>
    )}
  </div>
);

const Support = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q_en: "How to deposit?",
      a_en: "Upload screenshot + enter registered mobile number + wait for admin approval.",
      q_hi: "डिपॉज़िट कैसे करें?",
      a_hi: "स्क्रीनशॉट अपलोड करें + रजिस्टर्ड मोबाइल नंबर डालें + एडमिन अप्रूवल का इंतज़ार करें।"
    },
    {
      q_en: "How to withdraw?",
      a_en: "Minimum withdrawal is ₹100. Request will be processed within 10–24 hours.",
      q_hi: "विदड्रॉ कैसे करें?",
      a_hi: "न्यूनतम विदड्रॉ ₹100 है। रिक्वेस्ट 10–24 घंटों के अंदर प्रोसेस होगी।"
    },
    {
      q_en: "How does referral work?",
      a_en: "You will get 50 points only when your referred friend deposits at least ₹50.",
      q_hi: "रेफ़रल कैसे काम करता है?",
      a_hi: "आपको 50 पॉइंट्स तभी मिलेंगे जब आपका रेफ़र किया हुआ यूज़र कम से कम ₹50 डिपॉज़िट करेगा।"
    },
    {
      q_en: "Where to see my history?",
      a_en: "You can see complete wallet, deposit, withdrawal, and betting history in your profile.",
      q_hi: "अपनी हिस्ट्री कहाँ देखें?",
      a_hi: "आप अपने प्रोफाइल में पूरी वॉलेट, डिपॉज़िट, विदड्रॉ और बेटिंग हिस्ट्री देख सकते हैं।"
    }
  ];

  return (
    <div className="font-roboto bg-gray-900 text-white min-h-screen p-4 pt-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8 text-center">Support & FAQs</h1>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-400 mb-6">For any queries or support, please contact us:</p>
          <div className="space-y-4">
            <a href="mailto:support@truewincircle.in" className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
              <Mail className="w-6 h-6 text-purple-400" />
              <span>support@truewincircle.in</span>
            </a>
            <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
              <Phone className="w-6 h-6 text-green-400" />
              <span>+91-XXXXXXXXXX (WhatsApp)</span>
            </a>
            <a href="https://t.me/truewincircle" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
              <Send className="w-6 h-6 text-blue-400" />
              <span>t.me/truewincircle (Telegram)</span>
            </a>
          </div>
          <p className="text-gray-400 mt-6 text-sm">
            You can also use the contact form on our website by providing your Name, Mobile, Email, and Message.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-2 p-6">Frequently Asked Questions</h2>
          <div className="border-t border-gray-700">
            {faqs.map((faq, index) => (
              <FaqItem
                key={index}
                isOpen={openFaq === index}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                {...faq}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
