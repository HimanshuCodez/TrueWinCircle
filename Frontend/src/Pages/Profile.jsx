import React from "react";
import { User, LogOut, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function ProfileCard() {
  return (
    <div className="max-w-md md:max-w-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white rounded-2xl shadow-xl p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
          U
        </div>
        <div>
          <h2 className="text-xl font-semibold">Username</h2>
          <p className="text-sm opacity-80">ID: #123456</p>
        </div>
      </div>

      {/* Balance */}
      <div className="mt-4 bg-gray-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wallet className="text-yellow-400" />
          <span className="font-semibold">Balance</span>
        </div>
        <span className="text-lg font-bold text-green-400">₹9,680.00</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <div className="bg-gray-800 p-3 rounded-xl text-center">
          <p className="text-lg font-bold text-purple-400">150</p>
          <p className="text-xs opacity-70">Total Bets</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl text-center">
          <p className="text-lg font-bold text-green-400">90</p>
          <p className="text-xs opacity-70">Wins</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl text-center">
          <p className="text-lg font-bold text-red-400">60</p>
          <p className="text-xs opacity-70">Losses</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <button className="flex-1 py-2 md:py-3 bg-green-600 hover:bg-green-500 rounded-xl flex items-center justify-center space-x-2 font-semibold">
          <ArrowDownCircle size={18} />
          <span>Deposit</span>
        </button>
        <button className="flex-1 py-2 md:py-3 bg-yellow-600 hover:bg-yellow-500 rounded-xl flex items-center justify-center space-x-2 font-semibold">
          <ArrowUpCircle size={18} />
          <span>Withdraw</span>
        </button>
      </div>

      {/* Logout */}
      <button className="mt-4 w-full py-2 md:py-3 bg-red-600 hover:bg-red-500 rounded-xl flex items-center justify-center space-x-2 font-semibold">
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </div>
  );
}
