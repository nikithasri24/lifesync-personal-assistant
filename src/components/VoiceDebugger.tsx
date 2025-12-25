/**
 * Voice Debugger Component
 * 
 * Helps diagnose Voice Assistant issues by checking:
 * - Browser support
 * - Microphone permissions
 * - API configuration
 * - Speech recognition functionality
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Mic, Volume2 } from 'lucide-react';
import useVoice from '../hooks/useVoice';

export function VoiceDebugger() {
  const [checks, setChecks] = useState({
    browserSupport: false,
    speechSynthesis: false,
    micPermission: 'unknown' as 'granted' | 'denied' | 'prompt' | 'unknown',
    groqApiKey: false,
    https: false,
  });

  const [testTranscript, setTestTranscript] = useState('');
  const [testError, setTestError] = useState('');

  const { supported, listening, start, stop, transcript, error, speak } = useVoice('en-US', {
    onFinal: (text) => setTestTranscript(text),
  });

  useEffect(() => {
    // Check browser support
    const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY || !!import.meta.env.GROQ_API_KEY;

    setChecks({
      browserSupport: hasSpeechRecognition,
      speechSynthesis: hasSpeechSynthesis,
      micPermission: 'unknown',
      groqApiKey: hasGroqKey,
      https: isHttps,
    });

    // Check microphone permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          setChecks(prev => ({ ...prev, micPermission: result.state as any }));
        })
        .catch(() => {
          setChecks(prev => ({ ...prev, micPermission: 'unknown' }));
        });
    }
  }, []);

  useEffect(() => {
    if (error) {
      setTestError(error);
    }
  }, [error]);

  const handleTestVoice = async () => {
    setTestTranscript('');
    setTestError('');
    try {
      if (listening) {
        await stop();
      } else {
        await start();
      }
    } catch (err) {
      setTestError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleTestSpeech = async () => {
    try {
      await speak('Hello! Voice synthesis is working correctly.', { rate: 1, pitch: 1 });
    } catch (err) {
      setTestError(err instanceof Error ? err.message : String(err));
    }
  };

  const StatusIcon = ({ status }: { status: boolean }) => 
    status ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Voice Assistant Debugger</h2>
          <p className="text-sm text-gray-600 mt-1">Diagnose voice functionality issues</p>
        </div>

        <div className="p-6 space-y-6">
          {/* System Checks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">System Checks</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Browser Support (Speech Recognition)</span>
                <StatusIcon status={checks.browserSupport} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Speech Synthesis</span>
                <StatusIcon status={checks.speechSynthesis} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">HTTPS / Localhost</span>
                <StatusIcon status={checks.https} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Groq API Key Configured</span>
                <StatusIcon status={checks.groqApiKey} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Microphone Permission</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">{checks.micPermission}</span>
                  {checks.micPermission === 'granted' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : checks.micPermission === 'denied' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Voice Features</h3>
            <div className="space-y-3">
              <button
                onClick={handleTestVoice}
                disabled={!supported}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                  listening
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                }`}
              >
                <Mic className="w-5 h-5" />
                {listening ? 'Stop Listening' : 'Test Voice Recognition'}
              </button>

              <button
                onClick={handleTestSpeech}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                <Volume2 className="w-5 h-5" />
                Test Speech Synthesis
              </button>
            </div>
          </div>

          {/* Results */}
          {(testTranscript || testError || transcript) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Results</h3>
              {testError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-900 font-medium">Error:</p>
                  <p className="text-sm text-red-700 mt-1">{testError}</p>
                </div>
              )}
              {(testTranscript || transcript) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900 font-medium">Transcript:</p>
                  <p className="text-sm text-green-700 mt-1">{testTranscript || transcript}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

