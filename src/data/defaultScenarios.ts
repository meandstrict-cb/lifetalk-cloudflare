/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DialogueScenario } from '../types';

import yukiAvatar from '../assets/images/npc_yuki_waitress_1782653814966.jpg';
import hiroAvatar from '../assets/images/npc_hiro_host_1782653832524.jpg';
import animeRestaurantBg from '../assets/images/anime_restaurant_bg_1782653848906.jpg';


export const defaultScenarios: Record<string, DialogueScenario[]> = {
  restaurant_entrance: [
    {
      id: "cafe_counter_order",
      title: "1. Restaurant • The Entrance (Greeting & Reservation)",
      bgClass: "sprite-bg-cafe",
      bgImageUrl: animeRestaurantBg,
      description: "Step inside Newlang Restaurant. Confirm your breakfast table reservation with Host Hiro, or manage your wait status.",
      npc_name: "Host Hiro",
      npc_gender: "male",
      npc_accent: "US",
      npc_avatar_class: "sprite-avatar-barista",
      npc_portrait_class: "portrait-barista",
      npcOpenSceneUrl: hiroAvatar,
      turns: [
        {
          npc_message: "Hi there! Welcome to Newlang Restaurant. Do you have a table reservation with us today?",
          beginner_choices: [
            {
              id: "A",
              type: "correct",
              text: "Good morning. I would like a hot latte, please.",
              feedback: "Excellent Choice! Polite and clean structure.",
              explanation: "Using 'I would like..., please' is the absolute standard for polite ordering.",
              fluency: 12,
              confidence: 6,
              money: -5,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "incorrect",
              text: "Give me hot black liquid with cow milk right now.",
              feedback: "Ouch. A bit too aggressive!",
              explanation: "Saying 'Give me' sounds demanding and using 'black liquid with cow milk' is highly unnatural.",
              fluency: 3,
              confidence: -2,
              money: -5,
              nextTurnIndex: 1
            }
          ],
          intermediate_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Good morning! Can I grab a medium caramel macchiato, please? Hope you're having a good day!",
              feedback: "Wonderfully Warm! Alex beams with friendliness.",
              explanation: "Intermediates often add casual friendliness, like 'Can I grab...' and a small pleasantry.",
              fluency: 15,
              confidence: 7,
              money: -6,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "neutral",
              text: "Hello. I would like to order one warm latte, please.",
              feedback: "Polite and crisp statement.",
              explanation: "Clear, correct standard ordering that instantly conveys your request.",
              fluency: 12,
              confidence: 5,
              money: -5,
              nextTurnIndex: 1
            },
            {
              id: "C",
              type: "direct",
              text: "Just a black coffee to go, please. Thanks.",
              feedback: "Efficient and brief.",
              explanation: "Perfect for busy, fast-paced orders. It's direct but kept polite with 'please' and 'thanks'.",
              fluency: 13,
              confidence: 6,
              money: -3,
              nextTurnIndex: 1
            }
          ],
          advanced_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Good morning! I'll take a double-shot flat white with oat milk, if you don't mind. Your espresso machine looks top-tier!",
              feedback: "Absolute Mastery! Alex smiles and compliments your taste.",
              explanation: "Advanced speakers customize drink parameters precisely and often build micro-rapport with small talk.",
              fluency: 18,
              confidence: 9,
              money: -6,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "professional",
              text: "Good morning. May I please request a double-shot americano with a splash of skimmed milk on the side?",
              feedback: "Elegantly Structured.",
              explanation: "Highly structured formal request ('May I please request...') perfect for business or upscale settings.",
              fluency: 16,
              confidence: 8,
              money: -4,
              nextTurnIndex: 1
            },
            {
              id: "C",
              type: "confident",
              text: "Let's do a large iced espresso. I'll settle the bill on my card as well.",
              feedback: "Decisive and natural.",
              explanation: "Expresses strong natural confidence, combining ordering and payment preference in a single breath.",
              fluency: 17,
              confidence: 9,
              money: -5,
              nextTurnIndex: 1
            }
          ]
        },
        {
          npc_message: "You got it! Would you like any pastries or muffins to go with your coffee?",
          isNpcEnd: false,
          beginner_choices: [
            {
              id: "A",
              type: "correct",
              text: "No, thank you. Just the coffee is fine.",
              feedback: "Well done! Simple and clear refusal.",
              explanation: "'No, thank you' is the standard polite decline.",
              fluency: 10,
              confidence: 5,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "incorrect",
              text: "No eat. I hate sugar cake.",
              feedback: "A bit blunt!",
              explanation: "Saying 'No eat' is grammatically incorrect, and commenting 'I hate sugar cake' can sound impolite.",
              fluency: 2,
              confidence: -3,
              money: 0,
              nextTurnIndex: -1
            }
          ],
          intermediate_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Oh, those blueberry muffins look delicious, but I'll pass today. Thanks though!",
              feedback: "Natural refusal!",
              explanation: "Using 'I'll pass today' and complimenting the options is very common intermediate slang.",
              fluency: 14,
              confidence: 7,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "neutral",
              text: "I am fine for now, thank you. Just the coffee, please.",
              feedback: "Polite and direct.",
              explanation: "Saves time, clear, stays polite.",
              fluency: 12,
              confidence: 6,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "C",
              type: "direct",
              text: "Actually, let's add a chocolate croissant to that. Thank you.",
              feedback: "Nice addition!",
              explanation: "Enriches the transaction naturally and clearly.",
              fluency: 13,
              confidence: 7,
              money: -4,
              nextTurnIndex: -1
            }
          ],
          advanced_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Tempting! Those croissants look incredibly fresh. I'll pass this time, but I might walk away with one tomorrow!",
              feedback: "Excellent conversational charm!",
              explanation: "Advanced speakers use light humor and projection ('might walk away with one tomorrow') to stay extremely personable.",
              fluency: 18,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "professional",
              text: "Thank you for the recommendation, but I will decline today. I appreciate the offer, though.",
              feedback: "Very courteous.",
              explanation: "Formal, respectful refusal sequence that fits elegant dining or corporate cafes perfectly.",
              fluency: 16,
              confidence: 8,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "C",
              type: "confident",
              text: "Nothing else for me. Let's just finalize the card transaction.",
              feedback: "Slick and straightforward.",
              explanation: "Indicates strong fluency by managing the transaction speed effortlessly.",
              fluency: 17,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            }
          ]
        }
      ]
    }
  ],
  restaurant_help: [
    {
      id: "cafe_register_payment",
      title: "4. Restaurant • The Help Desk (Wrong Orders, Allergies & Complaints)",
      bgClass: "sprite-bg-cafe",
      bgImageUrl: animeRestaurantBg,
      description: "Address kitchen blunders constructively. Let staff know about ingredient allergies, resolve dish mix-ups, and express polite feedback.",
      npc_name: "Manager Hiro",
      npc_gender: "male",
      npc_accent: "US",
      npc_avatar_class: "sprite-avatar-barista-chloe",
      npc_portrait_class: "portrait-chloe",
      npcOpenSceneUrl: hiroAvatar,
      turns: [
        {
          npc_message: "That'll be $6.50! The tap reader is active on the side of the black terminal whenever you're ready.",
          beginner_choices: [
            {
              id: "A",
              type: "correct",
              text: "Can I pay with Apple Pay?",
              feedback: "Very clean question!",
              explanation: "'Can I pay with...' is the ideal baseline choice to establish transaction pathways.",
              fluency: 11,
              confidence: 6,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "incorrect",
              text: "Take my cell phone electrical juice and give card success.",
              feedback: "highly confusing and grammatically scrambled.",
              explanation: "Saying 'electrical juice' fails to communicate Apple Pay logic clearly.",
              fluency: 2,
              confidence: -3,
              money: 0,
              nextTurnIndex: 1
            }
          ],
          intermediate_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Do you guys support Apple Pay? The contactless tap reader doesn't seem to be responding.",
              feedback: "Perfect description of the real-world hurdle!",
              explanation: "Informative 'Do you support...' followed by diagnostic details of the terminal issue.",
              fluency: 14,
              confidence: 8,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "neutral",
              text: "Does this card terminal accept digital wallets, or should I insert my debit card instead?",
              feedback: "Clear, professional alternative suggestion.",
              explanation: "Provides instant pragmatic options for the cashier.",
              fluency: 12,
              confidence: 7,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "C",
              type: "direct",
              text: "Contactless doesn't seem to register. Let me try swiping the card itself.",
              feedback: "Decisive and action-oriented.",
              explanation: "Quickly updates the cashier on your trouble-shooting strategy.",
              fluency: 13,
              confidence: 7,
              money: -6.50,
              nextTurnIndex: 1
            }
          ],
          advanced_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Is Apple Pay accepted here? The terminal seems to be acting up on my side, so I might need to try a physical swipe instead.",
              feedback: "Supreme execution!",
              explanation: "Uses top-tier conversational verbs: 'acting up', 'physical swipe', 'might need to'.",
              fluency: 18,
              confidence: 9,
              money: -6.50,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "professional",
              text: "Pardon me, it appears the contactless sensor is unresponsive. Is there an off-line option, or should I secure payment in cash?",
              feedback: "Remarkable corporate diplomacy.",
              explanation: "Uses elevated nouns and precise verbs: 'unresponsive', 'secure payment'.",
              fluency: 16,
              confidence: 8,
              money: -6.50,
              nextTurnIndex: 1
            },
            {
              id: "C",
              type: "confident",
              text: "The reader seems stuck. Let me reboot my card-app, or I can just hand you a ten-dollar bill to save time.",
              feedback: "Empathetic, speedy transaction-saver.",
              explanation: "Focuses on speed and offers logical cash solutions in one breath.",
              fluency: 17,
              confidence: 9,
              money: -10,
              nextTurnIndex: 1
            }
          ]
        },
        {
          npc_message: "Ah, sorry about that! The system went through! But wait... is this a cold brew? Oof, I think our drink prep line mixed up your hot latte.",
          isNpcEnd: false,
          beginner_choices: [
            {
              id: "A",
              type: "correct",
              text: "No, this is wrong. I wanted a hot cup please.",
              feedback: "Simple, correct feedback.",
              explanation: "Clearly handles the mismatch without sounding rude.",
              fluency: 10,
              confidence: 5,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "incorrect",
              text: "You make mistake! I drink fire coffee, not ice water!",
              feedback: "Unnecessarily dramatic or accusatory.",
              explanation: "Accusations like 'You make mistake!' creates instant service tension.",
              fluency: 3,
              confidence: -2,
              money: 0,
              nextTurnIndex: -1
            }
          ],
          intermediate_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Oh, excuse me, I actually ordered a hot latte rather than a cold brew. Could you double-check that for me?",
              feedback: "Beautiful, constructive feedback.",
              explanation: "Gentle clarification ('actually ordered', 'rather than') is highly effective in service fields.",
              fluency: 14,
              confidence: 7,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "neutral",
              text: "My receipt says hot latte. I think this cold brew belongs to another guest.",
              feedback: "Factual and objective correction.",
              explanation: "Points directly to receipt logic as proof.",
              fluency: 12,
              confidence: 6,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "C",
              type: "direct",
              text: "No worries! If you can just swap it for a hot latte whenever you've got a free second, that'd be great.",
              feedback: "Incredibly relaxed and flexible responder.",
              explanation: "Emphasizes 'whenever you've got a free second', taking the pressure off.",
              fluency: 15,
              confidence: 8,
              money: 0,
              nextTurnIndex: -1
            }
          ],
          advanced_choices: [
            {
              id: "A",
              type: "friendly",
              text: "No sweat, mix-ups happen! I did order a hot latte, so if it's not too much of a hassle, could you have them swap it out for me?",
              feedback: "Outstanding empathy combined with precise fluency!",
              explanation: "Native phrasings: 'no sweat', 'not too much of a hassle', 'swap it out'.",
              fluency: 18,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "professional",
              text: "Pardon the disruption, but I believe there was a minor oversight. I requested a hot beverage. Might I request a correction?",
              feedback: "Exquisite administrative correction.",
              explanation: "Shows deep administrative elegance suitable for fine cafes or hotel restaurants.",
              fluency: 16,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "C",
              type: "confident",
              text: "Ah, no problem! If the bar has already brewed this, I can pay the difference or just wait while you guys pull a fresh hot shot.",
              feedback: "Ultimate customer confidence.",
              explanation: "Provides absolute solution options to the service staff, showing total linguistic mastery.",
              fluency: 17,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            }
          ]
        }
      ]
    }
  ],
  restaurant_service: [
    {
      id: "cafe_condiment_issues",
      title: "3. Restaurant • Table Service (Requests, Refills & Asking for Help)",
      bgClass: "sprite-bg-cafe",
      bgImageUrl: animeRestaurantBg,
      description: "Practice calling for staff attention, requesting essential beverage refills, and asking for help with table accommodations or utensils.",
      npc_name: "Waitress Yuki",
      npc_gender: "female",
      npc_accent: "US",
      npc_avatar_class: "sprite-avatar-brian",
      npc_portrait_class: "sprite-portrait-brian",
      npcOpenSceneUrl: yukiAvatar,
      turns: [
        {
          npc_message: "Oh, hello there! Are you finding everything alright over at the milk and sweetener station?",
          beginner_choices: [
            {
              id: "A",
              type: "correct",
              text: "No. The milk container is empty. Needs more milk.",
              feedback: "Simple, functional request.",
              explanation: "Directly highlights the issue without complex descriptors.",
              fluency: 10,
              confidence: 5,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "incorrect",
              text: "Dry white cow milk water is absolute zero.",
              feedback: "Scrambled grammar and absurd metaphors.",
              explanation: "Calling milk 'dry white cow milk water' will puzzle the hospitality worker deeply.",
              fluency: 2,
              confidence: -3,
              money: 0,
              nextTurnIndex: 1
            }
          ],
          intermediate_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Not quite, the whole milk carafe is actually empty. Could you possibly top it up when you have a chance?",
              feedback: "Very polite, direct, and conversational.",
              explanation: "Uses 'top it up' (meaning refill) and 'when you have a chance'.",
              fluency: 14,
              confidence: 8,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "neutral",
              text: "Excuse me, we are completely out of whole milk here at the bar.",
              feedback: "Pristine, neutral declaration.",
              explanation: "Standard notification format perfect for general public use.",
              fluency: 12,
              confidence: 6,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "C",
              type: "direct",
              text: "Ah, the milk carafe seems to be bone-dry. Could we get a fresh one?",
              feedback: "Excellent informal idiom use!",
              explanation: "Using 'bone-dry' is heavily authentic and native.",
              fluency: 13,
              confidence: 7,
              money: 0,
              nextTurnIndex: 1
            }
          ],
          advanced_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Actually, it looks like the whole milk carafe has run dry. Would you mind refilling it whenever you get a break?",
              feedback: "Splendid flow and beautiful pacing!",
              explanation: "Phrase 'has run dry' and 'whenever you get a break' builds a high-level empathetic report.",
              fluency: 18,
              confidence: 9,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "professional",
              text: "Excuse me, I wanted to alert you that the whole-milk dispenser is currently depleted. No rush, but could we arrange a replacement?",
              feedback: "Refined, superb business English.",
              explanation: "Uses high vocabulary synonyms: 'depleted', 'alert you', 'arrange a replacement'.",
              fluency: 16,
              confidence: 8,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "C",
              type: "confident",
              text: "Hey, the milk station is clean out of whole milk and half-and-half. I'll watch the bar if you need to fetch refills!",
              feedback: "Outstanding warmth and helpful community spirit!",
              explanation: "Uses 'clean out of' (entirely empty) and jokingly offers to 'watch the bar' inside an advanced slang register.",
              fluency: 17,
              confidence: 9,
              money: 0,
              nextTurnIndex: 1
            }
          ]
        },
        {
          npc_message: "Oh! Thank you so much for catching that, I will swap it out immediately! (Just then, another patron blocking the napkins turns around, holding the chocolate shaker.) 'Oh, sorry! Was I blocking your way?'",
          isNpcEnd: false,
          beginner_choices: [
            {
              id: "A",
              type: "correct",
              text: "No problem. Can I grab some napkins and lids please?",
              feedback: "Clean and direct requests.",
              explanation: "Addresses the objective without over-complicating.",
              fluency: 10,
              confidence: 5,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "incorrect",
              text: "Get out. Paper wipes are mine now.",
              feedback: "Highly aggressive!",
              explanation: "Saying 'Get out' sounds like an insult in public spaces.",
              fluency: 2,
              confidence: -3,
              money: 0,
              nextTurnIndex: -1
            }
          ],
          intermediate_choices: [
            {
              id: "A",
              type: "friendly",
              text: "No worries at all! If possible, would you mind passing the chocolate shaker once you're finished with it?",
              feedback: "Superb polite alignment!",
              explanation: "Using 'passing the... once you're finished' is extremely common and highly respectful.",
              fluency: 14,
              confidence: 7,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "neutral",
              text: "Don't apologize. I just need to reach for a plastic lid real quick. Thank you.",
              feedback: "Direct and respectful.",
              explanation: "Elegantly describes the action ('reach for a lid real quick') to minimize awkwardness.",
              fluency: 12,
              confidence: 6,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "C",
              type: "direct",
              text: "You're totally fine! I just need to sneak in and snag a few napkins. Thanks!",
              feedback: "Great active casual phrase!",
              explanation: "Slangs like 'sneak in' and 'snag a few' are heavily native-sounding.",
              fluency: 13,
              confidence: 7,
              money: 0,
              nextTurnIndex: -1
            }
          ],
          advanced_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Oh, no worries at all! Please, take your time. If you don't mind, could you slide those napkins my way when you have a free hand?",
              feedback: "Perfect natural phrasing and physical cue!",
              explanation: "Idioms: 'slide them my way', 'when you have a free hand'. Highly comfortable.",
              fluency: 18,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "professional",
              text: "Not at all. If it is convenient, could you perhaps pass me the cocoa dusting powder once you've concluded? Thank you.",
              feedback: "Magnificent executive tone.",
              explanation: "Uses elevated nouns and actions like 'cocoa dusting powder', 'once you've concluded'.",
              fluency: 16,
              confidence: 8,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "C",
              type: "confident",
              text: "All good! Keep doing your thing. If I could just swap past you to grab some sugar packets, I'll be out of your hair in a flash.",
              feedback: "Stellar native confidence!",
              explanation: "Uses excellent idioms representing high fluency: 'keep doing your thing', 'out of your hair in a flash'.",
              fluency: 17,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            }
          ]
        }
      ]
    }
  ],
  restaurant_dining: [
    {
      id: "cafe_seating_negotiations",
      title: "2. Restaurant • The Dining Table (Menu, Ordering & Small Talk)",
      bgClass: "sprite-bg-cafe-patio",
      bgImageUrl: animeRestaurantBg,
      description: "Settle into your central table. Browse the digital or paper dinner menu, place custom plate orders, and engage in social dining small talk.",
      npc_name: "Server Yuki",
      npc_gender: "female",
      npc_accent: "UK",
      npc_avatar_class: "sprite-avatar-marcus",
      npc_portrait_class: "portrait-marcus",
      npcOpenSceneUrl: yukiAvatar,
      turns: [
        {
          npc_message: "Oh! Hello there. Sorry, I have my heavy backpack sitting on this adjacent chair. Were you looking for a place to sit?",
          beginner_choices: [
            {
              id: "A",
              type: "correct",
              text: "Yes. Is this chair free? I need to sit here.",
              feedback: "Grammatically correct and direct.",
              explanation: "Safely requests seat check without complex spatial terms.",
              fluency: 10,
              confidence: 5,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "incorrect",
              text: "Throw away bag. Me buttocks require wood chair right now.",
              feedback: "Very bizarre and rude phrasing!",
              explanation: "Demanding someone 'throw away bag' because your 'buttocks require wood' is highly offensive.",
              fluency: 2,
              confidence: -3,
              money: 0,
              nextTurnIndex: 1
            }
          ],
          intermediate_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Hi! Yes, is anybody currently occupying this seat, or would you mind if I pull it over to my table?",
              feedback: "Fabulous spatial negotiation!",
              explanation: "Uses polite phrasing ('anybody currently occupying', 'would you mind if I').",
              fluency: 14,
              confidence: 7,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "neutral",
              text: "Hello. I was wondering if this extra chair is open, or are you saving it for a friend?",
              feedback: "Clear and respectful check.",
              explanation: "Identifies alternative possibilities safely ('saving it for a friend').",
              fluency: 12,
              confidence: 6,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "C",
              type: "direct",
              text: "Hey! If no one is using this chair, do you mind if I grab it?",
              feedback: "Straightforward and friendly.",
              explanation: "Efficient, modern check suitable for busy urban cafes.",
              fluency: 13,
              confidence: 6,
              money: 0,
              nextTurnIndex: 1
            }
          ],
          advanced_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Hi there! Yes, the cafe is completely packed today. Is this chair free, or are you expecting company?",
              feedback: "Remarkably comfortable and highly fluent!",
              explanation: "Uses excellent real-world collocations: 'completely packed', 'expecting company'.",
              fluency: 18,
              confidence: 9,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "professional",
              text: "Hello. If you have no immediate objections, I would like to inquire if this adjacent chair is vacant for public use?",
              feedback: "Highly formal, articulate inquiry.",
              explanation: "Utilizes academic level spatial markers: 'immediate objections', 'adjacent chair is vacant'.",
              fluency: 16,
              confidence: 8,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "C",
              type: "confident",
              text: "Hey! Definitely trying to snag a spot. Is it cool if I hijack this seat, or were you using it as a footrest?",
              feedback: "Fabulous casual humor!",
              explanation: "Uses bright, confident banter ('snag a spot', 'hijack this seat', 'footrest') which develops instant social warmth.",
              fluency: 17,
              confidence: 9,
              money: 0,
              nextTurnIndex: 1
            }
          ]
        },
        {
          npc_message: "Oh, it's all yours! Let me move my bag out of the way. (You sit and work for 30 minutes. You need to use the washroom, but don't want to pack up your laptop.) 'Are you getting comfortable there?' Liam asks.",
          isNpcEnd: false,
          beginner_choices: [
            {
              id: "A",
              type: "correct",
              text: "Yes, thank you. Can you look at my laptop for two minutes, please? I must go to toilet.",
              feedback: "Clear request, slightly basic.",
              explanation: "Shares the core need directly, though saying 'look at my laptop' is slightly less idioms-based.",
              fluency: 10,
              confidence: 5,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "incorrect",
              text: "Watch this computer. If steel happens, I penalize you.",
              feedback: "Threatening and extremely toxic!",
              explanation: "Accusing/threatening a stranger with 'I penalize you' is highly hostile.",
              fluency: 2,
              confidence: -3,
              money: 0,
              nextTurnIndex: -1
            }
          ],
          intermediate_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Very cozy, thanks! Actually, would you mind keeping an eye on my laptop for just a quick second while I wash my hands?",
              feedback: "Excellent trust-negotiator!",
              explanation: "Uses typical standard terminology: 'keeping an eye on', 'quick second'.",
              fluency: 15,
              confidence: 8,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "neutral",
              text: "Yes, thank you. Could you watch my belongings for a moment? I will return shortly.",
              feedback: "Clear, structured request.",
              explanation: "Fomal neutral standard, very safe.",
              fluency: 12,
              confidence: 6,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "C",
              type: "direct",
              text: "I am! Hey, sorry to bother, but can you guard my laptop for a minute while I step away?",
              feedback: "Friendly and highly active.",
              explanation: "Uses 'guard my laptop' and 'step away' naturally.",
              fluency: 14,
              confidence: 7,
              money: 0,
              nextTurnIndex: -1
            }
          ],
          advanced_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Definitely! The Wi-Fi is great here. Hey, if it's not too much of a bother, would mind keeping an eye on my setup for a hot minute while I use the restroom? I'd really appreciate it!",
              feedback: "Exceptional! Impeccable real-life fluency indicators.",
              explanation: "Native phrasings: 'keeping an eye on', 'setup', 'for a hot minute', 'step away'. Gives immediate social reassurance.",
              fluency: 18,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "professional",
              text: "Indeed, it is a highly conducive work environment. If it does not impose upon you, would you be willing to supervise my laptop briefly while I step away? That would be exceedingly helpful.",
              feedback: "Astonishingly elegant and sophisticated vocabulary.",
              explanation: "Speaks with formal prestige: 'highly conducive', 'impose upon you', 'supervise my laptop', 'exceedingly helpful'.",
              fluency: 16,
              confidence: 8,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "C",
              type: "confident",
              text: "Totally! Making great progress. Hey, do you mind watching my stuff for a quick washroom break? I promise there'll be no alarms or escape attempts!",
              feedback: "Fabulous, witty confidence!",
              explanation: "Combines warm humor ('no alarms or escape attempts') with comfortable local trust-building slang ('watching my stuff').",
              fluency: 17,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            }
          ]
        }
      ]
    }
  ],
  restaurant_checkout: [
    {
      id: "cafe_restroom_signage",
      title: "5. Restaurant • Checkout (Bill, Split Bill, Paying & Farewell)",
      bgClass: "sprite-bg-cafe",
      bgImageUrl: animeRestaurantBg,
      description: "Concluding your dining experience: ask for your bill receipt, coordinate split-bill card transaction, pay, and say farewell.",
      npc_name: "Cashier Yuki",
      npc_gender: "female",
      npc_accent: "UK",
      npc_avatar_class: "sprite-avatar-emma",
      npc_portrait_class: "sprite-portrait-emma",
      npcOpenSceneUrl: yukiAvatar,
      turns: [
        {
          npc_message: "Oh, hi! Tidying up your laptop? Let me know if you need any trash bins or take-out boxes!",
          beginner_choices: [
            {
              id: "A",
              type: "correct",
              text: "No, thank you. Where is the restroom?",
              feedback: "Simple, highly clear navigation check.",
              explanation: "'Where is the restroom' is the most instantly recognized form for finding facilities.",
              fluency: 10,
              confidence: 5,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "incorrect",
              text: "Where is sewage hole to empty human waste liquid?",
              feedback: "Extremely off-putting and weird vocabulary!",
              explanation: "Using words like 'sewage hole' or 'human waste liquid' is incredibly inappropriate and shocking in public.",
              fluency: 1,
              confidence: -4,
              money: 0,
              nextTurnIndex: 1
            }
          ],
          intermediate_choices: [
            {
              id: "A",
              type: "friendly",
              text: "I'm all set, thank you! But on my way out, could you point me in the direction of the restrooms?",
              feedback: "Delightful transitional check!",
              explanation: "Polite denial followed by navigational phrase: 'point me in the direction of'.",
              fluency: 14,
              confidence: 7,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "neutral",
              text: "No trash boxes needed. Could you tell me where the public restrooms are, please?",
              feedback: "Clear, correct question format.",
              explanation: "Pragmatic, functional neutral statement.",
              fluency: 12,
              confidence: 6,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "C",
              type: "direct",
              text: "I'm good, thanks! Just quick question, where's the washroom located?",
              feedback: "Fast-paced and polite.",
              explanation: "Uses conversational shorthand 'Just quick question' and 'washroom' naturally.",
              fluency: 13,
              confidence: 6,
              money: 0,
              nextTurnIndex: 1
            }
          ],
          advanced_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Oh, I'm actually all set, thank you! But before I head out, would you mind pointing me in the direction of the restrooms?",
              feedback: "Absolute gold standard!",
              explanation: "Transitions flawlessly: 'before I head out', 'would you mind pointing me in the direction of'.",
              fluency: 18,
              confidence: 9,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "B",
              type: "professional",
              text: "No boxes are required, thank you. However, prior to my departure, could you kindly indicate the coordinates of the restroom facilities?",
              feedback: "Dazzling business vocabulary.",
              explanation: "Uses professional markers: 'prior to my departure', 'kindly indicate the facilities'.",
              fluency: 16,
              confidence: 8,
              money: 0,
              nextTurnIndex: 1
            },
            {
              id: "C",
              type: "confident",
              text: "I'm golden, thanks! Hey, just need a quick restroom pit stop before I hit the road, which way should I head?",
              feedback: "Full of colorful, fluent conversational style!",
              explanation: "Uses great casual verbs and idioms: 'I'm golden' (I am doing great / no requests), 'pit stop', 'before I hit the road' (before departing).",
              fluency: 17,
              confidence: 9,
              money: 0,
              nextTurnIndex: 1
            }
          ]
        },
        {
          npc_message: "They're just around the corner to the right! Also, there's a quick four-digit keycode on the sign next to the latch: 2026. Have a wonderful rest of your day!",
          isNpcEnd: false,
          beginner_choices: [
            {
              id: "A",
              type: "correct",
              text: "Perfect, thank you! Goodbye.",
              feedback: "Simple, easy parting phrase.",
              explanation: "Courteous, closes the interaction.",
              fluency: 10,
              confidence: 5,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "incorrect",
              text: "Goodbye forever. I lock myself in toilet.",
              feedback: "highly dramatic and unnecessary parting statement.",
              explanation: "Makes the barista quite concerned!",
              fluency: 2,
              confidence: -1,
              money: 0,
              nextTurnIndex: -1
            }
          ],
          intermediate_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Perfect, caught it! Thanks for your help and have a fantastic afternoon!",
              feedback: "Superb, energetic feedback!",
              explanation: "Applies 'caught it' (meaning understood) and returns positive day feedback.",
              fluency: 14,
              confidence: 7,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "neutral",
              text: "Excellent, I noticed the code. Thank you for your assistance, keep safe.",
              feedback: "Polite and structured.",
              explanation: "Clear expression of appreciation and understanding.",
              fluency: 12,
              confidence: 6,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "C",
              type: "direct",
              text: "Got it! Thanks code, really appreciate it. Take care!",
              feedback: "Very friendly and direct.",
              explanation: "Uses shorter shorthand 'Got it', 'Take care!' comfortably.",
              fluency: 13,
              confidence: 6,
              money: 0,
              nextTurnIndex: -1
            }
          ],
          advanced_choices: [
            {
              id: "A",
              type: "friendly",
              text: "Ah, gorgeous! Thanks for the heads-up on the keycode. Have an absolutely wonderful rest of the week, take care!",
              feedback: "Extremely native-sounding parting courtesy!",
              explanation: "Brilliant: 'heads-up on the keycode' and 'wonderful rest of the week'. Indicates supreme cultural assimilation.",
              fluency: 18,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "B",
              type: "professional",
              text: "Understood, and thank you for bringing the passcode to my attention. I wish you a very productive and pleasant afternoon.",
              feedback: "Stellar, gracious professional parting.",
              explanation: "Highly articulate administrative syntax: 'bringing the passcode to my attention', 'pleasant afternoon'.",
              fluency: 16,
              confidence: 8,
              money: 0,
              nextTurnIndex: -1
            },
            {
              id: "C",
              type: "confident",
              text: "Awesome, safe to say I would've been locked out without that tip! Thanks a million, Emma, have a good one!",
              feedback: "Marvelous, authentic casual confidence!",
              explanation: "Expresses funny relief and absolute mastery of common idioms: 'would've been locked out without that tip', 'thanks a million', 'have a good one!'.",
              fluency: 17,
              confidence: 9,
              money: 0,
              nextTurnIndex: -1
            }
          ]
        }
      ]
    }
  ]
};
