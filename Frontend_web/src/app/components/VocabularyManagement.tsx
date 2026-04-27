import { useEffect, useState } from 'react';
import { Clock, Filter, Download, AlertTriangle, CheckCircle, Calendar, ChevronDown, ChevronUp, Wifi, Activity, Info, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';
import { motion } from 'motion/react';

interface HistoryItem {
  id: number;
  objectVi: string;
  objectEn: string;
  isDangerous: boolean;
  imageUrl: string;
  createdAt: string;
}

export default function HistoryLog() {
  const [filterDanger, setFilterDanger] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const [vocabularyItems, setVocabularyItems] = useState<HistoryItem[]>([]);
    useEffect(() => {
      const token = localStorage.getItem("token");

      fetch("http://127.0.0.1:5000/history", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then((data: HistoryItem[]) => {
          console.log("DATA:", data);
          setVocabularyItems(data);
        })
        .catch(err => console.error("Fetch error:", err));
    }, []);

  const toggleItem = (id: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredHistory = vocabularyItems.filter(record => {
    const dangerMatch = filterDanger === 'all' ||
      (filterDanger === 'safe' && !record.isDangerous) ||
      (filterDanger === 'dangerous' && record.isDangerous);

    const today = new Date();
    const recordDate = new Date(record.createdAt);
    const isToday = recordDate.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = recordDate.toDateString() === yesterday.toDateString();

    const dateMatch = filterDate === 'all' ||
      (filterDate === 'today' && isToday) ||
      (filterDate === 'yesterday' && isYesterday) ||
      (filterDate === 'week' && recordDate > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));

    return dangerMatch && dateMatch;
  });

  const stats = {
    total: vocabularyItems.length,
    safe: vocabularyItems.filter(r => !r.isDangerous).length,
    dangerous: vocabularyItems.filter(r => r.isDangerous).length
  };

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleExport = () => {
    alert('Exporting detection history to CSV...');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">System Dashboard & History</h2>
          <p className="text-gray-600 mt-1">Monitor device status and detection logs</p>
        </div>
        
        <Button
          onClick={handleExport}
          variant="outline"
          className="border-pink-200 hover:bg-pink-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Device Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-2 border-teal-100 shadow-md bg-gradient-to-br from-teal-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">WiFi Connection</p>
                <p className="text-xl font-bold text-teal-600 mt-1">Connected</p>
                <p className="text-xs text-gray-500 mt-1">Signal: Strong (92%)</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Wifi className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-100 shadow-md bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Device Status</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">Online</p>
                <p className="text-xs text-gray-500 mt-1">ESP32-CAM Active</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Detections</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Safe Objects</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.safe}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Dangerous Items</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.dangerous}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filters */}
      <Card className="border-2 border-pink-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-orange-50 border-b border-pink-100">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-pink-600" />
            <span>Filter History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Safety Level</label>
              <Select value={filterDanger} onValueChange={setFilterDanger}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="safe">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Safe Only
                    </div>
                  </SelectItem>
                  <SelectItem value="dangerous">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                      Dangerous Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time Period</label>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-blue-500 mr-2" />
                      Today
                    </div>
                  </SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <Card className="border-2 border-gray-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
          <CardTitle>Detection Timeline ({filteredHistory.length} results)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filteredHistory.map((record, index) => (
              <Collapsible
                key={record.id}
                open={expandedItems.has(record.id)}
                onOpenChange={() => toggleItem(record.id)}
              >
                <div
                  className={`rounded-xl border-2 transition-all hover:shadow-md ${
                    record.isDangerous
                      ? 'bg-red-50 border-red-200 hover:border-red-300'
                      : 'bg-green-50 border-green-200 hover:border-green-300'
                  }`}
                >
                  {/* Main Detection Card */}
                  <div className="flex items-start space-x-4 p-4">
                    {/* Timeline Dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          record.isDangerous ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      />
                      {index < filteredHistory.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200 mt-2" />
                      )}
                    </div>

                    {/* Image Thumbnail */}
                    <div className="flex-shrink-0">
                      <img
                        src={record.imageUrl}
                        alt={record.objectEn}
                        className="w-20 h-20 rounded-lg object-cover shadow-md"
                      />
                    </div>

                    {/* Detection Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">{record.objectVi}</h3>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-700">{record.objectEn}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          {record.isDangerous ? (
                            <Badge className="bg-red-500 text-white border-red-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Dangerous
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white border-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Safe
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`ml-2 ${
                          record.isDangerous 
                            ? 'hover:bg-red-100 text-red-700' 
                            : 'hover:bg-green-100 text-green-700'
                        }`}
                      >
                        {expandedItems.has(record.id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  {/* Collapsible Detail Panel */}
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={`border-t-2 ${
                        record.isDangerous ? 'border-red-200 bg-red-50/50' : 'border-green-200 bg-green-50/50'
                      }`}
                    >
                      <div className="p-6 space-y-4">
                        {/* Object Description */}
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            record.isDangerous ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            <Info className={`w-5 h-5 ${record.isDangerous ? 'text-red-600' : 'text-green-600'}`} />
                          </div>
                        </div>

                        {/* Safety Explanation */}
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            record.isDangerous ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            {record.isDangerous ? (
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Filter className="w-4 h-4 text-purple-600" />
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Volume2 className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No detections found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}