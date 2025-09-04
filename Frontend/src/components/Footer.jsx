export default function Footer() {
  return (
    <footer className="relative bg-[#001F4D] text-white text-center pt-32 pb-8">
      

      {/* Footer Content */}
      <div className="max-w-3xl mx-auto space-y-4 px-4">
        <p className="text-sm opacity-80">
          © {new Date().getFullYear()} TrueWin Casino • All Rights Reserved
        </p>
        <div className="flex justify-center gap-6 text-sm opacity-80">
          <a href="#" className="hover:text-yellow-400 transition">Privacy Policy</a>
          <a href="#" className="hover:text-yellow-400 transition">Terms</a>
          <a href="#" className="hover:text-yellow-400 transition">Support</a>
        </div>
      </div>
    </footer>
  );
}
