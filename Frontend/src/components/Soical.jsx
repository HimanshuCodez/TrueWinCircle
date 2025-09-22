import { FaWhatsapp, FaTelegram } from "react-icons/fa";

export default function SocialButtons() {
  return (
    <div className="w-full flex flex-col items-center justify-center">
     

      {/* Buttons */}
      <div className="flex w-full bg-[#042346] p-3 rounded-b-lg gap-3 justify-center">
        {/* WhatsApp */}
        <button className="flex items-center gap-2 bg-white text-green-600 font-medium px-4 py-2 rounded-lg shadow-md">
          <FaWhatsapp className="text-xl" />
          <span>Whatsapp</span>
        </button>

        {/* Telegram */}
        <button className="flex items-center gap-2 bg-white text-blue-600 font-medium px-4 py-2 rounded-lg shadow-md">
          <FaTelegram className="text-xl" />
          <span>Telegram</span>
        </button>
      </div>
    </div>
  );
}
