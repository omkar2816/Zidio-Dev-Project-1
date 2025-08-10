import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, updateUserPreferences } from '../../store/slices/authSlice';
import { setDefaultColors, updateChartPreferences } from '../../store/slices/uiSlice';
import toast from 'react-hot-toast';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { chartPreferences, theme } = useSelector((state) => state.ui);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [selectedTheme, setSelectedTheme] = useState(theme || 'light');
  const [colors, setColors] = useState(chartPreferences.defaultColors.join(', '));

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateUserProfile(profileForm)).unwrap();
      toast.success('Profile updated', { position: 'bottom-center' });
    } catch (err) {
      toast.error(err?.message || 'Failed to update profile', { position: 'bottom-center' });
    }
  };

  const handlePreferencesSave = async (e) => {
    e.preventDefault();
    try {
      const colorArray = colors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      dispatch(setDefaultColors(colorArray));
      await dispatch(updateUserPreferences({ theme: selectedTheme })).unwrap();
      toast.success('Preferences saved', { position: 'bottom-center' });
    } catch (err) {
      toast.error(err?.message || 'Failed to save preferences', { position: 'bottom-center' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
        {user ? (
          <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">First Name</label>
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Last Name</label>
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Profile</button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">No data available.</div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
        <form onSubmit={handlePreferencesSave} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Theme</label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Default Chart Colors (comma-separated)</label>
            <input
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={colors}
              onChange={(e) => setColors(e.target.value)}
            />
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            These preferences will apply to charts and visualizations.
          </div>

          <div className="flex justify-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Preferences</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;


