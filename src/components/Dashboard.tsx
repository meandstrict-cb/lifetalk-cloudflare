/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PlayerProfile, CharacterProficiency } from '../types';
import { MapPin, Compass, Home as HomeIcon, Coffee, Briefcase, Trees, Lock, Scroll, CheckCircle2, ChevronRight, BedDouble, Moon, Utensils, User, Zap, Award, Shield, Coins, Flame, Target, Sparkles } from 'lucide-react';
import { toast } from './Toast';
// @ts-ignore
import dreamCityMap from '../assets/images/seaside_town-1.png';

interface DashboardProps {
  profile: PlayerProfile;
  difficulty: CharacterProficiency;
  onEnterLocation: (locationKey: string, activeZone?: string) => void;
  onAdvanceDay: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, difficulty, onEnterLocation, onAdvanceDay }) => {
  const [clickedLocation, setClickedLocation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const locations = [
    {
      id: 'home',
      name: 'Home',
      subtitle: 'Your Apartment',
      icon: <HomeIcon className="w-5 h-5" />,
      left: '15%',
      top: '18%',
      color: 'bg-[#5b599c] text-white hover:bg-[#4b498a]',
      dotColor: 'bg-emerald-500',
      isLocked: false,
    },
    {
      id: 'cafe',
      name: 'Newlang restaurant',
      subtitle: 'Meet • Relax',
      icon: <Utensils className="w-5 h-5" />,
      left: '42%',
      top: '21%',
      color: 'bg-[#ea7c49] text-white hover:bg-[#da6c39]',
      dotColor: 'bg-orange-500',
      isLocked: false,
    },
    {
      id: 'work',
      name: 'City Center',
      subtitle: 'Jobs • Offices',
      icon: <Briefcase className="w-5 h-5" />,
      left: '73%',
      top: '25%',
      color: 'bg-[#8370be] text-white hover:bg-[#7360ae]',
      dotColor: 'bg-purple-500',
      isLocked: false,
    },
    {
      id: 'park',
      name: 'Park',
      subtitle: 'Relax • Walk',
      icon: <Trees className="w-5 h-5" />,
      left: '18%',
      top: '55%',
      color: 'bg-[#5d9a60] text-white hover:bg-[#4d8a50]',
      dotColor: 'bg-emerald-500',
      isLocked: false,
    },
    {
      id: 'ruins',
      name: 'Locked Area',
      subtitle: 'Unlock at Level 5',
      icon: <Lock className="w-4 h-4" />,
      left: '48%',
      top: '64%',
      color: 'bg-[#40546f] text-slate-200 hover:bg-[#30445f]',
      dotColor: 'bg-slate-500',
      isLocked: true,
    },
  ];

  const handleLocationClick = (locId: string) => {
    if (locId === 'ruins') {
      toast.warning("Metro Terminal is locked for future expansion releases!");
      return;
    }
    if (locId === 'home') {
      toast.warning("Redecorating feature and Apartment inventory is currently locked. Rest is available in the footer 'End Day' action!");
      return;
    }
    setClickedLocation(locId);
    onEnterLocation(locId);
  };

  return (
    <div className="flex-grow flex flex-col w-full min-h-[580px]">
      
      {/* DESKTOP GRAPHIC MAP VIEW: shown on md and above */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="hidden md:flex flex-grow flex-col min-h-[580px] bg-[#1a140d]/65 relative overflow-hidden w-full rounded-[2rem]"
      >
        {/* Background Drift Overlay */}
        <div className="absolute inset-0 bg-amber-950/5 z-10 pointer-events-none"></div>

        {/* Decorative City Grid Blueprint */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-100" 
          style={{ backgroundImage: `url(${dreamCityMap})` }}
        ></div>

        {/* Map Banner header scroll */}
        <div className="absolute top-4 left-4 z-20 bg-[#fffdf9]/95 border border-slate-200/60 rounded-2xl px-4 py-2.5 max-w-xs shadow-xl backdrop-blur-md flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[14px] font-black text-slate-800 font-sans tracking-tight">Dream City</h4>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider leading-none font-sans">
                Day {profile.day} • {difficulty} Mode
              </p>
              <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
            </div>
          </div>
        </div>



        {/* Interactive Map Overlay Pins */}
        <div className="absolute inset-0 z-20 pointer-events-none pt-2">
          {locations.map((loc) => {
            const isCafe = loc.id === 'cafe';
            const simplifiedName = loc.id === 'home' ? 'Apartment' : loc.id === 'work' ? 'Office' : loc.id === 'cafe' ? 'Restaurant' : loc.name;
            const badgeBg = isCafe 
              ? 'bg-[#ea7c49] text-white border-2 border-amber-300 font-extrabold shadow-[0_0_20px_rgba(234,124,73,0.65)] hover:bg-[#da6c39] scale-110' 
              : 'bg-black/75 text-amber-100/90 border border-white/15 hover:bg-black/90';

            return (
              <motion.div 
                key={loc.id} 
                className={`absolute select-none pointer-events-auto cursor-pointer p-2.5 px-4 rounded-2xl flex items-center gap-2 shadow-2xl transition-all duration-150 ${badgeBg}`}
                style={{ 
                  left: loc.left, 
                  top: loc.top,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleLocationClick(loc.id)}
              >
                <span className="text-sm flex items-center justify-center">{loc.icon}</span>
                <span className="text-xs font-black font-sans tracking-wide leading-none">{simplifiedName}</span>
                {!loc.isLocked && !isCafe && (
                  <span className={`w-1.5 h-1.5 rounded-full ${loc.dotColor} flex-shrink-0 animate-pulse`} />
                )}
              </motion.div>
            );
          })}
        </div>


        {/* Floating Day Advancement Notification */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 bg-[#fffdf9]/95 border border-slate-200/60 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md max-w-[260px]">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 flex-shrink-0">
            <BedDouble className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h5 className="text-[10px] font-extrabold text-slate-800 leading-tight">Ready for class tomorrow?</h5>
            <button 
              onClick={onAdvanceDay}
              className="text-[9px] text-[#fffdf9] font-black bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 px-3 py-1.5 rounded-xl mt-1.5 transition-colors uppercase tracking-wider shadow-md active:scale-95 flex items-center gap-1.5"
            >
              Sleep & End Day {profile.day} &rarr;
            </button>
          </div>
        </div>

        {/* Objectives Display Scroll list */}
        <div className="absolute bottom-4 right-4 z-20 bg-[#fffdf9]/95 border border-slate-200/60 rounded-2xl p-4 w-68 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Scroll className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-sans">Today's Tasks</h4>
            </div>
            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {(profile.objectives || []).filter(o => !o.done).length}
            </span>
          </div>
          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
            {(profile.objectives || []).map((obj) => (
              <div 
                key={obj.id} 
                className={`flex items-start gap-2 text-[10px] leading-relaxed p-1.5 rounded-xl transition-all ${
                  obj.done ? 'bg-emerald-500/5 text-emerald-600 border border-emerald-500/10' : 'bg-slate-50 text-slate-600 border border-slate-100'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                  obj.done ? 'text-emerald-500' : 'text-slate-350'
                }`} />
                <span className={`font-semibold ${obj.done ? 'line-through text-slate-400' : ''}`}>
                  {obj.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* MOBILE LIST VIEW: shown below md */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex md:hidden flex-grow flex-col gap-4 p-4 rounded-3xl bg-[#130f0a] text-slate-100 border border-slate-900 shadow-2xl overflow-y-auto"
      >
        {/* Mobile Header card */}
        <div className="bg-[#fffdf9]/95 border border-slate-200/60 rounded-2xl px-4 py-3 shadow-md flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
            <MapPin className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 font-sans tracking-tight">City Locations</h4>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">
                Day {profile.day} • {difficulty} Mode
              </p>
            </div>
          </div>
        </div>



        {/* Dynamic Map/List Segmented Toggle Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-900 gap-1.5 self-stretch">
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
              viewMode === 'map'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md transform scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200 bg-transparent'
            }`}
          >
            🗺️ Map View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md transform scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200 bg-transparent'
            }`}
          >
            📋 List View
          </button>
        </div>

        {viewMode === 'map' ? (
          /* Mobile Interactive Graphic Blueprint Map Wrapper */
          <div className="relative w-full aspect-[4/3] min-h-[290px] bg-[#1a140d]/80 overflow-hidden rounded-2xl border border-slate-900 shadow-2xl select-none">
            {/* Background Map Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: `url(${dreamCityMap})` }}
            ></div>
            <div className="absolute inset-0 bg-amber-950/20 z-10 pointer-events-none"></div>

            {/* Interactive Pins on Map representation */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {locations.map((loc) => {
                const isCafe = loc.id === 'cafe';
                const simplifiedName = loc.id === 'home' ? 'Apartment' : loc.id === 'work' ? 'Office' : loc.id === 'cafe' ? 'Restaurant' : loc.name;
                const badgeBg = isCafe 
                  ? 'bg-[#ea7c49] text-white border-2 border-amber-300 font-extrabold shadow-[0_0_12px_rgba(234,124,73,0.65)] scale-105' 
                  : 'bg-black/80 text-amber-100/90 border border-white/10';

                return (
                  <motion.div 
                    key={loc.id} 
                    className={`absolute select-none pointer-events-auto cursor-pointer p-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xl transition-all duration-150 ${badgeBg}`}
                    style={{ 
                      left: loc.left, 
                      top: loc.top,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => handleLocationClick(loc.id)}
                  >
                    <span className="text-[10px] sm:text-xs flex items-center justify-center">{loc.icon}</span>
                    <span className="text-[10px] font-extrabold font-sans tracking-wide leading-none">{simplifiedName}</span>
                    {!loc.isLocked && !isCafe && (
                      <span className={`w-1.5 h-1.5 rounded-full ${loc.dotColor} flex-shrink-0 animate-pulse`} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Touch-Friendly Location Cards Roll */
          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-sans mb-1 px-1">📍 Exploration Sites</h5>
            {locations.map((loc) => (
              <div
                key={loc.id}
                onClick={() => handleLocationClick(loc.id)}
                className={`p-3.5 rounded-2xl border bg-slate-905/90 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  loc.isLocked ? 'border-slate-900 bg-slate-950/40 opacity-60' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl ${loc.color} shadow-md flex items-center justify-center border border-white/20 text-white flex-shrink-0`}>
                    {loc.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 leading-none">
                      <h4 className="text-xs font-extrabold text-slate-100 font-sans tracking-tight">
                        {loc.name}
                      </h4>
                      {!loc.isLocked ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${loc.dotColor} animate-pulse`} />
                      ) : (
                        <span className="text-[7.5px] bg-slate-800 border border-slate-700 text-slate-400 font-extrabold uppercase px-1 rounded">Locked</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-sans leading-none font-medium">
                      {loc.subtitle}
                    </p>
                  </div>
                </div>
                {!loc.isLocked && (
                  <span className="text-[9px] text-[#fffdf9] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 rounded-xl">
                    Visit &rarr;
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Button: End Day CTA on mobile */}
        <div className="bg-[#fffdf9]/95 border border-slate-200/60 rounded-2xl p-4 shadow-md flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-orange-600 animate-bounce" />
            <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider leading-tight">Ready for class tomorrow?</h5>
          </div>
          <p className="text-[10px] text-slate-500 font-sans">Advance the calendar & fully recharge energy points.</p>
          <button 
            onClick={onAdvanceDay}
            className="w-full text-center text-xs text-[#fffdf9] font-black bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 py-3.5 rounded-xl transition-colors uppercase tracking-widest shadow-md active:scale-95 flex items-center justify-center gap-1.5 mt-1"
          >
            Sleep & End Day {profile.day} &rarr;
          </button>
        </div>

        {/* Objectives card on mobile */}
        <div className="bg-[#fffdf9]/95 border border-slate-200/60 rounded-2xl p-4 shadow-md mt-1 mb-2">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Scroll className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-sans">Active Tasks ({(profile.objectives || []).filter(o => !o.done).length})</h4>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {(profile.objectives || []).map((obj) => (
              <div 
                key={obj.id} 
                className={`flex items-start gap-2 text-[10px] leading-relaxed p-2 rounded-xl transition-all ${
                  obj.done ? 'bg-emerald-500/5 text-emerald-600 border border-emerald-500/10' : 'bg-slate-50 text-slate-700 border border-slate-100'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                  obj.done ? 'text-emerald-500' : 'text-slate-300'
                }`} />
                <span className={`font-semibold ${obj.done ? 'line-through text-slate-400 font-normal' : 'text-slate-700'}`}>
                  {obj.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </div>
  );
};
