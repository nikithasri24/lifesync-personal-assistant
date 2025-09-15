import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { 
  Calendar,
  Droplets,
  Heart,
  TrendingUp,
  Apple,
  Smartphone,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Thermometer,
  Target
} from 'lucide-react';
import { format, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';
import { getHealthIntegration } from '../utils/healthSync';

export default function AppleHealthCycles() {
  const {
    periodCycles,
    periodSettings,
    periodPredictions,
    healthSyncStatus,
    syncWithAppleHealth,
    generatePeriodPredictions,
    updatePeriodSettings
  } = useAppStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [liveHealthData, setLiveHealthData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Auto-sync on component mount with error handling
    const initializeData = async () => {
      try {
        await handleRefreshData();
      } catch (error) {
        console.error('Failed to initialize health data:', error);
      }
    };
    
    initializeData();
    
    // Set up periodic sync every 30 seconds when app is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleRefreshData().catch(console.error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const healthIntegration = getHealthIntegration();
      
      // Try to get permissions first
      const hasPermission = await healthIntegration.requestPermissions();
      
      if (hasPermission) {
        // Check if the integration has the getLiveHealthData method
        if ('getLiveHealthData' in healthIntegration) {
          try {
            const liveData = await (healthIntegration as any).getLiveHealthData();
            setLiveHealthData(liveData);
            setLastSync(new Date());
            
            // Cache the data locally
            localStorage.setItem('health-app-cache', JSON.stringify(liveData));
            localStorage.setItem('health-app-last-sync', new Date().toISOString());
          } catch (dataError) {
            console.warn('Failed to get live health data, using fallback:', dataError);
            // Try to load cached data
            const cachedData = localStorage.getItem('health-app-cache');
            if (cachedData) {
              setLiveHealthData(JSON.parse(cachedData));
            }
          }
        }
        
        // Also trigger the store sync
        try {
          await syncWithAppleHealth();
          generatePeriodPredictions();
        } catch (storeError) {
          console.warn('Store sync failed:', storeError);
        }
      } else {
        console.log('Health permissions not granted');
      }
    } catch (error) {
      console.error('Failed to refresh health data:', error);
      // Load any cached data as fallback
      const cachedData = localStorage.getItem('health-app-cache');
      if (cachedData) {
        try {
          setLiveHealthData(JSON.parse(cachedData));
        } catch (parseError) {
          console.error('Failed to parse cached data:', parseError);
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const openHealthApp = () => {
    // Try to open Health app on iOS
    const healthURL = 'x-apple-health://';
    const fallbackURL = 'https://support.apple.com/en-us/HT203037';
    
    try {
      window.location.href = healthURL;
      // Fallback if Health app doesn't open
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.open(fallbackURL, '_blank');
        }
      }, 1000);
    } catch (error) {
      window.open(fallbackURL, '_blank');
    }
  };

  const getFlowData = () => {
    if (!liveHealthData?.menstrualFlow?.samples) return [];
    return liveHealthData.menstrualFlow.samples.map((sample: any) => ({
      date: new Date(sample.startDate),
      flow: sample.value <= 2 ? 'light' : sample.value === 3 ? 'medium' : 'heavy',
      originalValue: sample.value
    }));
  };

  const getCurrentCycle = () => {
    const flowData = getFlowData();
    if (flowData.length === 0) return null;
    
    // Find the most recent period start
    const sortedData = flowData.sort((a, b) => b.date.getTime() - a.date.getTime());
    const latestPeriod = sortedData[0];
    
    if (!latestPeriod) return null;
    
    const cycleDay = differenceInDays(new Date(), latestPeriod.date) + 1;
    return {
      startDate: latestPeriod.date,
      currentDay: cycleDay > 0 ? cycleDay : 1
    };
  };

  const getNextPrediction = () => {
    const flowData = getFlowData();
    if (flowData.length < 2) return null;
    
    // Calculate average cycle length from recent data
    const periods = flowData
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .filter((sample, index, arr) => {
        if (index === 0) return true;
        const daysDiff = differenceInDays(sample.date, arr[index - 1].date);
        return daysDiff > 20; // New cycle if more than 20 days apart
      });
    
    if (periods.length < 2) return null;
    
    const cycleLengths = [];
    for (let i = 1; i < periods.length; i++) {
      cycleLengths.push(differenceInDays(periods[i].date, periods[i - 1].date));
    }
    
    const avgCycleLength = cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length;
    const lastPeriod = periods[periods.length - 1];
    const nextPeriodDate = addDays(lastPeriod.date, Math.round(avgCycleLength));
    
    return {
      date: nextPeriodDate,
      daysUntil: differenceInDays(nextPeriodDate, new Date()),
      confidence: Math.min(90, periods.length * 15) // Higher confidence with more data
    };
  };

  const currentCycle = getCurrentCycle();
  const nextPrediction = getNextPrediction();
  const flowData = getFlowData();

  // Calendar view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getFlowForDate = (date: Date) => {
    return flowData.find(flow => isSameDay(flow.date, date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Apple className="h-8 w-8 text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cycle Tracking</h1>
              <p className="text-gray-600">Synced from Apple Health</p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
          
          <button
            onClick={openHealthApp}
            className="btn-primary flex items-center space-x-2"
          >
            <ExternalLink size={16} />
            <span>Open Health App</span>
          </button>
        </div>
      </div>

      {/* Sync Status */}
      <div className="card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              healthSyncStatus?.status === 'success' ? 'bg-green-100' : 
              healthSyncStatus?.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {healthSyncStatus?.status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {healthSyncStatus?.status === 'error' && <AlertCircle className="h-6 w-6 text-red-600" />}
              {!healthSyncStatus && <Clock className="h-6 w-6 text-blue-600" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Health App Integration</h3>
              <p className="text-sm text-gray-600">
                {healthSyncStatus?.status === 'success' && `Last synced ${lastSync ? format(lastSync, 'h:mm a') : 'recently'}`}
                {healthSyncStatus?.status === 'error' && 'Sync failed - check permissions'}
                {!healthSyncStatus && 'Tap refresh to sync with Health app'}
              </p>
            </div>
          </div>
          
          {healthSyncStatus?.recordsImported !== undefined && (
            <div className="text-right">
              <div className="text-lg font-semibold text-purple-600">
                {healthSyncStatus.recordsImported}
              </div>
              <div className="text-sm text-gray-600">Records synced</div>
            </div>
          )}
        </div>
      </div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Droplets className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Current Cycle</p>
              <p className="text-lg font-semibold text-gray-900">
                {currentCycle ? `Day ${currentCycle.currentDay}` : 'No data'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Next Period</p>
              <p className="text-lg font-semibold text-gray-900">
                {nextPrediction 
                  ? nextPrediction.daysUntil > 0 
                    ? `${nextPrediction.daysUntil} days`
                    : 'Due now'
                  : 'Calculating...'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Prediction</p>
              <p className="text-lg font-semibold text-gray-900">
                {nextPrediction ? `${nextPrediction.confidence}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Health App Mirror Calendar */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(addDays(currentDate, -30))}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addDays(currentDate, 30))}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                →
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {calendarDays.map((day, index) => {
              const flowForDay = getFlowForDate(day);
              const isToday_ = isToday(day);
              const isPredicted = nextPrediction && isSameDay(day, nextPrediction.date);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              
              return (
                <div
                  key={index}
                  className={`p-2 min-h-[60px] border border-gray-100 relative ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday_ ? 'bg-blue-50 border-blue-200' : ''} ${
                    flowForDay ? 'bg-pink-50 border-pink-200' : ''
                  } ${isPredicted ? 'bg-purple-50 border-purple-200 border-dashed' : ''}`}
                >
                  <div className={`text-sm font-medium ${
                    isToday_ ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  {flowForDay && (
                    <div className="mt-1">
                      <div className={`w-3 h-3 rounded-full ${
                        flowForDay.flow === 'light' ? 'bg-pink-300' :
                        flowForDay.flow === 'medium' ? 'bg-pink-500' : 'bg-pink-700'
                      }`} />
                    </div>
                  )}
                  
                  {isPredicted && (
                    <div className="absolute bottom-1 right-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full opacity-60" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-300 rounded-full" />
              <span>Light</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full" />
              <span>Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-700 rounded-full" />
              <span>Heavy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full opacity-60" />
              <span>Predicted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health App Instructions */}
      {(!liveHealthData || flowData.length === 0) && (
        <div className="card">
          <div className="p-6 text-center">
            <Apple className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect to Apple Health</h3>
            <p className="text-gray-600 mb-4">
              This page shows exactly what's in your iPhone's Health app. To get started:
            </p>
            <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <span>Open this page on your iPhone in Safari</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <span>Add to Home Screen for full integration</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <span>Grant Health app permissions when prompted</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                <span>Your cycle data will sync automatically</span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={handleRefreshData}
                className="btn-secondary"
              >
                <RefreshCw size={16} className="mr-2" />
                Try Connecting
              </button>
              <button
                onClick={openHealthApp}
                className="btn-primary"
              >
                <ExternalLink size={16} className="mr-2" />
                Open Health App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={openHealthApp}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Apple className="h-5 w-5 text-gray-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Log in Health App</div>
                <div className="text-sm text-gray-600">Add period data directly</div>
              </div>
            </button>
            
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <div className="text-left">
                <div className="font-medium text-gray-900">Sync Now</div>
                <div className="text-sm text-gray-600">Update from Health app</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}