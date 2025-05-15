import React, { useState, useEffect, useCallback } from 'react';
import { generatePassword, calculatePasswordStrength } from '../../utils/encryption';
import { Copy, RefreshCw, Check, Sliders, AlertCircle, ShieldCheck, Shield, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const PasswordGeneratorForm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateNewPassword = useCallback(() => {
    setIsGenerating(true);
    setError('');
    
    try {
      if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
        setError('Please select at least one character type');
        setIncludeLowercase(true);
        return;
      }
      
      const newPassword = generatePassword(
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols
      );
      
      setPassword(newPassword);
      setPasswordStrength(calculatePasswordStrength(newPassword));
    } catch (error) {
      setError('Failed to generate password');
      console.error('Password generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);
  
  useEffect(() => {
    generateNewPassword();
  }, []);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setError('Failed to copy password');
      console.error('Copy error:', error);
    }
  };
  
  const getStrengthLabel = () => {
    if (passwordStrength < 30) return { label: 'Weak', icon: <ShieldAlert size={18} className="text-red-500" /> };
    if (passwordStrength < 60) return { label: 'Medium', icon: <Shield size={18} className="text-yellow-500" /> };
    if (passwordStrength < 80) return { label: 'Strong', icon: <ShieldCheck size={18} className="text-green-500" /> };
    return { label: 'Very Strong', icon: <ShieldCheck size={18} className="text-emerald-500" /> };
  };
  
  const getStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-yellow-500';
    if (passwordStrength < 80) return 'bg-green-500';
    return 'bg-emerald-500';
  };
  
  return (
    <div className="card space-y-8">
      <div className="bg-[#0a0a0a] border border-[#333333] rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-mono break-all">
            {showPassword ? password : '•'.repeat(password.length)}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-2.5 rounded-lg hover:bg-[#1a1a1a] transition-all text-[#a0a0a0] hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              onClick={generateNewPassword}
              className="p-2.5 rounded-lg hover:bg-[#1a1a1a] transition-all text-[#a0a0a0] hover:text-white"
              disabled={isGenerating}
              aria-label="Generate new password"
            >
              <RefreshCw size={18} className={isGenerating ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={copyToClipboard}
              className="p-2.5 rounded-lg hover:bg-[#1a1a1a] transition-all text-[#a0a0a0] hover:text-white relative"
              aria-label="Copy password"
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              {copied && (
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded-md">
                  Copied!
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-[#a0a0a0]">Password Strength</span>
            <span className="text-xs font-medium flex items-center gap-1">
              {getStrengthLabel().icon}
              {getStrengthLabel().label}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div 
              className={`h-full ${getStrengthColor()} transition-all duration-500`} 
              style={{ width: `${passwordStrength}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg flex items-center animate-fade-in">
          <AlertCircle size={18} className="mr-2" />
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <label htmlFor="length" className="text-sm font-medium flex items-center">
              <Sliders size={16} className="mr-2 text-[#a6ccb8]" />
              Password Length
            </label>
            <span className="text-sm text-[#a0a0a0]">{length} characters</span>
          </div>
          <input
            id="length"
            type="range"
            min="8"
            max="32"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-1 text-xs text-[#666666]">
            <span>8</span>
            <span>32</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center">
            <ShieldCheck size={16} className="mr-2 text-[#a6ccb8]" />
            Character Types
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeLowercase}
                onChange={(e) => setIncludeLowercase(e.target.checked)}
                className="w-5 h-5 text-[#a6ccb8] bg-[#1a1a1a] border-[#333333] rounded focus:ring-[#a6ccb8] focus:ring-offset-black"
              />
              <span className="ml-3 text-sm">Lowercase Letters (a-z)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
                className="w-5 h-5 text-[#a6ccb8] bg-[#1a1a1a] border-[#333333] rounded focus:ring-[#a6ccb8] focus:ring-offset-black"
              />
              <span className="ml-3 text-sm">Uppercase Letters (A-Z)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="w-5 h-5 text-[#a6ccb8] bg-[#1a1a1a] border-[#333333] rounded focus:ring-[#a6ccb8] focus:ring-offset-black"
              />
              <span className="ml-3 text-sm">Numbers (0-9)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="w-5 h-5 text-[#a6ccb8] bg-[#1a1a1a] border-[#333333] rounded focus:ring-[#a6ccb8] focus:ring-offset-black"
              />
              <span className="ml-3 text-sm">Special Characters (!@#$%^&*)</span>
            </label>
          </div>
        </div>
      </div>
      
      <button
        onClick={generateNewPassword}
        disabled={isGenerating}
        className="btn-primary w-full mt-8"
      >
        <RefreshCw size={18} className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
        Generate New Password
      </button>
    </div>
  );
};

export default PasswordGeneratorForm;