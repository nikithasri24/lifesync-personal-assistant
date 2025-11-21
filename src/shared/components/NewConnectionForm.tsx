/**
 * New Connection Form Component
 * Form to invite a new connection by email
 */

import React, { useState } from 'react';
import { UserPlus, Mail, Heart } from 'lucide-react';
import { createConnection } from '../api/connectionsAPI';
import type { ConnectionRelationship } from '../types/connections';
import { RELATIONSHIP_INFO } from '../types/connections';
import { logger } from '../../services/logger';

interface NewConnectionFormProps {
  onConnectionCreated: () => void;
}

const NewConnectionForm: React.FC<NewConnectionFormProps> = ({ onConnectionCreated }) => {
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<ConnectionRelationship>('friend');
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSubmitting(true);
      await createConnection({
        receiverEmail: email,
        relationship,
        label: label || undefined,
        message: message || undefined,
      });

      // Reset form
      setEmail('');
      setLabel('');
      setMessage('');

      onConnectionCreated();
    } catch (error: any) {
      logger.error('Error creating connection:', { error });
      alert(error.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-slate-900">Invite New Connection</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="friend@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Relationship
          </label>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value as ConnectionRelationship)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
          >
            {Object.entries(RELATIONSHIP_INFO).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Custom Label (Optional)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="e.g., My Husband, Best Friend, Mom"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Personal Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none resize-none"
            rows={3}
            placeholder="Add a personal message to your invitation..."
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-300 transition-colors"
          >
            {submitting ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          The person will receive an invitation and can choose which modules to share back with you.
          You can configure permissions after they accept.
        </p>
      </form>
    </div>
  );
};

export default NewConnectionForm;
