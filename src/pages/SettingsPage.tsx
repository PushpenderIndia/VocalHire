import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Lock, Video, Mic, Monitor, Save, Upload, Camera, Check, X, Eye, EyeOff, Volume2, VolumeX } from 'lucide-react';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  currentRole: string;
  bio: string;
  profileImage: string;
}

interface NotificationSettings {
  interviewReminders: boolean;
  feedbackAvailable: boolean;
  newFeatures: boolean;
  interviewTips: boolean;
  soundAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
}

interface DeviceSettings {
  selectedCamera: string;
  selectedMicrophone: string;
  videoQuality: string;
  inputVolume: number;
  noiseReduction: boolean;
  darkMode: boolean;
  reduceMotion: boolean;
  autoStartCamera: boolean;
  autoStartMicrophone: boolean;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      currentRole: 'Software Engineer',
      bio: 'Experienced software engineer with a passion for building scalable applications and solving complex problems.',
      profileImage: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'
    };
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notification_settings');
    return saved ? JSON.parse(saved) : {
      interviewReminders: true,
      feedbackAvailable: true,
      newFeatures: false,
      interviewTips: true,
      soundAlerts: false,
      emailNotifications: true,
      pushNotifications: true
    };
  });

  // Security state
  const [security, setSecurity] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem('security_settings');
    return saved ? JSON.parse(saved) : {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginAlerts: true
    };
  });

  // Device state
  const [devices, setDevices] = useState<DeviceSettings>(() => {
    const saved = localStorage.getItem('device_settings');
    return saved ? JSON.parse(saved) : {
      selectedCamera: 'default',
      selectedMicrophone: 'default',
      videoQuality: '720p',
      inputVolume: 75,
      noiseReduction: true,
      darkMode: true,
      reduceMotion: false,
      autoStartCamera: true,
      autoStartMicrophone: true
    };
  });

  const [availableDevices, setAvailableDevices] = useState<{
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
  }>({ cameras: [], microphones: [] });

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
    { id: 'devices', label: 'Devices', icon: <Video className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'security', label: 'Security', icon: <Lock className="h-5 w-5" /> }
  ];

  // Load available devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAvailableDevices({
          cameras: devices.filter(device => device.kind === 'videoinput'),
          microphones: devices.filter(device => device.kind === 'audioinput')
        });
      } catch (error) {
        console.error('Error loading devices:', error);
      }
    };

    loadDevices();
  }, []);

  // Setup camera preview
  useEffect(() => {
    if (activeTab === 'devices') {
      setupCameraPreview();
    } else {
      cleanupPreview();
    }

    return () => cleanupPreview();
  }, [activeTab, devices.selectedCamera]);

  // Setup audio monitoring
  useEffect(() => {
    if (activeTab === 'devices' && previewStream) {
      setupAudioMonitoring();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [activeTab, previewStream, devices.selectedMicrophone]);

  const setupCameraPreview = async () => {
    try {
      const constraints = {
        video: {
          deviceId: devices.selectedCamera !== 'default' ? { exact: devices.selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          deviceId: devices.selectedMicrophone !== 'default' ? { exact: devices.selectedMicrophone } : undefined
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setPreviewStream(stream);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error setting up camera preview:', error);
    }
  };

  const setupAudioMonitoring = async () => {
    if (!previewStream) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(previewStream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel((average / 255) * 100);

        requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio monitoring:', error);
    }
  };

  const cleanupPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      setPreviewStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage('Image size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSaveMessage('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setProfile(prev => ({ ...prev, profileImage: imageUrl }));
    };
    reader.readAsDataURL(file);
  };

  const saveSettings = async (settingsType: string) => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (settingsType) {
        case 'profile':
          localStorage.setItem('user_profile', JSON.stringify(profile));
          setSaveMessage('Profile updated successfully!');
          break;
        case 'notifications':
          localStorage.setItem('notification_settings', JSON.stringify(notifications));
          setSaveMessage('Notification preferences saved!');
          break;
        case 'security':
          if (security.newPassword && security.newPassword !== security.confirmPassword) {
            setSaveMessage('Passwords do not match');
            setIsSaving(false);
            return;
          }
          if (security.newPassword && security.newPassword.length < 8) {
            setSaveMessage('Password must be at least 8 characters long');
            setIsSaving(false);
            return;
          }
          localStorage.setItem('security_settings', JSON.stringify({
            ...security,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
          setSecurity(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
          setSaveMessage('Security settings updated successfully!');
          break;
        case 'devices':
          localStorage.setItem('device_settings', JSON.stringify(devices));
          setSaveMessage('Device settings saved!');
          break;
      }

      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const testNotification = (type: string) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Witeso AI Test', {
          body: `This is a test ${type} notification`,
          icon: '/vite.svg'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Witeso AI Test', {
              body: `This is a test ${type} notification`,
              icon: '/vite.svg'
            });
          }
        });
      }
    }
  };

  const ProfileSettings: React.FC = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
      
      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); saveSettings('profile'); }}>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="md:w-1/4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                <img 
                  src={profile.profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Upload className="w-6 h-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Click to upload new photo</p>
          </div>
          
          <div className="md:w-3/4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                <input 
                  type="text" 
                  value={profile.firstName}
                  onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
                <input 
                  type="text" 
                  value={profile.lastName}
                  onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input 
                type="email" 
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Current Role</label>
              <select 
                value={profile.currentRole}
                onChange={(e) => setProfile(prev => ({ ...prev, currentRole: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option>Software Engineer</option>
                <option>Frontend Developer</option>
                <option>Backend Developer</option>
                <option>Full Stack Developer</option>
                <option>Data Scientist</option>
                <option>Product Manager</option>
                <option>Marketing Manager</option>
                <option>Business Analyst</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
          <textarea 
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
            placeholder="Tell us about yourself..."
          />
        </div>
        
        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={isSaving}
            className="btn-primary inline-flex items-center px-6 py-2 rounded-lg font-medium text-white shadow-lg disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const DeviceSettings: React.FC = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Device Settings</h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Video className="mr-2 text-purple-400" />
            Camera Settings
          </h3>
          
          <div className="glass-effect rounded-lg p-4 mb-4">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
              {previewStream ? (
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-2" />
                    <p>Camera Preview</p>
                    <p className="text-sm">Grant camera permission to see preview</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Select Camera</label>
                <select 
                  value={devices.selectedCamera}
                  onChange={(e) => setDevices(prev => ({ ...prev, selectedCamera: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="default">Default Camera</option>
                  {availableDevices.cameras.map(camera => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Video Quality</label>
                <select 
                  value={devices.videoQuality}
                  onChange={(e) => setDevices(prev => ({ ...prev, videoQuality: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="480p">480p (Standard)</option>
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="auto-start-camera" 
                  checked={devices.autoStartCamera}
                  onChange={(e) => setDevices(prev => ({ ...prev, autoStartCamera: e.target.checked }))}
                  className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="auto-start-camera" className="ml-2 text-sm">Auto-start camera in interviews</label>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Mic className="mr-2 text-blue-400" />
            Microphone Settings
          </h3>
          
          <div className="glass-effect rounded-lg p-4 mb-4">
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Audio Level</span>
                <span className="text-sm text-gray-400">{Math.round(audioLevel)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-100 ${
                    audioLevel > 70 ? 'bg-red-500' : 
                    audioLevel > 40 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(audioLevel, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Select Microphone</label>
                <select 
                  value={devices.selectedMicrophone}
                  onChange={(e) => setDevices(prev => ({ ...prev, selectedMicrophone: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="default">Default Microphone</option>
                  {availableDevices.microphones.map(mic => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Input Volume: {devices.inputVolume}%
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={devices.inputVolume}
                  onChange={(e) => setDevices(prev => ({ ...prev, inputVolume: parseInt(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="noise-reduction" 
                    checked={devices.noiseReduction}
                    onChange={(e) => setDevices(prev => ({ ...prev, noiseReduction: e.target.checked }))}
                    className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500 h-4 w-4"
                  />
                  <label htmlFor="noise-reduction" className="ml-2 text-sm">Enable Noise Reduction</label>
                </div>

                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="auto-start-mic" 
                    checked={devices.autoStartMicrophone}
                    onChange={(e) => setDevices(prev => ({ ...prev, autoStartMicrophone: e.target.checked }))}
                    className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500 h-4 w-4"
                  />
                  <label htmlFor="auto-start-mic" className="ml-2 text-sm">Auto-start microphone in interviews</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Monitor className="mr-2 text-teal-400" />
            Display Settings
          </h3>
          
          <div className="glass-effect rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="dark-mode" 
                  checked={devices.darkMode}
                  onChange={(e) => setDevices(prev => ({ ...prev, darkMode: e.target.checked }))}
                  className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="dark-mode" className="ml-2 text-sm">Dark Mode</label>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="reduce-motion" 
                  checked={devices.reduceMotion}
                  onChange={(e) => setDevices(prev => ({ ...prev, reduceMotion: e.target.checked }))}
                  className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="reduce-motion" className="ml-2 text-sm">Reduce Motion</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button 
          onClick={() => saveSettings('devices')}
          disabled={isSaving}
          className="btn-primary inline-flex items-center px-6 py-2 rounded-lg font-medium text-white shadow-lg disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );

  const NotificationSettings: React.FC = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
      
      <div className="space-y-6">
        <div className="glass-effect rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Email Notifications</h3>
            <button
              onClick={() => testNotification('email')}
              className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
            >
              Test Email
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { key: 'interviewReminders', label: 'Interview Reminders', desc: 'Receive reminders before scheduled interviews' },
              { key: 'feedbackAvailable', label: 'Feedback Available', desc: 'Get notified when interview feedback is ready' },
              { key: 'newFeatures', label: 'New Features', desc: 'Learn about new platform features and updates' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{label}</h4>
                  <p className="text-sm text-gray-400">{desc}</p>
                </div>
                <div className="form-control">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[key as keyof NotificationSettings] as boolean}
                      onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${
                      notifications[key as keyof NotificationSettings] ? 'bg-purple-600' : 'bg-gray-700'
                    }`}>
                      <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                        notifications[key as keyof NotificationSettings] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}></div>
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="glass-effect rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">In-App Notifications</h3>
            <button
              onClick={() => testNotification('push')}
              className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
            >
              Test Notification
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { key: 'interviewTips', label: 'Interview Tips', desc: 'Receive helpful tips before interviews' },
              { key: 'soundAlerts', label: 'Sound Alerts', desc: 'Play sound notifications for important events' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{label}</h4>
                  <p className="text-sm text-gray-400">{desc}</p>
                </div>
                <div className="form-control">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[key as keyof NotificationSettings] as boolean}
                      onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${
                      notifications[key as keyof NotificationSettings] ? 'bg-purple-600' : 'bg-gray-700'
                    }`}>
                      <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                        notifications[key as keyof NotificationSettings] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}></div>
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-effect rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-400">Receive notifications via email</p>
              </div>
              <div className="form-control">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.emailNotifications}
                    onChange={(e) => setNotifications(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${
                    notifications.emailNotifications ? 'bg-purple-600' : 'bg-gray-700'
                  }`}>
                    <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                      notifications.emailNotifications ? 'translate-x-5' : 'translate-x-0.5'
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-gray-400">Receive browser push notifications</p>
              </div>
              <div className="form-control">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.pushNotifications}
                    onChange={(e) => setNotifications(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${
                    notifications.pushNotifications ? 'bg-purple-600' : 'bg-gray-700'
                  }`}>
                    <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                      notifications.pushNotifications ? 'translate-x-5' : 'translate-x-0.5'
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button 
          onClick={() => saveSettings('notifications')}
          disabled={isSaving}
          className="btn-primary inline-flex items-center px-6 py-2 rounded-lg font-medium text-white shadow-lg disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );

  const SecuritySettings: React.FC = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
      
      <div className="space-y-6">
        <div className="glass-effect rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Change Password</h3>
          
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveSettings('security'); }}>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={security.currentPassword}
                  onChange={(e) => setSecurity(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? 'text' : 'password'}
                  value={security.newPassword}
                  onChange={(e) => setSecurity(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={security.confirmPassword}
                  onChange={(e) => setSecurity(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div>
              <button 
                type="submit"
                disabled={isSaving}
                className="btn-primary inline-flex items-center px-4 py-2 rounded-lg font-medium text-white shadow-lg disabled:opacity-50"
              >
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="glass-effect rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">Enable additional security for your account</p>
              <p className="text-xs text-gray-500 mt-1">
                {security.twoFactorEnabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
              </p>
            </div>
            <div className="form-control">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.twoFactorEnabled}
                  onChange={(e) => setSecurity(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors relative ${
                  security.twoFactorEnabled ? 'bg-purple-600' : 'bg-gray-700'
                }`}>
                  <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                    security.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
          
          <button 
            type="button"
            disabled={!security.twoFactorEnabled}
            className={`border border-purple-500 hover:bg-purple-500/20 transition-colors px-4 py-2 rounded-lg font-medium text-white ${
              !security.twoFactorEnabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {security.twoFactorEnabled ? 'Configure 2FA' : 'Enable 2FA First'}
          </button>
        </div>

        <div className="glass-effect rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Session Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Session Timeout: {security.sessionTimeout} minutes
              </label>
              <input 
                type="range" 
                min="15" 
                max="120" 
                step="15"
                value={security.sessionTimeout}
                onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>15 min</span>
                <span>2 hours</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Login Alerts</h4>
                <p className="text-sm text-gray-400">Get notified of new login attempts</p>
              </div>
              <div className="form-control">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.loginAlerts}
                    onChange={(e) => setSecurity(prev => ({ ...prev, loginAlerts: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${
                    security.loginAlerts ? 'bg-purple-600' : 'bg-gray-700'
                  }`}>
                    <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                      security.loginAlerts ? 'translate-x-5' : 'translate-x-0.5'
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="glass-effect rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium">Current Session</h4>
                <p className="text-xs text-gray-400">Chrome on Windows • Active now</p>
              </div>
              <div>
                <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
            
            <button 
              type="button"
              className="text-red-400 hover:text-red-300 transition-colors text-sm"
              onClick={() => {
                if (confirm('Are you sure you want to log out of all devices? You will need to log in again.')) {
                  setSaveMessage('All sessions terminated successfully');
                  setTimeout(() => setSaveMessage(''), 3000);
                }
              }}
            >
              Log Out of All Devices
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          saveMessage.includes('Error') || saveMessage.includes('not match') || saveMessage.includes('8 characters')
            ? 'bg-red-900/30 text-red-300 border border-red-500/30'
            : 'bg-green-900/30 text-green-300 border border-green-500/30'
        }`}>
          {saveMessage.includes('Error') || saveMessage.includes('not match') || saveMessage.includes('8 characters') ? (
            <X className="mr-2 h-5 w-5" />
          ) : (
            <Check className="mr-2 h-5 w-5" />
          )}
          {saveMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="glass-effect rounded-xl p-4">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-purple-900/30 text-white border border-purple-500/30' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Content Area */}
        <div className="md:col-span-3">
          <div className="glass-effect rounded-xl p-6">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'devices' && <DeviceSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'security' && <SecuritySettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;