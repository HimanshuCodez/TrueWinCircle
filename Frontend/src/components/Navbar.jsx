import { useState } from "react";
import { ChevronDown, User, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Navbar() {
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  return (
    <nav className="relative bg-[#042346] text-white px-4 md:px-8 py-3 flex justify-between items-center">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 border-2 border-yellow-500 rounded-full"></div>
        <span className="font-bold text-lg">
          TrueWin<span className="text-yellow-500">Circle</span>
        </span>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6">
        <Link to="/" className="hover:text-yellow-500">Home</Link>
        <a href="#" className="hover:text-yellow-500">Games</a>
        <a href="#" className="hover:text-yellow-500">Results</a>
        <a href="#" className="hover:text-yellow-500">How to Play</a>

        {user ? (
          <>
            {/* Account dropdown */}
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-1 hover:text-yellow-500"
              >
                Account <User size={24} />
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-md shadow-lg z-10">
                  <Link to="/login" className="block px-4 py-2 hover:bg-gray-100">Wallet</Link>
                  <Link to="/signup" className="block px-4 py-2 hover:bg-gray-100">Withdraw</Link>
                  <Link to="/AddCash" className="block px-4 py-2 hover:bg-gray-100">Add Cash</Link>
                </div>
              )}
            </div>
            
          </>
        ) : (
          <Link
            to="/phonesignup"
            className="bg-yellow-500 text-black font-bold px-5 py-2 rounded-full hover:bg-yellow-600"
          >
            JOIN NOW
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#042346] md:hidden flex flex-col items-center gap-4 py-4 z-50">
          <Link to="/" className="hover:text-yellow-500" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <a href="#" className="hover:text-yellow-500" onClick={() => setMobileMenuOpen(false)}>Games</a>
          <a href="#" className="hover:text-yellow-500" onClick={() => setMobileMenuOpen(false)}>Results</a>
          <a href="#" className="hover:text-yellow-500" onClick={() => setMobileMenuOpen(false)}>How to Play</a>
          
          <div className="w-3/4 border-t border-gray-700 my-1"></div>

          {user ? (
            <>
              <Link to="/login" className="hover:text-yellow-500" onClick={() => setMobileMenuOpen(false)}>Wallet</Link>
              <Link to="/signup" className="hover:text-yellow-500" onClick={() => setMobileMenuOpen(false)}>Withdraw</Link>
            </>
          ) : (
            <Link
              to="/phonesignup"
              className="bg-yellow-500 text-black font-bold px-5 py-2 rounded-full hover:bg-yellow-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              JOIN NOW
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
