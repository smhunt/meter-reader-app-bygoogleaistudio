import React, { useState } from 'react';
import { User, LogOut, Share2, Shield, Check, Copy } from 'lucide-react';
import { UserInfo } from '../types';
import { signOut } from '../services/auth';

interface ProfileProps {
  userInfo: UserInfo;
}

export const Profile: React.FC<ProfileProps> = ({ userInfo }) => {
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      setSigningOut(false);
    }
  };

  const handleShareInvite = async () => {
    const inviteUrl = window.location.origin;
    const inviteText = `Join FlowCheck - Meter Reading System\n\nSign up here: ${inviteUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join FlowCheck',
          text: inviteText,
          url: inviteUrl
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        copyToClipboard(inviteUrl);
      }
    } else {
      copyToClipboard(inviteUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Profile Card */}
      <div className="bg-surface border border-slate-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <User size={32} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">{userInfo.displayName}</h2>
              {userInfo.isAdmin && (
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full flex items-center">
                  <Shield size={12} className="mr-1" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">{userInfo.email}</p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-surface border border-slate-700 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">STATUS</p>
            <p className="text-sm font-mono text-green-400">ONLINE</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">SYNC</p>
            <p className="text-sm text-slate-400">Up to date</p>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {userInfo.isAdmin && (
        <div className="bg-surface border border-slate-700 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-medium text-white mb-3">Team Management</h3>
          <button
            onClick={handleShareInvite}
            className="w-full bg-primary/20 text-primary py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-primary/30 transition-colors"
          >
            {copied ? (
              <>
                <Check size={18} />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={18} />
                <span>Invite Team Member</span>
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Share a link for others to join and create an account
          </p>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full bg-red-500/10 border border-red-500/30 text-red-400 py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-red-500/20 transition-colors disabled:opacity-50"
      >
        <LogOut size={18} />
        <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
      </button>
    </div>
  );
};
