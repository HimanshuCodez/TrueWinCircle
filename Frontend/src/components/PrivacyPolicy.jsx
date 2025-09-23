import React, { useState } from 'react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-xl font-bold text-yellow-400 mb-4 border-b-2 border-yellow-400/30 pb-2">{title}</h3>
    <div className="space-y-3 text-gray-300 prose prose-invert prose-p:my-1 prose-li:my-1">
      {children}
    </div>
  </div>
);

const PrivacyPolicyContent = () => (
  <div>
    <h2 className="text-3xl font-bold text-center mb-8">Privacy Policy</h2>
    
    {/* English Version */}
    <div className="mb-12">
      <h3 className="text-2xl font-semibold text-center text-gray-300 mb-6">English Version</h3>
      <Section title="1. Information We Collect:">
        <p>Name, phone number, email address, and payment details (UPI ID, bank account information).</p>
        <p>Game activity, wallet transactions, and referral data.</p>
      </Section>
      <Section title="2. How We Use Information:">
        <p>To provide gaming services and wallet management.</p>
        <p>To process deposits and withdrawals.</p>
        <p>To send you important updates, offers, and notifications.</p>
        <p>To prevent fraud and ensure fair gameplay.</p>
      </Section>
      <Section title="3. Data Security:">
        <p>All personal and financial data is stored securely.</p>
        <p>We do not sell or share your personal details with third parties.</p>
      </Section>
      <Section title="4. User Responsibility:">
        <p>You must ensure correct details (UPI, bank info) while depositing or withdrawing.</p>
        <p>TrueWinCircle is not responsible for failed transactions due to incorrect details.</p>
      </Section>
      <Section title="5. Policy Updates:">
        <p>We may update this Privacy Policy from time to time.</p>
        <p>Any changes will be posted on this page, and continued use of our platform means acceptance of the new terms.</p>
      </Section>
    </div>

    {/* Hindi Version */}
    <div>
      <h3 className="text-2xl font-semibold text-center text-gray-300 mb-6">Hindi Version</h3>
      <Section title="1. हम कौन सी जानकारी लेते हैं:">
        <p>नाम, फ़ोन नंबर, ईमेल एड्रेस और पेमेंट डिटेल्स (UPI ID, बैंक अकाउंट)।</p>
        <p>गेम की एक्टिविटी, वॉलेट ट्रांज़ैक्शन और रेफ़रल डाटा।</p>
      </Section>
      <Section title="2. हम जानकारी का उपयोग कैसे करते हैं:">
        <p>गेमिंग और वॉलेट सर्विस देने के लिए।</p>
        <p>डिपॉज़िट और विदड्रॉ प्रोसेस करने के लिए।</p>
        <p>आपको ज़रूरी अपडेट्स और ऑफ़र्स भेजने के लिए।</p>
        <p>फ्रॉड रोकने और फेयर गेमिंग सुनिश्चित करने के लिए।</p>
      </Section>
      <Section title="3. डेटा सुरक्षा:">
        <p>आपकी सारी जानकारी सुरक्षित रखी जाती है।</p>
        <p>हम आपकी जानकारी किसी थर्ड पार्टी के साथ शेयर या बेचते नहीं हैं।</p>
      </Section>
      <Section title="4. यूज़र की ज़िम्मेदारी:">
        <p>डिपॉज़िट और विदड्रॉ करते समय सही डिटेल्स डालना ज़रूरी है।</p>
        <p>ग़लत डिटेल्स की वजह से असफल ट्रांज़ैक्शन के लिए TrueWinCircle ज़िम्मेदार नहीं होगा।</p>
      </Section>
      <Section title="5. पॉलिसी अपडेट:">
        <p>समय-समय पर Privacy Policy अपडेट की जा सकती है।</p>
        <p>अपडेट के बाद प्लेटफ़ॉर्म का इस्तेमाल करना, नई पॉलिसी को स्वीकार करना माना जाएगा।</p>
      </Section>
    </div>
  </div>
);

