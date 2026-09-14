import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('••••••••');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    login(username, password);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Subtle Background Surveillance Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#14161f15_1px,transparent_1px),linear-gradient(to_bottom,#14161f15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="w-full max-w-md bg-[#111318] border border-[#232732] rounded-xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center mb-4 shadow-lg shadow-white/10">
            <Shield className="w-7 h-7 fill-current" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Smart Detection App (SDA)
          </h1>
          <p className="text-xs text-neutral-400 font-medium mt-1 uppercase tracking-wider">
            Secure Command & Control
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Username / Operator ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="username"
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-2.5 bg-[#171922] border border-[#272b36] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Security Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#171922] border border-[#272b36] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-all font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-all flex items-center justify-center space-x-2 text-sm shadow-md"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security Badge */}
        <div className="mt-8 pt-6 border-t border-[#1e222b] text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#181a24] border border-[#282d3b] text-[11px] text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Authorized Personnel Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};
