import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap, Calendar, Brain, Search } from 'lucide-react';
import { roleCategories } from '../../data/roles';

interface InterviewSetupProps {
  onStart: (settings: {
    role: string;
    category: string;
    duration: number;
    difficulty: string;
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
  }) => void;
}

const InterviewSetup: React.FC<InterviewSetupProps> = ({ onStart }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [role, setRole] = useState('');
  const [duration, setDuration] = useState(15);
  const [difficulty, setDifficulty] = useState('medium');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(!!role && !!selectedCategory);
  }, [role, selectedCategory]);

  const filteredCategories = roleCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedCategoryData = roleCategories.find(cat => cat.name === selectedCategory);
  const availableRoles = selectedCategoryData?.roles || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onStart({
        role,
        category: selectedCategory,
        duration,
        difficulty,
        cameraEnabled,
        microphoneEnabled
      });
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'border-purple-500 bg-purple-900/30 text-purple-300',
      blue: 'border-blue-500 bg-blue-900/30 text-blue-300',
      green: 'border-green-500 bg-green-900/30 text-green-300',
      amber: 'border-amber-500 bg-amber-900/30 text-amber-300',
      red: 'border-red-500 bg-red-900/30 text-red-300',
      indigo: 'border-indigo-500 bg-indigo-900/30 text-indigo-300',
      pink: 'border-pink-500 bg-pink-900/30 text-pink-300',
      gray: 'border-gray-500 bg-gray-900/30 text-gray-300',
      teal: 'border-teal-500 bg-teal-900/30 text-teal-300',
      cyan: 'border-cyan-500 bg-cyan-900/30 text-cyan-300',
      orange: 'border-orange-500 bg-orange-900/30 text-orange-300',
      violet: 'border-violet-500 bg-violet-900/30 text-violet-300'
    };
    return colorMap[color] || 'border-gray-500 bg-gray-900/30 text-gray-300';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Search Roles or Categories
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for roles, categories..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Category
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          {filteredCategories.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => {
                setSelectedCategory(category.name);
                setRole(''); // Reset role when category changes
              }}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedCategory === category.name
                  ? getColorClasses(category.color)
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{category.icon}</span>
                <div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs opacity-75">{category.roles.length} roles</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Role Selection */}
      {selectedCategory && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Role in {selectedCategory}
          </label>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="block w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 pr-8 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select a role</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <ChevronDown size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Interview Duration (minutes)
        </label>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setDuration(Math.max(5, duration - 5))}
            className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-300 hover:bg-gray-700"
          >
            -
          </button>
          <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-center text-white">
            {duration} minutes
          </div>
          <button
            type="button"
            onClick={() => setDuration(Math.min(60, duration + 5))}
            className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-300 hover:bg-gray-700"
          >
            +
          </button>
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Difficulty Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['easy', 'medium', 'hard'].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              className={`py-2 px-4 rounded-lg border ${
                difficulty === level
                  ? 'border-purple-500 bg-purple-900/30 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
              } transition-colors capitalize flex items-center justify-center`}
            >
              {level === 'easy' && <Zap size={16} className="mr-1 text-green-400" />}
              {level === 'medium' && <Calendar size={16} className="mr-1 text-amber-400" />}
              {level === 'hard' && <Brain size={16} className="mr-1 text-red-400" />}
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Device Settings */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Device Settings
        </label>
        <div className="flex items-center">
          <div className="form-control">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cameraEnabled}
                onChange={(e) => setCameraEnabled(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-10 h-5 rounded-full ${
                  cameraEnabled ? 'bg-purple-600' : 'bg-gray-700'
                } transition-colors relative`}
              >
                <div
                  className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                    cameraEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                ></div>
              </div>
              <span className="ml-2">Enable Camera</span>
            </label>
          </div>
        </div>
        <div className="flex items-center">
          <div className="form-control">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={microphoneEnabled}
                onChange={(e) => setMicrophoneEnabled(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-10 h-5 rounded-full ${
                  microphoneEnabled ? 'bg-purple-600' : 'bg-gray-700'
                } transition-colors relative`}
              >
                <div
                  className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                    microphoneEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                ></div>
              </div>
              <span className="ml-2">Enable Microphone</span>
            </label>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={!isValid}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            isValid
              ? 'btn-primary'
              : 'bg-gray-700 cursor-not-allowed'
          }`}
        >
          Start Interview
        </button>
      </div>
    </form>
  );
};

export default InterviewSetup;