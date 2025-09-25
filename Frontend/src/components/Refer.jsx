import { ArrowLeft, Megaphone, Copy } from "lucide-react";
import { FaWhatsapp, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ReferralScreen() {
  const user = useAuthStore((state) => state.user);
  const referralCode = user?.referralCode || "N/A";
  const [referrerName, setReferrerName] = useState(null);

  useEffect(() => {
    const fetchReferrerName = async () => {
      if (user?.referredBy) {
        try {
          const referrerDocRef = doc(db, "users", user.referredBy);
          const referrerDocSnap = await getDoc(referrerDocRef);
          if (referrerDocSnap.exists()) {
            setReferrerName(referrerDocSnap.data().name);
          }
        } catch (error) {
          console.error("Error fetching referrer's name:", error);
        }
      }
    };
    fetchReferrerName();
  }, [user?.referredBy]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied!");
    } catch (e) {
      toast.error("Copy failed — please copy manually: " + referralCode);
    }
  };

  const share = (platform) => {
    const text = `Use my referral code ${referralCode} to sign up!`;
    const url = encodeURIComponent("https://example.app/referral");

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(text)}`, "_blank");
        break;
      case "x":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + " " + url)}`, "_blank");
        break;
      case "instagram":
        window.open("https://www.instagram.com/", "_blank");
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#042346] text-white flex flex-col">
      {/* Header */}
      <header className="bg-yellow-600 px-4 py-4 flex items-center gap-3">
        <button aria-label="back" className="text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-semibold text-lg">Refer & Earn</h1>
      </header>

      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="bg-yellow-600 rounded-lg p-4 flex items-center gap-4 mb-6">
            <div className="bg-white/10 rounded-md p-3">
              <Megaphone size={40} className="text-white" />
            </div>
            <div className="font-medium">
              <p className="text-lg sm:text-xl">Refer your friends and earn</p>
              <p className="text-2xl sm:text-3xl font-bold">5% commission</p>
              <p className="text-sm sm:text-base">on their deposits</p>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 shadow-lg">
            {/* Referral Code Section */}
            <div className="mb-6">
              <p className="text-gray-300 text-sm mb-2">Your Referral Code</p>
              <div className="flex items-center justify-between bg-red-50/10 border border-red-400 rounded-lg px-4 py-3">
                <span className="font-bold text-red-400 text-xl sm:text-2xl tracking-widest">{referralCode}</span>
                <button onClick={copyCode} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-md px-4 py-2 transition-colors">
                  <Copy size={16} />
                  <span className="text-sm font-semibold">COPY</span>
                </button>
              </div>
            </div>

            {referrerName && (
              <div className="mb-6 text-center">
                <p className="text-gray-300 text-sm mb-2">You were referred by:</p>
                <p className="font-bold text-yellow-500 text-xl">{referrerName}</p>
              </div>
            )}

            <p className="text-red-400 text-sm uppercase tracking-wide text-center mb-6">
              Share your referral code with friends
            </p>

            {/* Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <button onClick={() => share("whatsapp")} className="flex items-center gap-3 justify-center px-4 py-3 rounded-lg bg-[#25D366] text-white font-medium hover:bg-opacity-90 transition-all">
                <FaWhatsapp size={22} />
                <span>WhatsApp</span>
              </button>

              <button onClick={() => share("facebook")} className="flex items-center gap-3 justify-center px-4 py-3 rounded-lg bg-[#1877F2] text-white font-medium hover:bg-opacity-90 transition-all">
                <FaFacebookF size={22} />
                <span>Facebook</span>
              </button>

              <button onClick={() => share("x")} className="flex items-center gap-3 justify-center px-4 py-3 rounded-lg bg-black text-white font-medium hover:bg-opacity-90 transition-all">
                <FaTwitter size={22} />
                <span>Twitter (X)</span>
              </button>

              <button onClick={() => share("instagram")} className="flex items-center gap-3 justify-center px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-medium hover:bg-opacity-90 transition-all">
                <FaInstagram size={22} />
                <span>Instagram</span>
              </button>
            </div>

            {/* How to Refer Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-100">How to refer a friend?</h3>
              <ol className="text-gray-300 list-decimal list-inside space-y-2">
                <li>Copy the referral code and share it with your friend.</li>
                <li>Ask your friend to register on the App using your referral code.</li>
                <li>Once they register and make a deposit, you will earn a 5% commission.</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}