const TermsAndConditionsContent = () => (
  <div>
    <h2 className="text-3xl font-bold text-center mb-8">Terms & Conditions</h2>

    {/* English Version */}
    <div className="mb-12">
      <h3 className="text-2xl font-semibold text-center text-gray-300 mb-6">English Version</h3>
      <Section title="1. Age Requirement:">
        <p>You must be at least 18 years old to use this platform.</p>
      </Section>
      <Section title="2. Fair Usage:">
        <p>Multiple accounts, fraud, or cheating will result in suspension or ban.</p>
        <p>Admin’s decision will be final in case of disputes.</p>
      </Section>
      <Section title="3. Wallet Rules:">
        <p>Deposits must be verified by admin before adding to wallet.</p>
        <p>Minimum withdrawal amount is ₹100.</p>
        <p>Withdrawal requests will be processed within 10–24 hours.</p>
      </Section>
      <Section title="4. Game Rules:">
        <p>Payout multipliers and rules are clearly mentioned for each game.</p>
        <p>Results are based on system logic (lowest bet wins for some games).</p>
      </Section>
      <Section title="5. Referral Policy:">
        <p>Referral bonus is credited only when the referred user deposits at least ₹50.</p>
      </Section>
      <Section title="6. Liability:">
        <p>TrueWinCircle is not responsible for technical errors, failed transactions due to wrong details, or external payment gateway delays.</p>
      </Section>
      <p className="mt-6">By continuing to use our platform, you accept these terms.</p>
    </div>

    {/* Hindi Version */}
    <div>
      <h3 className="text-2xl font-semibold text-center text-gray-300 mb-6">Hindi Version</h3>
      <Section title="1. आयु सीमा:">
        <p>इस प्लेटफ़ॉर्म का इस्तेमाल करने के लिए आपकी आयु कम से कम 18 वर्ष होनी चाहिए।</p>
      </Section>
      <Section title="2. फेयर यूज़ेज:">
        <p>एक से अधिक अकाउंट बनाना, धोखाधड़ी या चीटिंग करने पर अकाउंट बंद हो सकता है।</p>
        <p>विवाद की स्थिति में एडमिन का निर्णय अंतिम होगा।</p>
      </Section>
      <Section title="3. वॉलेट नियम:">
        <p>डिपॉज़िट तभी वॉलेट में जुड़ेंगे जब एडमिन वेरिफाई करेगा।</p>
        <p>न्यूनतम विदड्रॉ ₹100 है।</p>
        <p>विदड्रॉ 10–24 घंटों के अंदर प्रोसेस होंगे।</p>
      </Section>
      <Section title="4. गेम नियम:">
        <p>हर गेम के लिए पेआउट मल्टीप्लायर और नियम पहले से बताए गए हैं।</p>
        <p>कुछ गेम्स में रिज़ल्ट ‘lowest bet wins’ लॉजिक पर आधारित हैं।</p>
      </Section>
      <Section title="5. रेफ़रल पॉलिसी:">
        <p>रेफ़रल बोनस तभी मिलेगा जब सामने वाला यूज़र कम से कम ₹50 डिपॉज़िट करेगा।</p>
      </Section>
      <Section title="6. जिम्मेदारी:">
        <p>TrueWinCircle किसी तकनीकी त्रुटि, ग़लत डिटेल्स की वजह से असफल ट्रांज़ैक्शन या पेमेंट गेटवे की देरी के लिए ज़िम्मेदार नहीं होगा।</p>
      </Section>
      <p className="mt-6">प्लेटफ़ॉर्म का इस्तेमाल जारी रखने का मतलब है कि आप इन शर्तों को मानते हैं।</p>
    </div>
  </div>
);

const PrivacyPolicy = () => {
  const [activeTab, setActiveTab] = useState('privacy');

  return (
    <div className="font-roboto bg-gray-900 text-white min-h-screen p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center border-b border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-6 py-3 font-semibold transition-colors duration-300 ${
              activeTab === 'privacy' 
              ? 'text-yellow-400 border-b-2 border-yellow-400' 
              : 'text-gray-400 hover:text-white'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-6 py-3 font-semibold transition-colors duration-300 ${
              activeTab === 'terms' 
              ? 'text-yellow-400 border-b-2 border-yellow-400' 
              : 'text-gray-400 hover:text-white'
            }`}
          >
            Terms & Conditions
          </button>
        </div>

        <div className="bg-gray-800 p-6 md:p-10 rounded-lg shadow-2xl">
          {activeTab === 'privacy' ? <PrivacyPolicyContent /> : <TermsAndConditionsContent />}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
