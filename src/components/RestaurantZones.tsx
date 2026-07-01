/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { PlayerProfile, DialogueScenario, CharacterProficiency } from '../types';
import { 
  Coffee, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  AlertCircle,
  Coins,
  ChevronRight,
  MapPin,
  Users,
  Compass,
  BookOpen,
  HelpCircle,
  LogOut,
  Utensils
} from 'lucide-react';

interface RestaurantZonesProps {
  profile: PlayerProfile;
  difficulty: CharacterProficiency;
  library: Record<string, DialogueScenario[]>;
  onSelectZone: (zoneKey: string) => void;
  onBack: () => void;
}

export const RestaurantZones: React.FC<RestaurantZonesProps> = ({
  profile,
  difficulty,
  library,
  onSelectZone,
  onBack
}) => {
  // Remapped to the exact 5 core survival zones covering 80% of real-life English communication needs:
  const zones = [
    {
      key: 'restaurant_entrance',
      name: '1. 🚪 Entrance',
      shortName: 'Entrance',
      npcName: 'Host Alex',
      icon: <Compass className="w-5 h-5" />,
      tag: 'Greeting, reservation, waiting',
      desc: 'Checking greeting sequences, confirming table reservations, checking wait times, and getting escorted to tables.',
      isTaskGoal: profile.objectives.some(o => o.category === 'Restaurant' && !o.done),
      themeColor: 'border-orange-500/20 text-orange-400 bg-orange-950/20 hover:bg-orange-950/30',
      tagColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      badgeColor: 'bg-orange-500',
      scCount: library['restaurant_entrance']?.length || 0,
    },
    {
      key: 'restaurant_dining',
      name: '2. 🍽️ Dining Table',
      shortName: 'Dining Table',
      npcName: 'Server Liam',
      icon: <Utensils className="w-5 h-5" />,
      tag: 'Menu, ordering, small talk',
      desc: 'Browsing physical menus, placing custom food orders, asking for chef recommendations, and sustaining light small talk.',
      isTaskGoal: false,
      themeColor: 'border-rose-500/20 text-rose-400 bg-rose-950/20 hover:bg-rose-950/30',
      tagColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      badgeColor: 'bg-rose-500',
      scCount: library['restaurant_dining']?.length || 0,
    },
    {
      key: 'restaurant_service',
      name: '3. 🛎️ Service',
      shortName: 'Service',
      npcName: 'Server Ryan',
      icon: <Coffee className="w-5 h-5" />,
      tag: 'Requests, refills, asking for help',
      desc: 'Politely signaling dinner staff, requesting beverage refills, asking for extra napkins/silverware, and seeking assistance.',
      isTaskGoal: false,
      themeColor: 'border-cyan-500/20 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/30',
      tagColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      badgeColor: 'bg-cyan-500',
      scCount: library['restaurant_service']?.length || 0,
    },
    {
      key: 'restaurant_help',
      name: '4. ⚠️ Help Desk',
      shortName: 'Help Desk',
      npcName: 'Manager Chloe',
      icon: <AlertCircle className="w-5 h-5" />,
      tag: 'Wrong orders, allergies, complaints',
      desc: 'Addressing wrong kitchen items gracefully, communicating food allergies, and managing table complaints constructively.',
      isTaskGoal: false,
      themeColor: 'border-amber-500/20 text-amber-400 bg-amber-950/20 hover:bg-amber-950/30',
      tagColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      badgeColor: 'bg-amber-500',
      scCount: library['restaurant_help']?.length || 0,
    },
    {
      key: 'restaurant_checkout',
      name: '5. 💳 Checkout',
      shortName: 'Checkout',
      npcName: 'Cashier Emma',
      icon: <Coins className="w-5 h-5" />,
      tag: 'Bill, split bill, paying, goodbye',
      desc: 'Asking for the dining ticket, coordinating complex bill-splitting, settling card tap payments, and parting ways politely.',
      isTaskGoal: false,
      themeColor: 'border-emerald-500/20 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30',
      tagColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      badgeColor: 'bg-emerald-500',
      scCount: library['restaurant_checkout']?.length || 0,
    }
  ];

  const restaurantObjectives = profile.objectives.filter(o => o.category === 'Restaurant');
  const finishedRestaurantObj = restaurantObjectives.filter(o => o.done).length;

  const visualAreas = [
    {
      key: 'restaurant_entrance',
      title: '🚪 Entrance',
      subtitle: 'Greeting, reservation & waiting',
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      desc: 'Get welcomed, confirm table reservations, check wait times, and get seated.',
      tag: 'Entrance',
      isTarget: profile.objectives.some(o => o.category === 'Restaurant' && !o.done),
      themeColor: 'border-amber-500/10 bg-black/60 hover:bg-black/85 hover:border-amber-500/40 text-amber-300'
    },
    {
      key: 'restaurant_dining',
      title: '🍽️ Dining Table',
      subtitle: 'Menu, ordering & small talk',
      icon: <Utensils className="w-5 h-5 text-rose-400" />,
      desc: 'Browse food/drink listings, customize your items, place orders, and chat casually.',
      tag: 'Dining Table',
      isTarget: false,
      themeColor: 'border-rose-500/10 bg-black/60 hover:bg-black/85 hover:border-rose-500/40 text-rose-300'
    },
    {
      key: 'restaurant_service',
      title: '🛎️ Service',
      subtitle: 'Requests, refills & assistance',
      icon: <Coffee className="w-5 h-5 text-cyan-400" />,
      desc: 'Signal style-help, ask for water/soda refills, condiment saucers, or other staff aid.',
      tag: 'Service',
      isTarget: false,
      themeColor: 'border-cyan-500/10 bg-black/60 hover:bg-black/85 hover:border-cyan-500/40 text-cyan-300'
    },
    {
      key: 'restaurant_help',
      title: '⚠️ Help Desk',
      subtitle: 'Wrong orders, allergies & complaints',
      icon: <AlertCircle className="w-5 h-5 text-orange-400" />,
      desc: 'Notify server of incorrect meal items, state serious ingredient restrictions, or lodge complaints.',
      tag: 'Help Desk',
      isTarget: false,
      themeColor: 'border-orange-500/10 bg-black/60 hover:bg-black/85 hover:border-orange-500/40 text-orange-300'
    },
    {
      key: 'restaurant_checkout',
      title: '💳 Checkout',
      subtitle: 'Bill, split checkout & farewell',
      icon: <Coins className="w-5 h-5 text-emerald-400" />,
      desc: 'Request table totals, divide receipts across accounts, complete terminal payment, and depart.',
      tag: 'Checkout',
      isTarget: false,
      themeColor: 'border-emerald-500/10 bg-black/60 hover:bg-black/85 hover:border-emerald-500/40 text-emerald-300'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex-grow flex flex-col justify-between relative overflow-hidden min-h-[580px] w-full bg-slate-950 rounded-[2rem] border border-slate-900 shadow-2xl p-6 sm:p-8"
    >
      {/* High Quality Backdrop Layer with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.22] contrast-[1.05]" 
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200')` }}
      ></div>
      <div className="absolute inset-0 bg-amber-950/10 pointer-events-none z-10"></div>

      <div className="relative z-20 flex flex-col gap-6 w-full flex-grow">
        
        {/* Step 2 Header bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <button 
            onClick={onBack}
            className="bg-black/40 hover:bg-black/60 text-slate-100 border border-white/10 px-4 py-2 rounded-full flex items-center gap-1.5 text-xs font-bold leading-none active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <span className="text-lg font-black text-white font-sans tracking-tight">Restaurant</span>
          </div>

          {/* Goals completion badge */}
          <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold text-amber-400">
            <span>{finishedRestaurantObj}/{restaurantObjectives.length} Completed</span>
          </div>
        </div>

        {/* Informative Sub-Headline */}
        <div className="text-center max-w-xl mx-auto -mt-2">
          <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest font-sans">Choose an area</h3>
          <p className="text-xs text-slate-355 leading-relaxed font-sans mt-1">Select an active restaurant zone to instantly deploy an interactive survival scenario.</p>
        </div>

        {/* 2x2 grid for first 4, with 5th styled full-width centered at bottom */}
        <div className="flex-grow flex flex-col justify-center max-w-3xl mx-auto w-full gap-4 py-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visualAreas.slice(0, 4).map((area) => (
              <motion.div
                key={area.key}
                onClick={() => onSelectZone(area.key)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${area.themeColor}`}
              >
                {/* Visual Icon Box */}
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                  {area.icon}
                </div>
                
                {/* Text Metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-100 tracking-tight">{area.title}</h4>
                    <span className="text-[8px] bg-white/5 border border-white/10 text-slate-400 px-1.5 rounded uppercase font-semibold">{area.tag}</span>
                    {area.isTarget && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Prerequisite Target Active" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium font-sans mt-1 leading-none">{area.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Centered bottom Event Space option */}
          <div className="flex justify-center mt-1">
            <motion.div
              key={visualAreas[4].key}
              onClick={() => onSelectZone(visualAreas[4].key)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 w-full md:w-1/2 ${visualAreas[4].themeColor}`}
            >
              {/* Visual Icon Box */}
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                {visualAreas[4].icon}
              </div>
              
              {/* Text Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-slate-100 tracking-tight">{visualAreas[4].title}</h4>
                  <span className="text-[8px] bg-white/5 border border-white/10 text-slate-400 px-1.5 rounded uppercase font-semibold">{visualAreas[4].tag}</span>
                </div>
                <p className="text-xs text-slate-400 font-medium font-sans mt-1 leading-none">{visualAreas[4].subtitle}</p>
              </div>
            </motion.div>
          </div>

        </div>

      </div>

      {/* Touch Targets / Info Footer */}
      <div className="relative z-20 border-t border-white/5 pt-4 mt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
          <span className="text-amber-500">⚡</span>
          <span>Deploying a scenario consumes 15 energy points (Current leftovers: {profile.energy})</span>
        </div>
        <button 
          onClick={onBack}
          className="text-[9px] font-black text-slate-400 hover:text-slate-200 uppercase tracking-widest leading-none cursor-pointer"
        >
          Cancel
        </button>
      </div>

    </motion.div>
  );
};
